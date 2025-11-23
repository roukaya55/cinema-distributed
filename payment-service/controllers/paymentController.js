const Payment = require('../models/paymentModel');
const pool = require('../config/db');    
const { publishEvent } = require('../config/mq');  // for RabbitMQ later
const axios = require('axios');

// POST /api/payments
exports.createPayment = async (req, res) => {
  try {
    const userId = req.body.userId || req.user?.userId;
    const { amount, method = 'Credit Card', items = [] } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({ error: 'userId and amount are required' });
    }

    // insert the payment into your existing table
    const result = await pool.query(
      `INSERT INTO payments (booking_id, user_id, amount, method, status)
       VALUES ($1, $2, $3, $4, 'Pending')
       RETURNING *`,
      [null, userId, amount, method]
    );

    const payment = result.rows[0];
    return res.status(201).json({
      message: 'Payment initiated',
      payment
    });
  } catch (err) {
    console.error('Payment creation error:', err);
    res.status(500).json({ error: 'Payment creation failed', details: err.message });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { status = 'Success', items = [], userId, amount, method } = req.body;

    const updated = await pool.query(
      `UPDATE payments SET status=$1 WHERE payment_id=$2 RETURNING *`,
      [status, id]
    );
    if (!updated.rows[0]) return res.status(404).json({ error: 'Payment not found' });

    const payment = updated.rows[0];

    // ✅ If payment succeeded, publish event and call blockchain
    if (status === 'Success') {
      const payload = {
        paymentId: id,
        userId: userId ?? payment.user_id,
        amount: amount ?? Number(payment.amount),
        method: method ?? payment.method,
        status: 'Success',
        items: Array.isArray(items) ? items : [],
        timestamp: new Date().toISOString()
      };

      // Publish RabbitMQ event
      await publishEvent('payment.success', payload);

      // Add block to blockchain
      try {
        const blockchainUrl = process.env.BLOCKCHAIN_URL || 'http://localhost:4006/api/blockchain/add';
        await axios.post(blockchainUrl, {
          type: 'payment',
          refId: id,
          data: payload
        });
        console.log('🧱 Blockchain block added for payment:', id);
      } catch (chainErr) {
        console.error('⚠️ Blockchain service unreachable:', chainErr.message);
      }
    }

    return res.json({ message: `Payment marked as ${status}` });
  } catch (err) {
    console.error('Payment status update error:', err);
    return res.status(500).json({ error: err.message });
  }
};

// GET /api/payments
exports.getPayments = async (req, res) => {
  try {
    const rows = await Payment.getByUser(req.user.userId);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/payments/:id
exports.getPaymentById = async (req, res) => {
  try {
    const row = await Payment.getById(req.params.id);
    if (!row) return res.status(404).json({ error: 'Payment not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
