const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);

  } catch (err) {
    res.status(500).json({ error: "Failed to load profile" });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { fullName, email, phone, password } = req.body;

    // ✅ Update basic info
    await User.updateUserProfile({ userId, fullName, email, phone });

    // ✅ Update password only if provided
    if (password && password.trim().length > 0) {
      const hashed = await bcrypt.hash(password, 10);
      await User.updatePassword({ userId, hashedPassword: hashed });
    }

    res.json({ message: "Profile updated successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update profile" });
  }
};
