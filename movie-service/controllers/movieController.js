const Movie = require('../models/movieModel');
const Showtime = require('../models/showtimeModel');
const Hall = require('../models/hallModel');
const Seat = require('../models/seatModel');

exports.getAllMovies = async (req, res) => {
  try {
    const movies = await Movie.getAll();
    res.json(movies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMovieDetails = async (req, res) => {
  try {
    const movieId = req.params.id;
    const movie = await Movie.getById(movieId);
    if (!movie) return res.status(404).json({ message: 'Movie not found' });

    const showtimes = await Showtime.getByMovie(movieId);
    for (const s of showtimes) {
      s.seats = await Seat.getByHall(s.hall_id);
    }

    res.json({ movie, showtimes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.searchMovies = async (req, res) => {
  try {
    const query = req.query.q; // Example: /api/movies/search?q=action
    if (!query || query.trim() === '') {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const results = await Movie.search(query);
    if (results.length === 0) {
      return res.status(404).json({ message: 'No movies found' });
    }

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getUpcomingMovies = async (req, res) => {
  try {
    const showtimes = await Showtime.getUpcomingMovies();
    res.json(showtimes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getAllHalls = async (req, res) => {
  try {
    const halls = await Hall.getAll();
    res.json(halls);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getHallById = async (req, res) => {
  try {
    const hall = await Hall.getById(req.params.id);
    if (!hall) {
      return res.status(404).json({ message: 'Hall not found' });
    }
    res.json(hall);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
