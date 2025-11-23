const pool = require('../config/db');

class Seat {
  static async getSeatsByHallId(hallId) {
    try {
      const result = await pool.query(
        `SELECT * FROM seats WHERE hall_id = $1 ORDER BY row_letter, seat_number`,
        [hallId]
      );
      return result.rows;
    } catch (err) {
      throw new Error(`Error fetching seats: ${err.message}`);
    }
  }

  static async getSeatById(seatId) {
    try {
      const result = await pool.query(
        `SELECT * FROM seats WHERE seat_id = $1`,
        [seatId]
      );
      return result.rows[0] || null;
    } catch (err) {
      throw new Error(`Error fetching seat: ${err.message}`);
    }
  }

  static async getSeatsForShowtime(showtimeId) {
  try {
    const result = await pool.query(
      `
      SELECT 
        s.seat_id,
        s.row_letter,
        s.seat_number,
        s.hall_id,
        CASE 
          WHEN bs.seat_id IS NULL THEN false
          ELSE true
        END AS is_booked
      FROM seats s
      LEFT JOIN booked_seats bs 
        ON s.seat_id = bs.seat_id 
       AND bs.showtime_id = $1   
      WHERE s.hall_id = (
        SELECT hall_id FROM showtimes WHERE showtime_id = $1
      )
      ORDER BY s.row_letter, s.seat_number;
      `,
      [showtimeId]
    );
    return result.rows;
  } catch (err) {
    throw new Error(`Error fetching seats for showtime: ${err.message}`);
  }
}
}

module.exports = Seat;
