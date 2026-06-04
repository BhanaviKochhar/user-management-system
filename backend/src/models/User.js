const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/**
 * User Schema
 * Stores all user profile data including auth credentials,
 * personal info, address, education, and profile image.
 */
const userSchema = new mongoose.Schema(
  {
    // ─── Account ──────────────────────────────────────────────
    firstName: {
      type: String,
      required: [true, "First name is required"],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, "Last name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    mobile: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false, // Never return password in queries by default
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    isActive: {
      type: Boolean,
      default: true, // Admin can disable accounts
    },

    // ─── Personal ─────────────────────────────────────────────
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      // Empty string ("") is sent when user skips the select — include it so Mongoose doesn't reject it
      enum: ["", "male", "female", "other", "prefer_not_to_say"],
      default: "",
    },
    bio: {
      type: String,
      maxlength: 500,
    },

    // ─── Address ──────────────────────────────────────────────
    currentAddress: {
      addressLine: String,
      city: String,
      state: String,
      country: String,
      pincode: String,
    },
    permanentAddress: {
      addressLine: String,
      city: String,
      state: String,
      country: String,
      pincode: String,
    },

    // ─── Education ────────────────────────────────────────────
    education: {
      qualification: String,
      institute: String,
      passingYear: Number,
    },

    // ─── Socials & Links ─────────────────────────────────────
    socials: {
      github: String,
      linkedin: String,
      portfolio: String,
      resume: String, // URL or file path
    },

    // ─── Projects ────────────────────────────────────────────
    projects: [
      {
        title: String,
        description: String,
        repoUrl: String,
        liveUrl: String,
        techStack: [String],
      },
    ],

    // ─── Profile Image ────────────────────────────────────────
    profileImage: {
      type: String,
      default: null, // Will store base64 or URL
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// ─── Pre-save Hook: Hash password before storing ──────────────
userSchema.pre("save", async function () {
  // Only hash if password was modified (or is new)
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  
});

// ─── Instance Method: Compare entered password with hash ──────
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);