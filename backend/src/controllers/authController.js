const User = require("../models/User");
const generateToken = require("../utils/generateToken");

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user account
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      mobile,
      password,
      dateOfBirth,
      gender,
      bio,
      currentAddress,
      permanentAddress,
      education,
      socials,
      projects,
      profileImage,
    } = req.body;

    // ── Validate required fields ─────────────────────────────
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "First name, last name, email, and password are required.",
      });
    }

    // ── Check if email already in use ─────────────────────────
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // ── Sanitise optional fields ──────────────────────────────
    // gender: the HTML select sends "" when nothing is chosen —
    //         that fails the enum validator, so we strip it to undefined
    const cleanGender = gender && gender !== "" ? gender : undefined;

    // passingYear: parseInt("") === NaN which Mongoose rejects for Number type
    const cleanPassingYear =
      education?.passingYear !== undefined &&
      education?.passingYear !== "" &&
      !isNaN(parseInt(education.passingYear))
        ? parseInt(education.passingYear)
        : undefined;

    // ── Create user (password hashed via pre-save hook) ───────
    const user = await User.create({
      firstName,
      lastName,
      email,
      mobile: mobile || undefined,
      password,
      dateOfBirth: dateOfBirth || undefined,
      gender: cleanGender,
      bio: bio || undefined,
      currentAddress,
      permanentAddress,
      education: education
        ? { ...education, passingYear: cleanPassingYear }
        : undefined,
      socials,
      projects,
      profileImage: profileImage || null,
    });

    // ── Respond with token ────────────────────────────────────
    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token: generateToken(user._id),
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    // Log the FULL error object so you can see exactly what Mongoose rejected
    console.error("Register Error:", error);

    // Return Mongoose validation errors as readable messages
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: messages.join(". "),
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error during registration.",
    });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return JWT
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ── Validate input ────────────────────────────────────────
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // ── Find user (include password field for comparison) ─────
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // ── Check if account is active ────────────────────────────
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been disabled. Please contact admin.",
      });
    }

    // ── Verify password ───────────────────────────────────────
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // ── Respond with token ────────────────────────────────────
    res.status(200).json({
      success: true,
      message: "Login successful.",
      token: generateToken(user._id),
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login.",
    });
  }
};

module.exports = { register, login };