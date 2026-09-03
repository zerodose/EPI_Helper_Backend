import jwt from "jsonwebtoken";
import { errorResponse } from "../utils/response.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(res, {
        statusCode: 401,
        message: "Authentication required.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return errorResponse(res, {
        statusCode: 401,
        message: "Authentication token is missing.",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
    );

    req.user = decoded;

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);

    if (error.name === "TokenExpiredError") {
      return errorResponse(res, {
        statusCode: 401,
        message: "Authentication token has expired.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return errorResponse(res, {
        statusCode: 401,
        message: "Invalid authentication token.",
      });
    }

    return errorResponse(res, {
      statusCode: 401,
      message: "Authentication failed.",
    });
  }
};