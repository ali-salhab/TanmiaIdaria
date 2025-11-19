import mongoose from "mongoose";

const fileShareSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number,
    },
    fileType: {
      type: String,
      enum: ["image", "document", "other"],
      default: "other",
    },
    message: {
      type: String,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model("FileShare", fileShareSchema);
