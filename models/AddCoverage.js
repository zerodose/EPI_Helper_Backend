import mongoose from "mongoose";

const vaccineCoverageSchema = new mongoose.Schema(
  {
    vaccine: {
      type: String,
      required: true,
      enum: [
        "BCG",
        "Hep-B",
        "Penta 1",
        "Penta 2",
        "Penta 3",
        "Measles 1",
        "Measles 2",
        "TD",
        "HPV",
      ],
    },

    doses: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false },
);

const addCoverageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userType: {
    type: String,
    enum: ["fixed", "outreach"],
    required: true,
  },

    coverageDate: {
      type: Date,
      required: true,
    },

    vaccines: {
      type: [vaccineCoverageSchema],
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const AddCoverage = mongoose.model("AddCoverage", addCoverageSchema);

export default AddCoverage;
