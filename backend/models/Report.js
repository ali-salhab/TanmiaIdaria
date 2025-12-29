import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    reportType: {
      type: String,
      enum: ["employee", "custom"],
      default: "employee",
    },
    filters: {
      search: String,
      governorate: String,
      gender: String,
      nationality: String,
      currentJobTitle: String,
      university: String,
      workLocation: String,
      level1: String,
      level2: String,
      level3: String,
      level4: String,
      level5: String,
      level6: String,
      nationalId: String,
      jobCategory: String,
      status: String,
      phone: String,
      employmentType: String,
      selfNumber: String,
      maritalStatus: String,
      educationLevel: String,
      ageMin: Number,
      ageMax: Number,
      hiringDateFrom: Date,
      hiringDateTo: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastUsed: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Report", reportSchema);
