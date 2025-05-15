const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '1d' }
  );
};

// Register new user
exports.signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: role.toLowerCase(), // ✅ ensures consistent role matching
    });

    await user.save();

    const token = generateToken(user);

    res.status(201).json({
      message: 'Signup successful',
      token,
      role: user.role,
      name: user.name,
      userId: user._id,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Login existing user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      console.warn('❌ Login failed: Email not found →', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    console.log(`🔍 Password match for ${email}:`, isMatch);

    if (!isMatch) {
      console.warn('❌ Login failed: Incorrect password');
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user);

    console.log(`✅ Login successful for ${email}`);

    res.status(200).json({
      message: 'Login successful',
      token,
      role: user.role,
      name: user.name,
      userId: user._id,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
