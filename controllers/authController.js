import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";
import { sendEmail } from "../config/mail.js";
import { generateVerificationCode } from "../utils/generateCode.js";
import { successResponse, errorResponse } from "../utils/response.js";

const getCodeExpiry = (envName) => {
  const minutes = Number(process.env[envName]) || 10;

  return new Date(Date.now() + minutes * 60 * 1000);
};

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id.toString(),
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
  );
};

const sendVerificationEmail = async (user, code) => {
  await sendEmail({
    to: user.email,
    subject: "EPI Helper - Email Verification",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #2088e8;">EPI Helper</h2>

        <p>Hello ${user.fullName},</p>

        <p>
          Thank you for creating your EPI Helper account.
        </p>

        <p>
          Your email verification code is:
        </p>

        <div
          style="
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            padding: 20px;
            text-align: center;
            background: #eaf6ff;
            color: #2088e8;
            border-radius: 10px;
          "
        >
          ${code}
        </div>

        <p>
          This code will expire in
          ${process.env.VERIFICATION_CODE_EXPIRES_MINUTES || 10}
          minutes.
        </p>

        <p>
          If you did not create this account, please ignore this email.
        </p>

        <p>
          Regards,<br />
          EPI Helper Team
        </p>
      </div>
    `,
  });
};

const sendPasswordResetEmail = async (user, code) => {
  await sendEmail({
    to: user.email,
    subject: "EPI Helper - Password Reset Code",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
        <h2 style="color: #2088e8;">EPI Helper</h2>

        <p>Hello ${user.fullName},</p>

        <p>
          We received a request to reset your EPI Helper password.
        </p>

        <p>
          Your password reset code is:
        </p>

        <div
          style="
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            padding: 20px;
            text-align: center;
            background: #eaf6ff;
            color: #2088e8;
            border-radius: 10px;
          "
        >
          ${code}
        </div>

        <p>
          This code will expire in
          ${process.env.PASSWORD_RESET_CODE_EXPIRES_MINUTES || 10}
          minutes.
        </p>

        <p>
          If you did not request a password reset, please ignore this email.
        </p>

        <p>
          Regards,<br />
          EPI Helper Team
        </p>
      </div>
    `,
  });
};

export const signup = async (req, res) => {
  try {
    const { fullName, email, mobileNumber, password, confirmPassword } =
      req.body;

    if (!fullName || !email || !mobileNumber || !password || !confirmPassword) {
      return errorResponse(res, {
        statusCode: 400,
        message: "All fields are required.",
      });
    }

    const trimmedFullName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedMobileNumber = mobileNumber.trim();

    if (trimmedFullName.length < 3) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Full name must be at least 3 characters.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Enter a valid email address.",
      });
    }

    if (!/^03\d{9}$/.test(trimmedMobileNumber)) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Enter a valid 11-digit mobile number starting with 03.",
      });
    }

    if (password.length < 8) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Password must be at least 8 characters.",
      });
    }

    if (password !== confirmPassword) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Passwords do not match.",
      });
    }

    let user = await User.findOne({
      email: trimmedEmail,
    });

    if (user && user.emailVerified) {
      return errorResponse(res, {
        statusCode: 409,
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const verificationCode = generateVerificationCode();
    const verificationExpires = getCodeExpiry(
      "VERIFICATION_CODE_EXPIRES_MINUTES",
    );

    if (user && !user.emailVerified) {
      user.fullName = trimmedFullName;
      user.mobileNumber = trimmedMobileNumber;
      user.password = hashedPassword;
      user.role = "vaccinator";
      user.userType = "outreach";
      user.emailVerificationCode = verificationCode;
      user.emailVerificationExpires = verificationExpires;

      await user.save();
    } else {
      user = await User.create({
        fullName: trimmedFullName,
        email: trimmedEmail,
        mobileNumber: trimmedMobileNumber,
        password: hashedPassword,
        role: "vaccinator",
        userType: "outreach",
        emailVerified: false,
        emailVerificationCode: verificationCode,
        emailVerificationExpires: verificationExpires,
      });
    }

    try {
      await sendVerificationEmail(user, verificationCode);
    } catch (emailError) {
      console.error("Verification Email Error:", emailError);

      return errorResponse(res, {
        statusCode: 500,
        message:
          "Account created, but verification email could not be sent. Please try again.",
      });
    }

    return successResponse(res, {
      statusCode: 201,
      message:
        "Account created successfully. Verification code has been sent to your email.",
      data: {
        userId: user._id,
        email: user.email,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error("Signup Error:", error);

    return errorResponse(res, {
      statusCode: 500,
      message: "Signup failed.",
      error: error.message,
    });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Email and verification code are required.",
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCode = String(code).trim();

    const user = await User.findOne({
      email: trimmedEmail,
    });

    if (!user) {
      return errorResponse(res, {
        statusCode: 404,
        message: "User not found.",
      });
    }

    if (user.emailVerified) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Email is already verified.",
      });
    }

    if (!user.emailVerificationCode || !user.emailVerificationExpires) {
      return errorResponse(res, {
        statusCode: 400,
        message:
          "Verification code is not available. Please request a new code.",
      });
    }

    if (user.emailVerificationExpires < new Date()) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Verification code has expired.",
      });
    }

    if (user.emailVerificationCode !== trimmedCode) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Invalid verification code.",
      });
    }

    user.emailVerified = true;
    user.emailVerificationCode = null;
    user.emailVerificationExpires = null;

    await user.save();

    return successResponse(res, {
      statusCode: 200,
      message: "Email verified successfully.",
      data: {
        userId: user._id,
        email: user.email,
        emailVerified: user.emailVerified,
      },
    });
  } catch (error) {
    console.error("Verify Email Error:", error);

    return errorResponse(res, {
      statusCode: 500,
      message: "Email verification failed.",
      error: error.message,
    });
  }
};

