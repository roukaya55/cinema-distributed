const pool = require('../config/db');
const Booking = require('./bookingModel');

class Cart {
  // ✅ Add item to cart
  static async add(userId, movieId, showtimeId, seatId) {
    const exists = await pool.query(
      `SELECT * FROM cart_items 
       WHERE showtime_id = $1 AND seat_id = $2`,
      [showtimeId, seatId]
    );
    if (exists.rows.length > 0) {
      throw new Error('Seat already in cart');
    }

    await pool.query(
      `INSERT INTO cart_items (user_id, movie_id, showtime_id, seat_id)
       VALUES ($1, $2, $3, $4)`,
      [userId, movieId, showtimeId, seatId]
    );
  }

  // ✅ Get all items by user
  static async getAllForUser(userId) {
    const result = await pool.query(
      `SELECT * FROM cart_items WHERE user_id = $1 ORDER BY added_at DESC`,
      [userId]
    );
    return result.rows; // movie & seat info will come later from Movie Service
  }

  // ✅ Remove from cart
  static async remove(cartItemId) {
    await pool.query(`DELETE FROM cart_items WHERE cart_item_id = $1`, [cartItemId]);
  }
    // ✅ Clear all cart items for user
  static async clearAllForUser(userId) {
  await pool.query(`DELETE FROM cart_items WHERE user_id = $1`, [userId]);
    }

  // ✅ Checkout (convert cart → bookings)
  static async checkout(userId, paymentMethod) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const items = await client.query(
        `SELECT * FROM cart_items WHERE user_id = $1`,
        [userId]
      );

      for (const item of items.rows) {
        const bookingId = await Booking.create(
          userId,
          item.showtime_id,
          0, // price can be fetched via Movie Service in controller
          paymentMethod
        );
        await Booking.addBookedSeats(bookingId, [item.seat_id], item.showtime_id);
      }

      await client.query(`DELETE FROM cart_items WHERE user_id = $1`, [userId]);
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw new Error(`Checkout failed: ${err.message}`);
    } finally {
      client.release();
    }
  }
}

module.exports = Cart;
