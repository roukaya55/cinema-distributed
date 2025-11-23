// booking-service/controllers/cartController.js
const Cart = require('../models/cartModel');

/**
 * ✅ Add item to cart
 * POST /api/cart
 * Body: { movieId, showtimeId, seatId }
 */
exports.addToCart = async (req, res) => {
  try {
    const { movieId, showtimeId, seatId } = req.body;

    if (!movieId || !showtimeId || !seatId) {
      return res.status(400).json({ error: 'movieId, showtimeId, and seatId are required' });
    }

    await Cart.add(req.user.userId, movieId, showtimeId, seatId);
    res.status(201).json({ message: 'Item added to cart' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * ✅ Get all items in the user's cart
 * GET /api/cart
 */
exports.getCartItems = async (req, res) => {
  try {
    const userId = req.user.userId;
    const items = await Cart.getAllForUser(userId);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load cart items', details: err.message });
  }
};

/**
 * ✅ Remove one item from cart
 * DELETE /api/cart/:id
 */
exports.removeFromCart = async (req, res) => {
  try {
    const cartItemId = parseInt(req.params.id, 10);
    if (!cartItemId || Number.isNaN(cartItemId)) {
      return res.status(400).json({ error: 'Invalid cartItemId' });
    }

    await Cart.remove(cartItemId);
    res.json({ message: 'Item removed from cart' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove item', details: err.message });
  }
};

/**
 * ✅ Checkout (convert cart → bookings)
 * POST /api/cart/checkout
 * Body: { paymentMethod }
 */
exports.checkout = async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    if (!paymentMethod) {
      return res.status(400).json({ error: 'paymentMethod is required' });
    }

    await Cart.checkout(req.user.userId, paymentMethod);
    res.json({ message: 'Checkout successful. Bookings created!' });
  } catch (err) {
    res.status(500).json({ error: 'Checkout failed', details: err.message });
  }
};
