import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    label: {
      type: String,
      required: true,
    },
    description: String,
    category: {
      type: String,
      enum: ["view", "create", "edit", "delete", "manage", "admin"],
      default: "view",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Permission", permissionSchema);
