import mongoose from "mongoose";

const pendingSignupSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    mobileNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      default: "vaccinator",
    },

    userType: {
      type: String,
      default: "outreach",
    },

    verificationCode: {
      type: String,
      required: true,
    },

    verificationExpires: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Automatically remove expired pending signups
pendingSignupSchema.index(
  { verificationExpires: 1 },
  { expireAfterSeconds: 0 },
);

const PendingSignup = mongoose.model("PendingSignup", pendingSignupSchema);

export default PendingSignup;
