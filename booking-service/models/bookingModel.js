const pool = require('../config/db');

class Booking {
  // ✅ Create a booking (after checkout)
  static async create(userId, showtimeId, price, paymentMethod) {
    const result = await pool.query(
      `INSERT INTO bookings (user_id, showtime_id, price, payment_method, status)
       VALUES ($1, $2, $3, $4, 'Upcoming')
       RETURNING booking_id`,
      [userId, showtimeId, price, paymentMethod]
    );
    return result.rows[0].booking_id;
  }

  // ✅ Link seats to a booking
  static async addBookedSeats(bookingId, seatIds, showtimeId) {
    const insertPromises = seatIds.map(seatId => {
      return pool.query(
        `INSERT INTO booked_seats (booking_id, seat_id, showtime_id)
         VALUES ($1, $2, $3)`,
        [bookingId, seatId, showtimeId]
      );
    });
    await Promise.all(insertPromises);
  }

  // ✅ Get bookings by user
  static async getBookingsByUser(userId, status = null) {
    let query = `SELECT * FROM bookings WHERE user_id = $1`;
    const values = [userId];

    if (status) {
      query += ` AND status = $2`;
      values.push(status);
    }

    query += ` ORDER BY booking_date DESC`;

    const result = await pool.query(query, values);
    return result.rows; // later we enrich with movie + showtime details via Movie Service
  }

  // ✅ Cancel a booking
  static async cancelBooking(bookingId, userId) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM booked_seats WHERE booking_id = $1', [bookingId]);
      const result = await client.query(
        `UPDATE bookings 
         SET status = 'Cancelled' 
         WHERE booking_id = $1 AND user_id = $2 
         AND status = 'Upcoming'`,
        [bookingId, userId]
      );
      await client.query('COMMIT');
      return result.rowCount > 0;
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`Cancel booking failed: ${err.message}`);
    } finally {
      client.release();
    }
  }

  // ✅ Booking details (basic data only)
  static async getBookingById(bookingId) {
    const result = await pool.query(
      `SELECT * FROM bookings WHERE booking_id = $1`,
      [bookingId]
    );
    return result.rows[0];
  }

  // ✅ Stats: total bookings
  static async getTotalBookings(userId) {
    const result = await pool.query(
      'SELECT COUNT(*) AS total FROM bookings WHERE user_id = $1',
      [userId]
    );
    return parseInt(result.rows[0].total);
  }

  // ✅ Stats: total spent
  static async getTotalSpent(userId) {
    const result = await pool.query(
      `SELECT COALESCE(SUM(price), 0) AS total_spent
       FROM bookings
       WHERE user_id = $1 AND status = 'Completed'`,
      [userId]
    );
    return parseFloat(result.rows[0].total_spent);
  }
}

module.exports = Booking;
