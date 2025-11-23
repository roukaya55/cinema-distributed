const Wishlist = require('../models/wishlistModel');

// ✅ Get user wishlist
exports.getWishlist = async (req, res) => {
  try {
    const list = await Wishlist.getWishlistByUserId(req.user.userId);
    res.json(list);
  } catch (err) {
    console.error("Error loading wishlist:", err);
    res.status(500).json({ error: "Failed to load wishlist" });
  }
};

// ✅ Add movie
exports.addToWishlist = async (req, res) => {
  try {
    const movieId = parseInt(req.params.movieId);
    if (isNaN(movieId)) return res.status(400).json({ error: "Invalid movie ID" });

    await Wishlist.addToWishlist(req.user.userId, movieId);
    res.json({ message: "Movie added to wishlist" });
  } catch (err) {
    console.error("Error adding wishlist:", err);
    res.status(500).json({ error: "Failed to add to wishlist" });
  }
};

// ✅ Remove movie
exports.removeFromWishlist = async (req, res) => {
  try {
    const movieId = parseInt(req.params.movieId);
    if (isNaN(movieId)) return res.status(400).json({ error: "Invalid movie ID" });

    await Wishlist.removeFromWishlist(req.user.userId, movieId);
    res.json({ message: "Movie removed from wishlist" });
  } catch (err) {
    console.error("Error removing wishlist:", err);
    res.status(500).json({ error: "Failed to remove from wishlist" });
  }
};
