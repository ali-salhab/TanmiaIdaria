import mongoose from "mongoose";

const penaltySchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    file: {
      type: String, // Path to uploaded file
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Penalty", penaltySchema);
