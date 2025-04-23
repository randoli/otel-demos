const { metrics } = require("./tracing");

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

// Initialize env vars
dotenv.config({ path: "../.env" });

// Enable debug logging for MongoDB operations
// mongoose.set("debug", true);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 8080;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/otelBrew";
const DB_NAME = process.env.DB_NAME || "otelBrew";

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose
  .connect(MONGODB_URI, {
    dbName: DB_NAME,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("✅ MongoDB Connected");
    console.log("Using DB:", mongoose.connection.name);
    console.log("Using URI (safe):", MONGODB_URI.split("@")[1]); // Don't log full URI with creds
  })
  .catch((err) => console.log("❌ MongoDB Connection Error:", err));

// Define Counter Schema and Model
const counterSchema = new mongoose.Schema({
  espresso: { type: Number, default: 0 },
  coldbrew: { type: Number, default: 0 },
  pastries: { type: Number, default: 0 },
  customers: { type: Number, default: 0 },
});

const Counter = mongoose.model("Counter", counterSchema);

// Helper function to initialize or get counter document
async function getCounterDoc() {
  let counter = await Counter.findOne();
  if (!counter) {
    counter = new Counter();
    await counter.save();
  }
  return counter;
}

// Health Check Route
app.get("/health", (req, res) => {
  res.json({ status: "ok", db: mongoose.connection.name });
});

// GET /counters - Get all counter values
app.get("/counters", async (req, res) => {
  const startTime = Date.now();

  try {
    const counter = await getCounterDoc();

    metrics.serviceTimeHistogram.record(Date.now() - startTime, {
      operation: "getCounters",
    });

    res.json({
      espresso: counter.espresso,
      coldbrew: counter.coldbrew,
      pastries: counter.pastries,
      customers: counter.customers,
    });
  } catch (err) {
    console.error("Error fetching counters:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/counters/reset", async (req, res) => {
  const startTime = Date.now();

  try {
    const counter = await getCounterDoc();
    counter.espresso = 0;
    counter.coldbrew = 0;
    counter.pastries = 0;
    counter.customers = 0;

    await counter.save();

    metrics.serviceTimeHistogram.record(Date.now() - startTime, {
      operation: "resetCounters",
    });

    res.json({
      message: "Counters reset successfully",
      espresso: counter.espresso,
      coldbrew: counter.coldbrew,
      pastries: counter.pastries,
      customers: counter.customers,
    });
  } catch (err) {
    console.error("Error resetting counters:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/counters/:item", async (req, res) => {
  const startTime = Date.now();
  const { item } = req.params;

  try {
    if (!["espresso", "coldbrew", "pastries", "customers"].includes(item)) {
      return res.status(400).json({ error: "Invalid item type" });
    }

    const counter = await getCounterDoc();
    counter[item] += 1;
    await counter.save();

    if (item === "customers") {
      metrics.customerCounter.add(1);
    } else {
      metrics.orderCounter.add(1, { item });
    }

    metrics.serviceTimeHistogram.record(Date.now() - startTime, {
      operation: "incrementCounter",
      item,
    });

    res.json({
      espresso: counter.espresso,
      coldbrew: counter.coldbrew,
      pastries: counter.pastries,
      customers: counter.customers,
    });
  } catch (err) {
    console.error("Error incrementing counter:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port: ${PORT}`);
});
