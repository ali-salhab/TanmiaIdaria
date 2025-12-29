import mongoose from "mongoose";

const decisionSchema = new mongoose.Schema(
  {
    decisionNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    decisionDate: {
      type: Date,
      required: true,
    },
    receivedFrom: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["نشط", "مؤرشف", "ملغي"],
      default: "نشط",
    },
    priority: {
      type: String,
      enum: ["منخفض", "متوسط", "عالي", "عاجل"],
      default: "متوسط",
    },
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        fileType: String,
        fileSize: Number,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    relatedEmployees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Employee",
      },
    ],
    tags: [String],
    notes: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better search performance
decisionSchema.index({ decisionNumber: 1 });
decisionSchema.index({ decisionDate: -1 });
decisionSchema.index({ receivedFrom: 1 });
decisionSchema.index({ title: "text", description: "text" });
decisionSchema.index({ category: 1 });
decisionSchema.index({ status: 1 });

export default mongoose.model("Decision", decisionSchema);
