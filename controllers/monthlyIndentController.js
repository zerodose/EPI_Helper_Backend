import MonthlyIndent from "../models/MonthlyIndent.js";

import { successResponse, errorResponse } from "../utils/response.js";

// Create Monthly Indent
export const createMonthlyIndent = async (req, res) => {
  try {
    const { indentDate, receivingType, vaccines } = req.body;

    if (!indentDate || !receivingType || !vaccines) {
      return errorResponse(res, {
        statusCode: 400,
        message: "indentDate, receivingType and vaccines are required",
      });
    }

    if (!Array.isArray(vaccines) || vaccines.length === 0) {
      return errorResponse(res, {
        statusCode: 400,
        message: "At least one vaccine is required",
      });
    }

    const monthlyIndent = await MonthlyIndent.create({
      indentDate,
      receivingType,
      vaccines,
    });

    return successResponse(res, {
      statusCode: 201,
      message: "Monthly indent created successfully",
      data: monthlyIndent,
    });
  } catch (error) {
    console.error("Create Monthly Indent Error:", error);

    return errorResponse(res, {
      statusCode: 500,
      message: "Failed to create monthly indent",
      error: error.message,
    });
  }
};

// Get All Monthly Indents
export const getMonthlyIndents = async (req, res) => {
  try {
    const { year, month } = req.query;

    const filter = {};

    if (year && month) {
      const numericYear = Number(year);
      const numericMonth = Number(month);

      if (
        !Number.isInteger(numericYear) ||
        !Number.isInteger(numericMonth) ||
        numericMonth < 1 ||
        numericMonth > 12
      ) {
        return errorResponse(res, {
          statusCode: 400,
          message: "Invalid year or month",
        });
      }

      const startDate = new Date(
        Date.UTC(numericYear, numericMonth - 1, 1, 0, 0, 0, 0),
      );

      const endDate = new Date(
        Date.UTC(numericYear, numericMonth, 1, 0, 0, 0, 0),
      );

      filter.indentDate = {
        $gte: startDate,
        $lt: endDate,
      };
    } else if (year) {
      const numericYear = Number(year);

      if (!Number.isInteger(numericYear)) {
        return errorResponse(res, {
          statusCode: 400,
          message: "Invalid year",
        });
      }

      const startDate = new Date(Date.UTC(numericYear, 0, 1, 0, 0, 0, 0));

      const endDate = new Date(Date.UTC(numericYear + 1, 0, 1, 0, 0, 0, 0));

      filter.indentDate = {
        $gte: startDate,
        $lt: endDate,
      };
    }

    console.log("MONTHLY INDENT REQUEST:", {
      year,
      month,
    });

    console.log("MONTHLY INDENT FILTER:", {
      indentDate: filter.indentDate
        ? {
            $gte: filter.indentDate.$gte.toISOString(),
            $lt: filter.indentDate.$lt.toISOString(),
          }
        : undefined,
    });

    const monthlyIndents = await MonthlyIndent.find(filter).sort({
      indentDate: -1,
    });

    console.log("MONTHLY INDENT RESULT COUNT:", monthlyIndents.length);

    return successResponse(res, {
      statusCode: 200,
      message: "Monthly indents fetched successfully",
      data: monthlyIndents,
      count: monthlyIndents.length,
    });
  } catch (error) {
    console.error("Get Monthly Indents Error:", error);

    return errorResponse(res, {
      statusCode: 500,
      message: "Failed to get monthly indents",
      error: error.message,
    });
  }
};

// Get Single Monthly Indent
export const getMonthlyIndentById = async (req, res) => {
  try {
    const { id } = req.params;

    const monthlyIndent = await MonthlyIndent.findById(id);

    if (!monthlyIndent) {
      return errorResponse(res, {
        statusCode: 404,
        message: "Monthly indent not found",
      });
    }

    return successResponse(res, {
      statusCode: 200,
      message: "Monthly indent fetched successfully",
      data: monthlyIndent,
    });
  } catch (error) {
    console.error("Get Monthly Indent Error:", error);

    return errorResponse(res, {
      statusCode: 500,
      message: "Failed to get monthly indent",
      error: error.message,
    });
  }
};

// Update Monthly Indent
export const updateMonthlyIndent = async (req, res) => {
  try {
    const { id } = req.params;
    const { indentDate, receivingType, vaccines } = req.body;

    const monthlyIndent = await MonthlyIndent.findById(id);

    if (!monthlyIndent) {
      return errorResponse(res, {
        statusCode: 404,
        message: "Monthly indent not found",
      });
    }

    if (indentDate !== undefined) {
      monthlyIndent.indentDate = indentDate;
    }

    if (receivingType !== undefined) {
      monthlyIndent.receivingType = receivingType;
    }

    if (vaccines !== undefined) {
      if (!Array.isArray(vaccines) || vaccines.length === 0) {
        return errorResponse(res, {
          statusCode: 400,
          message: "At least one vaccine is required",
        });
      }

      monthlyIndent.vaccines = vaccines;
    }

    await monthlyIndent.save();

    return successResponse(res, {
      statusCode: 200,
      message: "Monthly indent updated successfully",
      data: monthlyIndent,
    });
  } catch (error) {
    console.error("Update Monthly Indent Error:", error);

    return errorResponse(res, {
      statusCode: 500,
      message: "Failed to update monthly indent",
      error: error.message,
    });
  }
};

// Delete Monthly Indent
export const deleteMonthlyIndent = async (req, res) => {
  try {
    const { id } = req.params;

    const monthlyIndent = await MonthlyIndent.findById(id);

    if (!monthlyIndent) {
      return errorResponse(res, {
        statusCode: 404,
        message: "Monthly indent not found",
      });
    }

    await MonthlyIndent.findByIdAndDelete(id);

    return successResponse(res, {
      statusCode: 200,
      message: "Monthly indent deleted successfully",
    });
  } catch (error) {
    console.error("Delete Monthly Indent Error:", error);

    return errorResponse(res, {
      statusCode: 500,
      message: "Failed to delete monthly indent",
      error: error.message,
    });
  }
};
