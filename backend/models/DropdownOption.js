import mongoose from "mongoose";

const dropdownOptionSchema = new mongoose.Schema(
  {
    dropdownId: {
      type: String,
      required: true,
      unique: true,
    },
    label: {
      type: String,
      required: true,
    },
    options: [
      {
        value: String,
        label: String,
        visible: { type: Boolean, default: true },
        order: Number,
      },
    ],
    defaultOptions: [
      {
        value: String,
        label: String,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("DropdownOption", dropdownOptionSchema);
