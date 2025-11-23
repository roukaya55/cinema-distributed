const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, paymentController.createPayment);
router.put('/:id/status', authMiddleware, paymentController.updatePaymentStatus);
router.get('/', authMiddleware, paymentController.getPayments);
router.get('/:id', authMiddleware, paymentController.getPaymentById);

module.exports = router;
