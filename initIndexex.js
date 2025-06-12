const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGO_URI;

async function createIndexes() {
  const client = new MongoClient(uri, { serverApi: ServerApiVersion.v1 });

  try {
    await client.connect();
    const db = client.db("service_marketplace_db");
    const services = db.collection("services");

    // await services.dropIndex("text_search_index")

    await services.createIndex(
      {
        "_id":"text",
        "title": "text",
        "description": "text",
        "tags": "text",
        "location.city": "text",
        "location.state": "text",
        "sellerId": "text"
      },
      {
        name: "text_search_index",
        weights: {
          "title": 10,        // Highest weight for title matches
          "tags": 8,          // High weight for tag matches
          "description": 5,    // Medium weight for description
          "location.city": 3,  // Lower weight for city
          "location.state": 2  // Lowest weight for state
        },
        default_language: "english"
      }
    );

    // 2. GEOSPATIAL INDEX
    // 2dsphere index for location-based searches
    await services.createIndex(
      { "location.coordinates.coordinates": "2dsphere" },
      { name: "geospatial_index" }
    );

    // 3. CATEGORY AND PRICE INDEX
    // Compound index for category filtering and price range queries
    await services.createIndex(
      {
        "category": 1,
        "price": 1
      },
      { name: "category_price_index" }
    );

    // 4. SELLER PERFORMANCE INDEX
    // Index for seller-specific queries
    await services.createIndex(
      {
        "sellerId": 1,
        "createdAt": -1
      },
      { name: "seller_performance_index" }
    );

    // 5. AVAILABILITY INDEX
    // Compound index for availability-based searches
    await services.createIndex(
      {
        "availability.days": 1,
        "category": 1,
        "location.state": 1
      },
      { name: "availability_index" }
    );

    // 6. DATE RANGE INDEX
    // Index for date-based queries (newest first, recently updated)
    await services.createIndex(
      {
        "createdAt": -1,
        "updatedAt": -1
      },
      { name: "date_range_index" }
    );

    // 7. PRICE RANGE INDEX
    // Index specifically for price filtering and sorting
    await services.createIndex(
      {
        "price": 1,
        "currency": 1
      },
      { name: "price_range_index" }
    );

    // 8. LOCATION STATE INDEX
    // Simple index for state-based filtering
    await services.createIndex(
      { "location.state": 1 },
      { name: "state_index" }
    );

    // 9. COMPOUND SEARCH INDEX
    // Advanced compound index for complex queries
    await services.createIndex(
      {
        "category": 1,
        "location.state": 1,
        "price": 1,
        "availability.days": 1
      },
      { name: "compound_search_index" }
    );

    console.log("✅ Text index created on services collection");

  } catch (err) {
    console.error("❌ Failed to create index:", err);
  } finally {
    await client.close();
  }
}

createIndexes();
