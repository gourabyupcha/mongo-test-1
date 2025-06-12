const express = require('express');
const router = express.Router();
const { getServiceCollection } = require('../db');
const redisClient = require('../cache');
const crypto = require('crypto'); // For creating cache keys


// POST /api/services - Create a new service listing
router.post('/', async (req, res) => {
    const service = req.body;
    service.createdAt = new Date();

    const requiredFields = ["title", "category", "price", "location", "sellerId"];
    const missing = requiredFields.filter(field => !service[field]);
    if (missing.length) {
        return res.status(400).json({ message: `Missing fields: ${missing.join(', ')}` });
    }

    try {
        const collection = getServiceCollection();
        const result = await collection.insertOne(service);
        res.status(201).json({ message: "Service created", id: result.insertedId });
    } catch (err) {
        console.error("Error inserting service:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

// GET /api/services - List or search services
router.get('/', async (req, res) => {
    const {
        q,                 // Text search keyword
        category,
        location,          // Assume this is state
        minPrice,
        maxPrice,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 10,
        lat,
        lng,
        radius = 10000     // in meters (default: 10km)
    } = req.query;

    try {
        // 🔐 Create cache key
        const cacheKey = crypto
            .createHash('md5')
            .update(JSON.stringify(req.query))
            .digest('hex');

        // ⚡ Check Redis cache
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            return res.json(JSON.parse(cached));
        }

        const services = getServiceCollection();

        let query = {};
        let projection = {};
        let sortOptions = {};

        // 📝 Text search
        if (q) {
            query.$text = { $search: q };
            projection = { score: { $meta: 'textScore' } };
            sortOptions = { score: { $meta: 'textScore' } };
        } else {
            sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
        }

        // 📂 Category filter
        if (category) {
            query.category = category;
        }

        // 🧭 Location filter (by state)
        if (location) {
            query["location.state"] = location;
        }

        // 💰 Price filter
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseFloat(minPrice);
            if (maxPrice) query.price.$lte = parseFloat(maxPrice);
        }

        // 📍 Geospatial filter
        if (lat && lng) {
            query["location.coordinates"] = {
                $near: {
                    $geometry: {
                        type: "Point",
                        coordinates: [parseFloat(lng), parseFloat(lat)]
                    },
                    $maxDistance: parseInt(radius),
                    $minDistance: 0
                }
            };
        }

        // 📄 Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // 🔎 Run query
        const cursor = services.find(query, { projection })
            .sort(sortOptions)
            .skip(skip)
            .limit(parseInt(limit));

        const results = await cursor.toArray();
        const total = await services.countDocuments(query);

        const responseData = {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            results
        };

        // 📦 Cache the response for 5 minutes
        await redisClient.setEx(cacheKey, 300, JSON.stringify(responseData));

        res.json(responseData);

    } catch (error) {
        console.error("❌ Search failed:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});
module.exports = router;
