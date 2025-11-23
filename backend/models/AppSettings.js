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
      enum: ["light", "dark", "auto"],
      default: "light",
    },
    language: {
      type: String,
      enum: ["ar", "en"],
      default: "ar",
    },
    sounds: {
      notifications: {
        enabled: { type: Boolean, default: true },
        volume: { type: Number, default: 0.7, min: 0, max: 1 },
      },
      messages: {
        enabled: { type: Boolean, default: true },
        volume: { type: Number, default: 0.7, min: 0, max: 1 },
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("AppSettings", appSettingsSchema);
