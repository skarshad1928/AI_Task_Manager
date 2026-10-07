require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const mongoose = require("mongoose");
const app = require("./app");

const port = Number(process.env.PORT) || 5000;

async function start() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is missing. Set it in server/.env.");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  app.listen(port, "0.0.0.0", () => {
    console.log(`API listening on port ${port}`);
  });
}

if (require.main === module) {
  start().catch((error) => {
    console.error(`Server startup failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { start };
