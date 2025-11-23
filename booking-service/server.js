const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./config/db');

const bookingRoutes = require('./routes/bookingRoutes');
const cartRoutes = require('./routes/cartRoutes');
const { startPaymentConsumer } = require('./consumers/paymentConsumer');
const app = express();
app.use(cors());
app.use(express.json());

// Base routes
app.use('/api/bookings', bookingRoutes);
app.use('/api/cart', cartRoutes);

// Health check
app.get('/', (req, res) => {
  res.send('🎬 Booking Service is running!');
});

// Test DB connection
app.get('/health/db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ message: 'Database connected', time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ error: 'Database not reachable', details: err.message });
  }
});

const PORT = process.env.PORT || 4003;
app.listen(PORT, async () => {
  console.log(`booking-service listening on ${PORT}`);
  try { await startPaymentConsumer(); } catch (e) { console.error('MQ start error:', e); }
});