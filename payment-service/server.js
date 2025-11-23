const express = require('express');
const app = express();
require('dotenv').config();

const paymentRoutes = require('./routes/paymentRoutes');
const { connectMQ } = require('./config/mq');  // <-- ADD THIS

app.use(express.json());
app.use('/api/payments', paymentRoutes);

app.get('/api/health', (req, res) => res.json({ service: 'payment', status: 'ok' }));

const PORT = process.env.PORT || 4005;

app.listen(PORT, async () => {
  console.log(`🚀 Payment service running on port ${PORT}`);

  try {
    await connectMQ();        // <-- AND THIS
    console.log("🐇 RabbitMQ ready in payment-service");
  } catch (err) {
    console.error("❌ RabbitMQ connection failed:", err.message);
  }
});
