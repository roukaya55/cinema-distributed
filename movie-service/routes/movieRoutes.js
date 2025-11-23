const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');

router.get('/search', movieController.searchMovies);
router.get('/upcoming', movieController.getUpcomingMovies);
router.get('/hall', movieController.getAllHalls);
router.get('/hall/:id', movieController.getHallById);
router.get('/', movieController.getAllMovies);
router.get('/:id', movieController.getMovieDetails);

module.exports = router;
