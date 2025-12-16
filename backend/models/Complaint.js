import mongoose from "mongoose";

const complaintSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, default: "عام" },
    priority: {
      type: String,
      enum: ["منخفض", "متوسط", "عالي"],
      default: "متوسط",
    },
    status: {
      type: String,
      enum: ["جديد", "قيد المراجعة", "قيد المعالجة", "مغلق"],
      default: "جديد",
    },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
    attachments: [
      {
        name: String,
        url: String,
        type: String,
        size: Number,
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Complaint", complaintSchema);
