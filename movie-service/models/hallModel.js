const pool = require('../config/db');

class Hall {
  static async getAll() {
    try {
      const result = await pool.query('SELECT * FROM halls ORDER BY hall_id');
      return result.rows;
    } catch (err) {
      throw new Error(`Error fetching halls: ${err.message}`);
    }
  }

  static async getById(hallId) {
    try {
      const result = await pool.query(
        'SELECT * FROM halls WHERE hall_id = $1',
        [hallId]
      );
      return result.rows[0];
    } catch (err) {
      throw new Error(`Error fetching hall by ID: ${err.message}`);
    }
  }
}

module.exports = Hall;
