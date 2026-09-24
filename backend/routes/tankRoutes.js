const express = require("express");
const TankReading = require("../models/Tankreading");

const router = express.Router();

// Save a tank reading
router.post("/readings", async (req, res) => {
  try {
    const { distance, waterLevel, motorStatus, source } = req.body;

    const reading = new TankReading({
      distance,
      waterLevel,
      motorStatus,
      source
    });

    const savedReading = await reading.save();

    res.status(201).json({
      message: "Tank reading saved successfully",
      data: savedReading
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to save tank reading",
      error: error.message
    });
  }
});

// Get all tank readings
router.get("/readings", async (req, res) => {
  try {
    const readings = await TankReading
      .find()
      .sort({ createdAt: -1 });

    res.json({
      message: "Tank readings fetched successfully",
      data: readings
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch tank readings",
      error: error.message
    });
  }
});

module.exports = router;