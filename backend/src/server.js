require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

/**
 * Startup Sequence:
 * 1. Load environment variables (dotenv)
 * 2. Connect to MongoDB
 * 3. Start Express server
 */
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();