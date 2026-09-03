import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
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
      match: /^03\d{9}$/,
    },

    password: {
      type: String,
      required: true,
      minlength: 8,
    },

    role: {
      type: String,
      enum: ["vaccinator", "admin"],
      default: "vaccinator",
      required: true,
    },

    userType: {
      type: String,
      enum: ["fixed", "outreach", null],
      default: "outreach",
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    emailVerificationCode: {
      type: String,
      default: null,
    },

    emailVerificationExpires: {
      type: Date,
      default: null,
    },
    passwordResetCode: {
  type: String,
  default: null,
},

passwordResetExpires: {
  type: Date,
  default: null,
},
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
