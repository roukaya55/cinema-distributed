// movie-service/models/movieModel.js
const pool = require('../config/db');

class Movie {
  static async getAll() {
    const result = await pool.query('SELECT * FROM movies ORDER BY release_date DESC');
    return result.rows;
  }

  static async getById(id) {
    const result = await pool.query('SELECT * FROM movies WHERE movie_id = $1', [id]);
    return result.rows[0];
  }

  static async search(query) {
    try {
      // ILIKE is case-insensitive in PostgreSQL (LIKE is case-sensitive)
      const result = await pool.query(
        `SELECT * FROM movies 
         WHERE title ILIKE $1 OR genre ILIKE $1 
         ORDER BY release_date DESC`,
        [`%${query}%`]
      );
      return result.rows;
    } catch (err) {
      throw new Error(`Search error: ${err.message}`);
    }
  }

  static async create(data) {
    const { title, genre, duration, description, rating, release_date, poster_url, price_multiplier } = data;
    const result = await pool.query(
      `INSERT INTO movies (title, genre, duration, description, rating, release_date, poster_url, price_multiplier)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING movie_id`,
      [title, genre, duration, description, rating, release_date, poster_url, price_multiplier]
    );
    return result.rows[0].movie_id;
  }
}

module.exports = Movie;
