import mongoose from "mongoose";

import AddCoverage from "../models/AddCoverage.js";
import User from "../models/User.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { getPakistanDateTime } from "../utils/dateTime.js";

const allowedVaccines = [
  "BCG",
  "Hep-B",
  "Penta 1",
  "Penta 2",
  "Penta 3",
  "Measles 1",
  "Measles 2",
  "TD",
  "HPV",
];

// -----------------------------------------
// Helper: Validate date-only format
// -----------------------------------------
const isValidCoverageDate = (value) => {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
};

// -----------------------------------------
// Helper: Validate and clean vaccines
// -----------------------------------------
const validateVaccines = (vaccines) => {
  if (!Array.isArray(vaccines) || vaccines.length === 0) {
    return {
      error: "At least one vaccine coverage is required.",
    };
  }

  const cleanedVaccines = [];

  for (const item of vaccines) {
    if (!item?.vaccine) {
      return {
        error: "Vaccine name is required.",
      };
    }

    if (!allowedVaccines.includes(item.vaccine)) {
      return {
        error: `Invalid vaccine: ${item.vaccine}`,
      };
    }

    const doses = Number(item.doses);

    if (!Number.isInteger(doses) || doses < 0) {
      return {
        error: `Invalid doses for ${item.vaccine}.`,
      };
    }

    if (doses > 0) {
      cleanedVaccines.push({
        vaccine: item.vaccine,
        doses,
      });
    }
  }

  if (cleanedVaccines.length === 0) {
    return {
      error: "At least one vaccine must have doses greater than zero.",
    };
  }

  return {
    vaccines: cleanedVaccines,
  };
};

// =========================================
// CREATE / UPDATE DAILY COVERAGE
// =========================================
export const createCoverage = async (req, res) => {
  try {
    const { coverageDate, vaccines } = req.body;

    // 1. Validate coverage date
    if (!coverageDate) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Coverage date is required.",
      });
    }

    if (!isValidCoverageDate(coverageDate)) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Invalid coverage date. Use YYYY-MM-DD format.",
      });
    }

    // 2. Validate vaccines
    const vaccineValidation = validateVaccines(vaccines);

    if (vaccineValidation.error) {
      return errorResponse(res, {
        statusCode: 400,
        message: vaccineValidation.error,
      });
    }

    const cleanedVaccines = vaccineValidation.vaccines;

    // 3. Get logged-in user
    const user = await User.findById(req.user.id);

    if (!user) {
      return errorResponse(res, {
        statusCode: 404,
        message: "User not found.",
      });
    }

    // 4. Find same user + same calendar date
    const existingCoverage = await AddCoverage.findOne({
      user: user._id,
      coverageDate,
    });

    // 5. Existing record → UPDATE
    if (existingCoverage) {
      return errorResponse(res, {
        statusCode: 409,
        message: "This date coverage already exists.",
      });
    }

    const pakistanDateTime = getPakistanDateTime();

    const coverage = await AddCoverage.create({
      user: user._id,
      coverageDate,
      vaccines: cleanedVaccines,
      createdAt: pakistanDateTime,
      updatedAt: pakistanDateTime,
    });

    return successResponse(res, {
      statusCode: 201,
      message: "Daily coverage saved successfully.",
      data: coverage,
    });
  } catch (error) {
    console.error("Create Coverage Error:", error);

    return errorResponse(res, {
      statusCode: 500,
      message: "Failed to save daily coverage.",
      error: error.message,
    });
  }
};

// =========================================
// GET ALL DAILY COVERAGES
// =========================================
export const getCoverages = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", startDate, endDate } = req.query;

    const currentPage = Math.max(Number(page) || 1, 1);
    const perPage = Math.max(Number(limit) || 10, 1);

    const filter = {};

    // -----------------------------------------
    // Access control
    // -----------------------------------------
    if (req.user.role !== "admin") {
      filter.user = req.user.id;
    }

    // -----------------------------------------
    // Search by user
    // -----------------------------------------
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");

      const users = await User.find({
        $or: [
          { fullName: searchRegex },
          { mobileNumber: searchRegex },
          { email: searchRegex },
        ],
      }).select("_id");

      const userIds = users.map((user) => user._id);

      if (req.user.role !== "admin") {
        filter.user = {
          $eq: req.user.id,
          $in: userIds,
        };
      } else {
        filter.user = {
          $in: userIds,
        };
      }
    }

    // -----------------------------------------
    // Date filter
    // -----------------------------------------
    if (startDate || endDate) {
      filter.coverageDate = {};

      if (startDate) {
        if (!isValidCoverageDate(startDate)) {
          return errorResponse(res, {
            statusCode: 400,
            message: "Invalid start date. Use YYYY-MM-DD format.",
          });
        }

        filter.coverageDate.$gte = startDate;
      }

      if (endDate) {
        if (!isValidCoverageDate(endDate)) {
          return errorResponse(res, {
            statusCode: 400,
            message: "Invalid end date. Use YYYY-MM-DD format.",
          });
        }

        filter.coverageDate.$lte = endDate;
      }
    }

    // -----------------------------------------
    // Count
    // -----------------------------------------
    const count = await AddCoverage.countDocuments(filter);

    // -----------------------------------------
    // Fetch coverages
    // -----------------------------------------
    const coverages = await AddCoverage.find(filter)
      .populate("user", "fullName email mobileNumber role userType")
      .sort({
        coverageDate: -1,
        createdAt: -1,
      })
      .skip((currentPage - 1) * perPage)
      .limit(perPage);

    return successResponse(res, {
      statusCode: 200,
      message: "Daily coverages fetched successfully.",
      data: coverages,
      count,
    });
  } catch (error) {
    console.error("Get Coverages Error:", error);

    return errorResponse(res, {
      statusCode: 500,
      message: "Failed to fetch daily coverages.",
      error: error.message,
    });
  }
};

