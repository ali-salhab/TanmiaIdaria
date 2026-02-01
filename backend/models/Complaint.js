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
    complainantName: { type: String, required: true }, // اسم مقدم الشكوى
    mobilePhone: { type: String, required: true }, // رقم الموبايل
    nationalId: { type: String }, // الرقم الوطني
    attachments: [
      {
        name: String,
        url: String,
        fileType: String,
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
