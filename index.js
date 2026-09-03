import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";

import monthlyIndentRoutes from "./routes/monthlyIndentRoutes.js";

dotenv.config();

const app = express();

// Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Health / Root
app.get("/", (req, res) => {
  res.send("EPI Helper Backend is running");
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "API is healthy",
  });
});

// Routes
app.use("/api/monthly-indents", monthlyIndentRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
