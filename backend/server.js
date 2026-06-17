require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');
const { seedData } = require('./utils/seed');
const { seedRandom } = require('./utils/seedRandom');

const app = express();

// Connect to MongoDB then auto-seed demo data + random data
connectDB().then(async () => {
  await seedData();
  await seedRandom();
}).catch(console.error);

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/drawings', require('./routes/drawings'));
app.use('/api/materials', require('./routes/materials'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/vendors', require('./routes/vendors'));
app.use('/api/contractors', require('./routes/contractors'));
app.use('/api/deliveries', require('./routes/deliveries'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/stores',    require('./routes/stores'));
app.use('/api/payments',  require('./routes/payments'));
app.use('/api/weather',      require('./routes/weather'));
app.use('/api/budget',      require('./routes/budget'));
app.use('/api/schedule',    require('./routes/schedule'));
app.use('/api/site-photos', require('./routes/sitePhotos'));
app.use('/api/reports',     require('./routes/reports'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Construction App API is running', timestamp: new Date() });
});

// Manual re-seed random data (for demo refresh)
app.post('/api/seed-demo', async (req, res) => {
  try {
    const result = await seedRandom();
    res.json({ success: true, message: 'Demo data refreshed!', ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message || 'Server Error' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
