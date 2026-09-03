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

const addCoverageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  coverageDate: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}-\d{2}$/,
  },

  vaccines: {
    type: [vaccineCoverageSchema],
    required: true,
  },

  createdAt: {
    type: String,
    required: true,
  },

  updatedAt: {
    type: String,
    required: true,
  },
});

// One user cannot have two coverage records on the same date.
addCoverageSchema.index(
  {
    user: 1,
    coverageDate: 1,
  },
  {
    unique: true,
  },
);

const AddCoverage = mongoose.model("AddCoverage", addCoverageSchema);

export default AddCoverage;
