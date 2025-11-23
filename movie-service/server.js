const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { startPaymentConsumer } = require('./consumers/paymentConsumer');
dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Import routes
const movieRoutes = require('./routes/movieRoutes');

// Register routes
app.use('/api/movies', movieRoutes);
const seatRoutes = require('./routes/seatRoutes');
app.use('/api/seats', seatRoutes);

const PORT = process.env.PORT || 4002;

app.listen(PORT, async () => {
  console.log(`movie-service listening on ${PORT}`);
  try { await startPaymentConsumer(); } catch (e) { console.error('MQ start error:', e); }
});
