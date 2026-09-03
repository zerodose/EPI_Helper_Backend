import express from "express";

import {
  createCoverage,
  getCoverages,
  getCoverageById,
  updateCoverage,
  deleteCoverage,
} from "../controllers/coverageController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create / Update by date
router.post("/", protect, createCoverage);

// Get all
router.get("/", protect, getCoverages);

// Get single
router.get("/:id", protect, getCoverageById);

// Update
router.put("/:id", protect, updateCoverage);

// Delete
router.delete("/:id", protect, deleteCoverage);

export default router;
