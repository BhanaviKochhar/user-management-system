const express = require("express");
const { register, login } = require("../controllers/authController");

const router = express.Router();

/**
 * Auth Routes
 * Base path: /api/auth
 */

// POST /api/auth/register — Create new user account
router.post("/register", register);

// POST /api/auth/login — Authenticate and get token
router.post("/login", login);

module.exports = router;