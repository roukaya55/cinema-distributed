// auth-service/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// ✅ Register
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    // 1. Check if email exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ msg: 'Email already exists' });
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create user
    const userId = await User.create({
      name: name || 'New User',
      email,
      password: hashedPassword,
      phone: phone || null,
    });

    res.status(201).json({
      msg: 'User registered successfully',
      userId,
    });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({
      msg: 'Server error',
      error: err.message,
    });
  }
};

// ✅ Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(400).json({ msg: 'Invalid email or password' });
    }

    // 2. Compare passwords
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ msg: 'Invalid email or password' });
    }

    // 3. Generate JWT
    const token = jwt.sign(
      { userId: user.user_id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      token,
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({
      msg: 'Server error',
      error: err.message,
    });
  }
};

// ✅ Logout
exports.logout = async (req, res) => {
  // JWT logout handled client-side by removing token
  res.json({
    msg: 'Logged out successfully (client-side token should be cleared)',
  });
};

// ✅ Optional DB health check
exports.checkDbHealth = async (req, res) => {
  try {
    await User.findByEmail('check@example.com'); // simple query test
    res.json({ status: 'Database connection healthy' });
  } catch (err) {
    res.status(500).json({
      status: 'Database connection failed',
      error: err.message,
    });
  }
};
