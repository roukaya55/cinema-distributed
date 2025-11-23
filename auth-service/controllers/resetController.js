const crypto = require('crypto');
const Joi = require('joi');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const Token = require('../models/tokenModel');
const sendEmail = require('../utils/sendEmail');

require('dotenv').config();

// ✅ Send password reset email
exports.requestPasswordReset = async (req, res) => {
  try {
    const schema = Joi.object({ email: Joi.string().email().required() });
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const user = await User.findByEmail(req.body.email);
    if (!user) return res.status(400).send("User with given email doesn't exist");

    let tokenRecord = await Token.findTokenByUserId(user.user_id);
    let tokenValue;

    if (!tokenRecord) {
      tokenValue = crypto.randomBytes(32).toString('hex');
      await Token.createToken(user.user_id, tokenValue);
    } else {
      tokenValue = tokenRecord.token;
    }

    const encoded = encodeURIComponent(tokenValue);
    const link = `${process.env.BASE_URL}/reset-password/${user.user_id}/${encoded}`;

    await sendEmail(
      user.email,
      'Password Reset',
      `Click here to reset your password: ${link}`
    );

    res.status(200).json({ message: 'Password reset link sent to your email.' });
    console.log('Password reset link:', link);
  } catch (err) {
    console.error('Error in requestPasswordReset:', err);
    res.status(500).send('Something went wrong: ' + err.message);
  }
};

// ✅ Confirm password reset
exports.resetPassword = async (req, res) => {
  try {
    const schema = Joi.object({ password: Joi.string().min(6).required() });
    const { error } = schema.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const decodedToken = decodeURIComponent(req.params.token);
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(400).send('Invalid or expired link.');

    const tokenRecord = await Token.findTokenByUserId(user.user_id);
    if (!tokenRecord || tokenRecord.token !== decodedToken)
      return res.status(400).send('Invalid or expired link.');

    const hashed = await bcrypt.hash(req.body.password, 10);
    await User.updatePassword({ userId: user.user_id, hashed });
    await Token.deleteToken(user.user_id, tokenRecord.token);

    res.status(200).json({ message: 'Password reset successfully.' });
  } catch (err) {
    console.error('Error in resetPassword:', err);
    res.status(500).send('Something went wrong: ' + err.message);
  }
};
