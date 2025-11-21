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
      default: "view",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Permission", permissionSchema);