// =========================================
// GET SINGLE DAILY COVERAGE
// =========================================
export const getCoverageById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Invalid coverage ID.",
      });
    }

    const filter = {
      _id: id,
    };

    if (req.user.role !== "admin") {
      filter.user = req.user.id;
    }

    const coverage = await AddCoverage.findOne(filter).populate(
      "user",
      "fullName email mobileNumber role userType",
    );

    if (!coverage) {
      return errorResponse(res, {
        statusCode: 404,
        message: "Daily coverage not found.",
      });
    }

    return successResponse(res, {
      statusCode: 200,
      message: "Daily coverage fetched successfully.",
      data: coverage,
    });
  } catch (error) {
    console.error("Get Coverage By ID Error:", error);

    return errorResponse(res, {
      statusCode: 500,
      message: "Failed to fetch daily coverage.",
      error: error.message,
    });
  }
};

// =========================================
// UPDATE DAILY COVERAGE
// =========================================
export const updateCoverage = async (req, res) => {
  try {
    const { id } = req.params;
    const { coverageDate, vaccines } = req.body;

    // -----------------------------------------
    // Validate ID
    // -----------------------------------------
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Invalid coverage ID.",
      });
    }

    // -----------------------------------------
    // Validate date
    // -----------------------------------------
    if (!coverageDate) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Coverage date is required.",
      });
    }

    if (!isValidCoverageDate(coverageDate)) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Invalid coverage date. Use YYYY-MM-DD format.",
      });
    }

    // -----------------------------------------
    // Validate vaccines
    // -----------------------------------------
    const vaccineValidation = validateVaccines(vaccines);

    if (vaccineValidation.error) {
      return errorResponse(res, {
        statusCode: 400,
        message: vaccineValidation.error,
      });
    }

    const cleanedVaccines = vaccineValidation.vaccines;

    // -----------------------------------------
    // Find existing coverage
    // -----------------------------------------
    const filter = {
      _id: id,
    };

    if (req.user.role !== "admin") {
      filter.user = req.user.id;
    }

    const coverage = await AddCoverage.findOne(filter);

    if (!coverage) {
      return errorResponse(res, {
        statusCode: 404,
        message: "Daily coverage not found.",
      });
    }

    // -----------------------------------------
    // Prevent duplicate user + date
    // -----------------------------------------
    const duplicateCoverage = await AddCoverage.findOne({
      _id: {
        $ne: coverage._id,
      },
      user: coverage.user,
      coverageDate,
    });

    if (duplicateCoverage) {
      return errorResponse(res, {
        statusCode: 409,
        message:
          "Daily coverage already exists for this user on the selected date.",
      });
    }

    // -----------------------------------------
    // Update
    // -----------------------------------------
    coverage.coverageDate = coverageDate;
    coverage.vaccines = cleanedVaccines;

    await coverage.save();

    return successResponse(res, {
      statusCode: 200,
      message: "Daily coverage updated successfully.",
      data: coverage,
    });
  } catch (error) {
    console.error("Update Coverage Error:", error);

    return errorResponse(res, {
      statusCode: 500,
      message: "Failed to update daily coverage.",
      error: error.message,
    });
  }
};

// =========================================
// DELETE DAILY COVERAGE
// =========================================
export const deleteCoverage = async (req, res) => {
  try {
    const { id } = req.params;

    // -----------------------------------------
    // Validate ID
    // -----------------------------------------
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return errorResponse(res, {
        statusCode: 400,
        message: "Invalid coverage ID.",
      });
    }

    const filter = {
      _id: id,
    };

    if (req.user.role !== "admin") {
      filter.user = req.user.id;
    }

    // -----------------------------------------
    // Find coverage
    // -----------------------------------------
    const coverage = await AddCoverage.findOne(filter);

    if (!coverage) {
      return errorResponse(res, {
        statusCode: 404,
        message: "Daily coverage not found.",
      });
    }

    // -----------------------------------------
    // Delete
    // -----------------------------------------
    await AddCoverage.deleteOne({
      _id: coverage._id,
    });

    return successResponse(res, {
      statusCode: 200,
      message: "Daily coverage deleted successfully.",
      data: null,
    });
  } catch (error) {
    console.error("Delete Coverage Error:", error);

    return errorResponse(res, {
      statusCode: 500,
      message: "Failed to delete daily coverage.",
      error: error.message,
    });
  }
};
