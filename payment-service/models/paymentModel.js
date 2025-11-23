const pool = require('../config/db');

class Payment {
  // create a new payment
  static async create(userId, bookingId, amount, method) {
    const result = await pool.query(
      `INSERT INTO payments (user_id, booking_id, amount, method, status)
       VALUES ($1, $2, $3, $4, 'Pending')
       RETURNING *`,
      [userId, bookingId, amount, method]
    );
    return result.rows[0];
  }

  // update status (success / failed)
  static async updateStatus(paymentId, status) {
    await pool.query(
      `UPDATE payments SET status = $1 WHERE payment_id = $2`,
      [status, paymentId]
    );
  }

  // get payments of user
  static async getByUser(userId) {
    const result = await pool.query(
      `SELECT * FROM payments WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return result.rows;
  }

  // get payment by id
  static async getById(id) {
    const result = await pool.query(
      `SELECT * FROM payments WHERE payment_id = $1`,
      [id]
    );
    return result.rows[0];
  }
}

module.exports = Payment;
