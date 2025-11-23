const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const wishlistController = require('../controllers/wishlistController');

router.get('/', authMiddleware, wishlistController.getWishlist);
router.post('/:movieId', authMiddleware, wishlistController.addToWishlist);
router.delete('/:movieId', authMiddleware, wishlistController.removeFromWishlist);

module.exports = router;