export const resendVerificationCode = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Email is required.",
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: trimmedEmail,
    });

    if (!user) {
      return errorResponse(res, {
        statusCode: 404,
        message: "User not found.",
      });
    }

    if (user.emailVerified) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Email is already verified.",
      });
    }

    const verificationCode = generateVerificationCode();
    const verificationExpires = getCodeExpiry(
      "VERIFICATION_CODE_EXPIRES_MINUTES",
    );

    user.emailVerificationCode = verificationCode;
    user.emailVerificationExpires = verificationExpires;

    await user.save();

    try {
      await sendVerificationEmail(user, verificationCode);
    } catch (emailError) {
      console.error("Resend Verification Email Error:", emailError);

      return errorResponse(res, {
        statusCode: 500,
        message: "Verification email could not be sent.",
      });
    }

    return successResponse(res, {
      statusCode: 200,
      message: "A new verification code has been sent to your email.",
      data: {
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Resend Verification Error:", error);

    return errorResponse(res, {
      statusCode: 500,
      message: "Failed to resend verification code.",
      error: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { mobileNumber, password } = req.body;

    if (!mobileNumber || !password) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Mobile number and password are required.",
      });
    }

    const trimmedMobileNumber = mobileNumber.trim();

    const user = await User.findOne({
      mobileNumber: trimmedMobileNumber,
    });

    if (!user) {
      return errorResponse(res, {
        statusCode: 401,
        message: "Invalid mobile number or password.",
      });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return errorResponse(res, {
        statusCode: 401,
        message: "Invalid mobile number or password.",
      });
    }

    if (!user.emailVerified) {
      return errorResponse(res, {
        statusCode: 403,
        message: "Please verify your email before logging in.",
        error: {
          emailVerified: false,
          email: user.email,
        },
      });
    }

    const token = generateToken(user);

    return successResponse(res, {
      statusCode: 200,
      message: "Login successful.",
      data: {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          mobileNumber: user.mobileNumber,
          role: user.role,
          userType: user.userType,
          emailVerified: user.emailVerified,
        },
      },
    });
  } catch (error) {
    console.error("Login Error:", error);

    return errorResponse(res, {
      statusCode: 500,
      message: "Login failed.",
      error: error.message,
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Email is required.",
      });
    }

    const trimmedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: trimmedEmail,
    });

    // Security:
    // Do not reveal whether an email exists.
    if (!user) {
      return successResponse(res, {
        statusCode: 200,
        message:
          "If an account exists with this email, a password reset code has been sent.",
      });
    }

    const resetCode = generateVerificationCode();
    const resetExpires = getCodeExpiry("PASSWORD_RESET_CODE_EXPIRES_MINUTES");

    user.passwordResetCode = resetCode;
    user.passwordResetExpires = resetExpires;

    await user.save();

    try {
      await sendPasswordResetEmail(user, resetCode);
    } catch (emailError) {
      console.error("Password Reset Email Error:", emailError);

      return errorResponse(res, {
        statusCode: 500,
        message: "Password reset email could not be sent.",
      });
    }

    return successResponse(res, {
      statusCode: 200,
      message:
        "If an account exists with this email, a password reset code has been sent.",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);

    return errorResponse(res, {
      statusCode: 500,
      message: "Forgot password request failed.",
      error: error.message,
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword, confirmPassword } = req.body;

    if (!email || !code || !newPassword || !confirmPassword) {
      return errorResponse(res, {
        statusCode: 400,
        message:
          "Email, reset code, new password and confirm password are required.",
      });
    }

    if (newPassword.length < 8) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Password must be at least 8 characters.",
      });
    }

    if (newPassword !== confirmPassword) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Passwords do not match.",
      });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCode = String(code).trim();

    const user = await User.findOne({
      email: trimmedEmail,
    });

    if (!user) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Invalid reset request.",
      });
    }

    if (!user.passwordResetCode || !user.passwordResetExpires) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Reset code is not available. Please request a new code.",
      });
    }

    if (user.passwordResetExpires < new Date()) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Reset code has expired.",
      });
    }

    if (user.passwordResetCode !== trimmedCode) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Invalid reset code.",
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);

    user.passwordResetCode = null;
    user.passwordResetExpires = null;

    await user.save();

    return successResponse(res, {
      statusCode: 200,
      message: "Password reset successfully.",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);

    return errorResponse(res, {
      statusCode: 500,
      message: "Password reset failed.",
      error: error.message,
    });
  }
};
