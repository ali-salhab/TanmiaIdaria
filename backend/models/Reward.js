import mongoose from "mongoose";

const rewardSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    type: {
      type: String,
      enum: ["material", "thank_you_card", "financial_thank_you"], // مادية، بطاقة شكر، مالية + بطاقة شكر
      required: true,
    },
    description: {
      type: String,
    },
    decisionNumber: {
      type: String,
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

export default mongoose.model("Reward", rewardSchema);
