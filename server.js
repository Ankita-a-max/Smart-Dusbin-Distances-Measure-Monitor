const express = require('express');
const { SerialPort } = require('serialport');
const { ReadlineParser } = require('@serialport/parser-readline');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/smartdustbin', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Define Dustbin Status Schema
const dustbinStatusSchema = new mongoose.Schema({
  status: String,
  distance: Number,
  timestamp: { type: Date, default: Date.now }
});

const DustbinStatus = mongoose.model('DustbinStatus', dustbinStatusSchema);

// Setup Serial Communication with Arduino
const port = new SerialPort({
  path: 'COM3',
  baudRate: 9600
});

const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

// Current state for real-time access
let currentStatus = {
  status: 'closed',
  distance: 0,
  timestamp: new Date()
};

// Parse Arduino data
parser.on('data', async (data) => {
  try {
    // Parse the distance from Arduino output
    const distanceMatch = data.match(/Distance: (\d+)/);
    
    if (distanceMatch) {
      const distance = parseInt(distanceMatch[1]);
      const status = distance < 10 ? 'open' : 'closed';
      
      currentStatus = {
        status,
        distance,
        timestamp: new Date()
      };
      
      // Save to MongoDB
      const dustbinStatus = new DustbinStatus(currentStatus);
      await dustbinStatus.save();
      
      console.log('Saved status:', currentStatus);
    }
  } catch (error) {
    console.error('Error processing Arduino data:', error);
  }
});

// API Routes
app.get('/api/status', (req, res) => {
  res.json(currentStatus);
});

app.get('/api/history', async (req, res) => {
  try {
    // Get the last 10 status entries
    const history = await DustbinStatus.find()
      .sort({ timestamp: -1 })
      .limit(10);
    
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Handle errors for serial port
port.on('error', (err) => {
  console.error('Serial port error:', err);
});