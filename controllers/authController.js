const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
require('dotenv').config();

const DEFAULT_OTP = '1234';

exports.sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (process.env.NODE_ENV === 'production' && process.env.TEST_OTP_ENABLED !== '1') return res.status(501).json({ error: 'SMS OTP provider is not configured for production.' });
    if (!/^\d{10}$/.test(phone)) return res.status(400).json({ error: 'Invalid phone' });

    const user = await User.findByPhone(phone);
    if (!user) return res.status(404).json({ error: 'No account. Please sign up.' });

    res.json({ success: true, otp: DEFAULT_OTP, message: process.env.TEST_OTP_ENABLED === '1' || process.env.NODE_ENV !== 'production' ? 'Development mode: use OTP 1234.' : 'OTP requested.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if ((process.env.NODE_ENV === 'production' && process.env.TEST_OTP_ENABLED !== '1') || otp !== DEFAULT_OTP) return res.status(400).json({ error: 'Invalid OTP' });

    const user = await User.findByPhone(phone);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({ success: true, token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.signup = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (await User.findByPhone(phone)) return res.status(400).json({ error: 'Phone already registered' });
    if (await User.findByEmail(email)) return res.status(400).json({ error: 'Email already registered' });

    await User.create({ name, email, phone });
    res.json({ success: true, message: 'Signup successful. Use OTP 1234 to login.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.me = async (req, res) => {
  const user = await User.findById(req.user.id);
  res.json(user);
};