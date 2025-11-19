import mongoose from "mongoose";

const circularSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    files: [
      {
        filename: String,
        originalName: String,
        path: String,
        mimetype: String,
        size: Number,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    images: [
      {
        filename: String,
        originalName: String,
        path: String,
        mimetype: String,
        size: Number,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    viewers: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isPublished: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Circular", circularSchema);
