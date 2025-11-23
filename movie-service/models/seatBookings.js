// movie-service/models/seatBookings.js
const pool = require('../config/db');

// bulk insert booked seats for a showtime (movie_db)
async function addBookedSeats(showtimeId, seatIds = []) {
  if (!seatIds.length) return;

  // VALUES ($1, $2), ($1, $3), ($1, $4), ...
  const values = seatIds
    .map((_, i) => `($1, $${i + 2})`)
    .join(', ');

  const params = [showtimeId, ...seatIds];

  await pool.query(
    `INSERT INTO booked_seats (showtime_id, seat_id)
     VALUES ${values}
     ON CONFLICT (showtime_id, seat_id) DO NOTHING`,
    params
  );
}

module.exports = { addBookedSeats };
