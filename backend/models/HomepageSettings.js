import mongoose from "mongoose";

const homepageSettingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    widgets: [
      {
        id: String,
        type: {
          type: String,
          enum: ["employees", "vacations", "incidents", "documents", "salary", "rewards"],
        },
        label: String,
        order: Number,
        enabled: { type: Boolean, default: true },
        color: { type: String, default: "from-green-400 to-emerald-500" },
      },
    ],
    layout: {
      type: String,
      enum: ["grid", "list"],
      default: "grid",
    },
    columns: {
      type: Number,
      enum: [1, 2, 3, 4],
      default: 3,
    },
  },
  { timestamps: true }
);

export default mongoose.model("HomepageSettings", homepageSettingsSchema);
