const express = require('express');
const jwt = require('jsonwebtoken');
const verifyGoogleToken = require('../utils/googleAuth');
const pool = require('../config/db');

const router = express.Router();

router.post('/google-login', async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ msg: 'Missing Google token' });
  }

  try {
    const googleUser = await verifyGoogleToken(idToken);

    if (!googleUser.email_verified) {
      return res.status(401).json({ msg: 'Email not verified by Google' });
    }

    // 1️⃣  Try to find user by email
    const findRes = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [googleUser.email]
    );

    let user = findRes.rows[0];

    // 2️⃣  If user doesn’t exist, create a new one
    if (!user) {
      const insertRes = await pool.query(
        `INSERT INTO users (name, email, password, phone)
         VALUES ($1, $2, $3, $4)
         RETURNING user_id, name, email`,
        [googleUser.name || 'Google User', googleUser.email, '', '']
      );
      user = insertRes.rows[0];
    }

    // 3️⃣  Create JWT
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined');
    }

    const token = jwt.sign(
      { userId: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // 4️⃣  Send response
    res.json({
      token,
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('Google login error:', err);
    res.status(500).json({
      msg: 'Authentication server error',
      error: err.message,
    });
  }
});

module.exports = router;
