const express = require('express');
const { requestPasswordReset, resetPassword } = require('../controllers/resetController');
const router = express.Router();

router.post('/password-reset', requestPasswordReset);
router.post('/password-reset/:userId/:token', resetPassword);

module.exports = router;
