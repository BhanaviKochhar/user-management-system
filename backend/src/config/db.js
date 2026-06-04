const mongoose = require("mongoose");
/**
 * Connects to MongoDB using the URI from environment variables.
 * Exits the process if connection fails — app cannot run without DB.
 */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB Connection Failed:", error.message);

    // Stop application if DB connection fails
    process.exit(1);
  }
};

module.exports = connectDB;