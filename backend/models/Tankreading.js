const mongoose = require("mongoose");

const tankReadingSchema = new mongoose.Schema({
  distance: Number,
  waterLevel: Number,
  motorStatus: String,
  source: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("TankReading", tankReadingSchema);