import mongoose from "mongoose";

const vaccineSchema = new mongoose.Schema(
  {
    vaccine: {
      type: String,
      required: true,
      enum: [
        "BCG",
        "Hep-B",
        "Penta",
        "PCV-10",
        "Rota",
        "MR",
        "TCV",
        "OPV",
        "IPV",
        "TD",
        "HPV",
        "Panadol",
      ],
    },

    dosesPerVial: {
      type: Number,
      required: true,
      min: 0,
    },

    vials: {
      type: Number,
      required: true,
      min: 0,
    },

    doses: {
      type: Number,
      required: true,
      min: 0,
    },

    category: {
      type: String,
      enum: ["routine", "campaign", null],
      default: null,
    },
  },
  { _id: false },
);

const monthlyIndentSchema = new mongoose.Schema(
  {
    indentDate: {
      type: Date,
      required: true,
    },

    receivingType: {
      type: String,
      enum: ["routine", "campaign"],
      required: true,
    },

    vaccines: {
      type: [vaccineSchema],
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const MonthlyIndent = mongoose.model("MonthlyIndent", monthlyIndentSchema);

export default MonthlyIndent;
