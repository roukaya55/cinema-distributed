// auth-service/models/userModel.js
const pool = require('../config/db');

class User {
  static async findByEmail(email) {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      return result.rows[0];
    } catch (err) {
      throw new Error(`Database error (findByEmail): ${err.message}`);
    }
  }

  static async create({ name, email, password, phone = null }) {
    try {
      const result = await pool.query(
        `INSERT INTO users (name, email, password, phone)
         VALUES ($1, $2, $3, $4)
         RETURNING user_id`,
        [name, email, password, phone]
      );
      return result.rows[0].user_id;
    } catch (err) {
      throw new Error(`Create user error: ${err.message}`);
    }
  }

  static async findById(id) {
    try {
      const result = await pool.query(
        'SELECT * FROM users WHERE user_id = $1',
        [id]
      );
      return result.rows[0];
    } catch (err) {
      throw new Error(`Database error (findById): ${err.message}`);
    }
  }

  static async getUserById(userId) {
    try {
      const result = await pool.query(
        'SELECT user_id AS id, name, email, phone FROM users WHERE user_id = $1',
        [userId]
      );
      return result.rows[0];
    } catch (err) {
      throw new Error(`Database error (getUserById): ${err.message}`);
    }
  }

  static async updateUserProfile({ userId, fullName, email, phone }) {
    try {
      await pool.query(
        `UPDATE users
         SET name = $1, email = $2, phone = $3
         WHERE user_id = $4`,
        [fullName, email, phone, userId]
      );
    } catch (err) {
      throw new Error(`Update profile error: ${err.message}`);
    }
  }

  static async updatePassword({ userId, hashed }) {
    try {
      await pool.query(
        'UPDATE users SET password = $1 WHERE user_id = $2',
        [hashed, userId]
      );
    } catch (err) {
      throw new Error(`Update password error: ${err.message}`);
    }
  }
}

module.exports = User;
