// routes/authRoutes.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// ✅ Register
router.post("/register", async (req, res) => {
  try {
    const { username, mobile, occupation, state,district,city, email, password } = req.body;

    // Check all fields
    if (!username || !mobile || !occupation || !state || !district || !city || !email || !password) {
      return res.status(400).json({ msg: "Please fill all fields" });
    }

    // Check uniqueness
    const existingUser = await User.findOne({
      $or: [{ email }, { username }, { mobile }]
    });
    if (existingUser) {
      return res.status(400).json({ msg: "User with same email/username/mobile already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      username,
      mobile,
      occupation,
      state,
      district,
      city,
      email,
      password: hashedPassword
    });

    await newUser.save();

    res.status(201).json({ msg: "✅ User registered successfully" });
  } catch (err) {
    console.error("Register Error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

// ✅ Login (using username OR email OR mobile + password)
router.post("/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ msg: "Please provide credentials" });
    }

    // Find user by email OR username OR mobile
    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }, { mobile: identifier }]
    });

    if (!user) return res.status(400).json({ msg: "Invalid credentials" });

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

    // Sign JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        mobile: user.mobile,
        occupation: user.occupation,
        state: user.state,
        district: user.district,
        city: user.city
      }
    });
  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(500).json({ msg: "Server error" });
  }
});

module.exports = router;
