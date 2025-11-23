// auth-service/models/tokenModel.js
const pool = require('../config/db');

async function findTokenByUserId(userId) {
  try {
    const result = await pool.query(
      'SELECT token FROM tokens WHERE user_id = $1',
      [userId]
    );
    return result.rows[0];
  } catch (err) {
    console.error('Database error in findTokenByUserId:', err);
    throw err;
  }
}

async function createToken(userId, token) {
  try {
    await pool.query(
      'INSERT INTO tokens (user_id, token) VALUES ($1, $2)',
      [userId, token]
    );
  } catch (err) {
    console.error('Database error in createToken:', err);
    throw err;
  }
}

async function deleteToken(userId, token) {
  try {
    await pool.query(
      'DELETE FROM tokens WHERE user_id = $1 AND token = $2',
      [userId, token]
    );
  } catch (err) {
    console.error('Database error in deleteToken:', err);
    throw err;
  }
}

module.exports = { findTokenByUserId, createToken, deleteToken };
