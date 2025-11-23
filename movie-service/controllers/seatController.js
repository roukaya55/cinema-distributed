const Seat = require('../models/seatModel');

exports.getSeatsByHall = async (req, res) => {
  try {
    const hallId = req.params.hallId;
    const seats = await Seat.getSeatsByHallId(hallId);

    if (!seats || seats.length === 0) {
      return res.status(404).json({ message: 'No seats found for this hall' });
    }

    res.json(seats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSeatsForShowtime = async (req, res) => {
  try {
    const showtimeId = req.params.showtimeId;
    const seats = await Seat.getSeatsForShowtime(showtimeId);

    if (!seats || seats.length === 0) {
      return res.status(404).json({ message: 'No seats found for this showtime' });
    }

    res.json(seats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
