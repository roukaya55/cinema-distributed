// booking-service/routes/cartRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const cartController = require('../controllers/cartController');

// Base path: /api/cart
router.get('/', auth, cartController.getCartItems);
router.post('/', auth, cartController.addToCart);
router.delete('/:id', auth, cartController.removeFromCart);
router.post('/checkout', auth, cartController.checkout);

module.exports = router;
