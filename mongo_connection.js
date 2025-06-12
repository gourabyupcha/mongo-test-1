// db.js

require('dotenv').config(); // Loads environment variables from .env file
const { MongoClient, ServerApiVersion } = require('mongodb');

// Load MongoDB URI from environment
const uri = process.env.MONGO_URI;

// Create a new MongoClient with Server API version 1
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  },
  tls: true // Optional — only needed if you're connecting to a secure cluster
  // No need for certifi
});

// Connect to MongoDB and ping the server
async function connectToMongoDB() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  } finally {
    await client.close(); // Optional: remove if you want to keep the connection open
  }
}

connectToMongoDB();
