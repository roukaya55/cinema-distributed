const pool = require('../config/db');

// ✅ Get all wishlist items for a user
async function getWishlistByUserId(userId) {
  const result = await pool.query(
    `SELECT wishlist_id, movie_id, created_at
     FROM wishlist
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
}

// ✅ Add a movie to wishlist
async function addToWishlist(userId, movieId) {
  await pool.query(
    `INSERT INTO wishlist (user_id, movie_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`, // avoids duplicates
    [userId, movieId]
  );
}

// ✅ Remove from wishlist
async function removeFromWishlist(userId, movieId) {
  await pool.query(
    `DELETE FROM wishlist
     WHERE user_id = $1 AND movie_id = $2`,
    [userId, movieId]
  );
}

module.exports = {
  getWishlistByUserId,
  addToWishlist,
  removeFromWishlist
};
