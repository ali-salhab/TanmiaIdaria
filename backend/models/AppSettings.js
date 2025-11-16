import mongoose from "mongoose";

const appSettingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    dropdowns: {
      category: {
        type: [String],
        default: ["أولى", "تانية", "تالتة", "رابعة", "خامسة"],
      },
      reason: {
        type: [String],
        default: ["زيادة أجر", "تجديد عقد", "تثبيت", "ترفيع"],
      },
      document_type: {
        type: [String],
        default: ["مرسوم", "قرار"],
      },
    },
    theme: {
      type: String,
      enum: ["blue", "gray", "green"],
      default: "gray",
    },
  },
  { timestamps: true }
);

export default mongoose.model("AppSettings", appSettingsSchema);
