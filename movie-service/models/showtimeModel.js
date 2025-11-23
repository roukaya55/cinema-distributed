// movie-service/models/showtimeModel.js
const pool = require('../config/db');

class Showtime {
  static async getByMovie(movieId) {
    const result = await pool.query(
      `SELECT s.*, h.name AS hall_name, h.base_price
       FROM showtimes s
       JOIN halls h ON s.hall_id = h.hall_id
       WHERE s.movie_id = $1
       ORDER BY s.show_date, s.start_time`,
      [movieId]
    );
    return result.rows;
  }

  static async getUpcomingMovies() {
    const result = await pool.query(`
      SELECT 
        m.movie_id, 
        m.title, 
        m.genre, 
        m.duration, 
        m.poster_url, 
        s.show_date, 
        s.start_time, 
        s.end_time
      FROM movies m
      INNER JOIN showtimes s ON m.movie_id = s.movie_id
      WHERE s.show_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '2 days')
      ORDER BY s.show_date, s.start_time;
    `);
    return result.rows;
  }
}

module.exports = Showtime;
