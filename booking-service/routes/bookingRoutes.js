// booking-service/routes/bookingRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const ctrl = require('../controllers/bookingController');

// Base path: /api/bookings

// Create + add seats in one go
router.post('/', auth, ctrl.createBooking);

// Add seats later
router.post('/:id/seats', auth, ctrl.addSeats);

// Lists & details
router.get('/', auth, ctrl.getBookingsByUser);
router.get('/stats', auth, ctrl.getStats);
router.get('/stats/total', auth, ctrl.getTotalBookings);
router.get('/stats/spent', auth, ctrl.getTotalSpent);
router.get('/:id', auth, ctrl.getBookingById);

// Cancel
router.put('/:id/cancel', auth, ctrl.cancelBooking);

module.exports = router;
