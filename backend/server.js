
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/watertank')
  .then(() => console.log('MongoDB connected successfully'))
  .catch(error => {
    console.error('MongoDB connection failed:', error.message);
  });

// Existing tank routes
try {
  const tankRoutes = require('./routes/tankRoutes');
  app.use('/api/tank', tankRoutes);
  console.log('Tank routes registered successfully');
} catch (error) {
  console.error('Failed to load tank routes:', error.message);
}

const tankDataSchema = new mongoose.Schema({
  overheadLevel: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  boreLevel: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  status: String,
  source: {
    type: String,
    default: 'ESP32'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const TankData =
  mongoose.models.TankData ||
  mongoose.model('TankData', tankDataSchema);

let latestReading = {
  overheadLevel: 80,
  boreLevel: 90,
  status: 'WAITING FOR ESP32 DATA',
  timestamp: new Date()
};

app.get('/api/route-test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend routes are working'
  });
});

// ESP32 live readings
app.post('/api/water-level', async (req, res) => {
  try {
    const { overheadLevel, boreLevel } = req.body;

    if (
      typeof overheadLevel !== 'number' ||
      typeof boreLevel !== 'number' ||
      !Number.isFinite(overheadLevel) ||
      !Number.isFinite(boreLevel) ||
      overheadLevel < 0 || overheadLevel > 100 ||
      boreLevel < 0 || boreLevel > 100
    ) {
      return res.status(400).json({
        success: false,
        message: 'Water levels must be between 0 and 100'
      });
    }

    let status = 'NORMAL';

    if (boreLevel < 15) {
      status = 'BOREWELL DRY - PUMP LOCKED';
    } else if (overheadLevel < 20) {
      status = 'LOW OVERHEAD WATER';
    } else if (overheadLevel >= 95) {
      status = 'TANK FULL';
    }

    const reading = {
      overheadLevel,
      boreLevel,
      status,
      source: 'ESP32',
      timestamp: new Date()
    };

    const savedData = await TankData.create(reading);
    latestReading = reading;

    res.status(200).json({
      success: true,
      message: 'Water-level data saved successfully',
      data: savedData
    });
  } catch (error) {
    console.error('Water-level API error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to save water-level data',
      error: error.message
    });
  }
});

// Manual borewell reading
app.post('/api/manual-borewell', async (req, res) => {
  try {
    const value = Number(req.body.boreLevel);

    if (
      req.body.boreLevel === undefined ||
      req.body.boreLevel === '' ||
      !Number.isFinite(value) ||
      value < 0 ||
      value > 100
    ) {
      return res.status(400).json({
        success: false,
        message: 'Borewell level must be between 0 and 100'
      });
    }

    // Use the latest overhead value, but do not overwrite it.
    const overheadLevel = Number(latestReading.overheadLevel ?? 0);

    let status = 'NORMAL';

    if (value < 15) {
      status = 'BOREWELL DRY - PUMP LOCKED';
    } else if (overheadLevel < 20) {
      status = 'LOW OVERHEAD WATER';
    } else if (overheadLevel >= 95) {
      status = 'TANK FULL';
    }

    const reading = await TankData.create({
      overheadLevel,
      boreLevel: value,
      status,
      source: 'MANUAL',
      timestamp: new Date()
    });

    // Update latest display without pretending ESP32 measured the borewell.
    latestReading = {
      ...latestReading,
      boreLevel: value,
      status,
      timestamp: reading.timestamp
    };

    res.status(201).json({
      success: true,
      message: 'Manual borewell reading saved to MongoDB',
      data: reading
    });
  } catch (error) {
    console.error('Manual borewell API error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to save manual borewell reading',
      error: error.message
    });
  }
});

// Latest reading
app.get('/api/latest', (req, res) => {
  res.json(latestReading);
});

// Reading history
app.get('/api/history', async (req, res) => {
  try {
    const readings = await TankData
      .find()
      .sort({ timestamp: -1 })
      .limit(50);

    res.json({
      success: true,
      count: readings.length,
      data: readings
    });
  } catch (error) {
    console.error('History API error:', error.message);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch reading history',
      error: error.message
    });
  }
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

const PORT = 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
