// booking-service/controllers/bookingController.js
const Booking = require('../models/bookingModel');

/**
 * POST /api/bookings
 * Body: { showtimeId:number, price:number, paymentMethod:string, seatIds:number[] }
 * Creates a booking, then links seats (if provided).
 */
exports.createBooking = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { showtimeId, price = 0, paymentMethod = 'N/A', seatIds = [] } = req.body;

    if (!showtimeId) {
      return res.status(400).json({ error: 'showtimeId is required' });
    }

    const bookingId = await Booking.create(userId, showtimeId, price, paymentMethod);

    if (Array.isArray(seatIds) && seatIds.length > 0) {
      await Booking.addBookedSeats(bookingId, seatIds, showtimeId);
    }

    res.status(201).json({ message: 'Booking created', bookingId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /api/bookings/:id/seats
 * Body: { seatIds:number[], showtimeId:number }
 * Adds seats to an existing booking.
 */
exports.addSeats = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    const { seatIds = [], showtimeId } = req.body;

    if (!bookingId || Number.isNaN(bookingId)) {
      return res.status(400).json({ error: 'Invalid booking id' });
    }
    if (!Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({ error: 'seatIds array is required' });
    }
    if (!showtimeId) {
      return res.status(400).json({ error: 'showtimeId is required' });
    }

    await Booking.addBookedSeats(bookingId, seatIds, showtimeId);
    res.json({ message: 'Seats added to booking', bookingId, added: seatIds.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/bookings
 * Optional: ?status=Upcoming|Completed|Cancelled
 */
exports.getBookingsByUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    const status = req.query.status || null;
    const rows = await Booking.getBookingsByUser(userId, status);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/bookings/:id
 */
exports.getBookingById = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    if (!bookingId || Number.isNaN(bookingId)) {
      return res.status(400).json({ error: 'Invalid booking id' });
    }
    const row = await Booking.getBookingById(bookingId);
    if (!row) return res.status(404).json({ error: 'Booking not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * PUT /api/bookings/:id/cancel
 */
exports.cancelBooking = async (req, res) => {
  try {
    const bookingId = parseInt(req.params.id, 10);
    if (!bookingId || Number.isNaN(bookingId)) {
      return res.status(400).json({ error: 'Invalid booking id' });
    }
    const ok = await Booking.cancelBooking(bookingId, req.user.userId);
    if (!ok) return res.status(400).json({ error: 'Unable to cancel booking' });
    res.json({ message: 'Booking cancelled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/bookings/stats/total
 */
exports.getTotalBookings = async (req, res) => {
  try {
    const total = await Booking.getTotalBookings(req.user.userId);
    res.json({ total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/bookings/stats/spent
 */
exports.getTotalSpent = async (req, res) => {
  try {
    const totalSpent = await Booking.getTotalSpent(req.user.userId);
    res.json({ totalSpent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/bookings/stats
 * Combined stats (handy for the profile dashboard)
 */
exports.getStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const [total, spent] = await Promise.all([
      Booking.getTotalBookings(userId),
      Booking.getTotalSpent(userId),
    ]);
    res.json({ totalBookings: total, totalSpent: spent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
