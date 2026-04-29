require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDB } = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

const app = express();

initializeDB();

const allowedOrigins = [
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
  /^http:\/\/\d{1,3}(?:\.\d{1,3}){3}:\d+$/,
  /^http:\/\/[a-z0-9-]+:\d+$/i,
  'null'
];

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.some((rule) => {
      if (typeof rule === 'string') return rule === origin;
      return rule.test(origin);
    });

    if (isAllowed) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const frontendPath = path.resolve(__dirname, '../../frontend');
app.use(express.static(frontendPath));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/products', require('./routes/products'));
app.use('/api/branches', require('./routes/branches'));
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/delivery', require('./routes/delivery'));
app.use('/api/payments', require('./routes/payments'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Simba Supermarket API is running', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🦁 Simba Supermarket API running on http://localhost:${PORT}`);
  console.log(`📦 Health check: http://localhost:${PORT}/api/health\n`);
});
