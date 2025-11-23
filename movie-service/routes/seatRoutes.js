const express = require('express');
const router = express.Router();
const seatController = require('../controllers/seatController');

// ✅ Get seats in a hall
router.get('/hall/:hallId', seatController.getSeatsByHall);

// ✅ Get seats for a showtime (with booked/unbooked status)
router.get('/showtime/:showtimeId', seatController.getSeatsForShowtime);

module.exports = router;
