const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow requests from any frontend port/domain
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const { connectDB, isMongoConnected } = require('./config/mongodb');

// Static files for assets
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));

// API Routes
app.use('/api/products', require('./routes/products'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/banners', require('./routes/banners'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    store: 'PRETUTE E-Commerce Platform API',
    version: '1.1.0',
    database: {
      mongodb: isMongoConnected() ? 'connected' : 'fallback_json_active',
      userStore: isMongoConnected() ? 'MongoDB (Collection: users)' : 'Local JSON Store'
    },
    timestamp: new Date().toISOString()
  });
});

// Serve compiled frontend files if dist exists (Production / Render Web Service)
const frontendDistPath = path.join(__dirname, '../frontend/dist');
const fs = require('fs');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// Start Server & Connect MongoDB
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`=================================================`);
  console.log(`  🌟 PRETUTE E-Commerce API Server Started`);
  console.log(`  🚀 URL: http://localhost:${PORT}`);
  console.log(`  📡 Health: http://localhost:${PORT}/api/health`);
  console.log(`=================================================`);


  // Initialize MongoDB connection
  await connectDB();
});

