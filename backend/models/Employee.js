/* =======================
   Employee Schema (Improved)
======================= */

import mongoose from "mongoose";

/* -----------------------
   Normalizers
----------------------- */
const dashToNull = (v) => {
  if (v === "-" || v === "" || v === undefined) return null;
  return v;
};

const dashToNumber = (v) => {
  const n = Number(v);
  return isNaN(n) ? null : n;
};

const dashToDate = (v) => {
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
};

const yesNoToBool = (v) => {
  if (v === true || v === false) return v;
  if (!v) return null;
  const val = String(v).trim();
  if (val === "نعم") return true;
  if (val === "لا") return false;
  return null;
};

/* -----------------------
   Employee Schema
----------------------- */
const employeeSchema = new mongoose.Schema(
  {
    /* ---------- Identity ---------- */
    selfNumber: {
      type: String,
      set: dashToNull,
      unique: true,
      sparse: true, // allows multiple nulls
      default: null, // ensure default is null
    },

    nationalId: {
      type: String,
      set: dashToNull,
      unique: true,
      sparse: true, // allows multiple nulls
      default: null,
    },

    firstName: { type: String, set: dashToNull },
    fatherName: { type: String, set: dashToNull },
    lastName: { type: String, set: dashToNull },
    fullName: { type: String, set: dashToNull },
    motherNameAndLastName: { type: String, set: dashToNull },

    nationality: { type: String, set: dashToNull },
    governorate: { type: String, set: dashToNull },
    city: { type: String, set: dashToNull },
    district: { type: String, set: dashToNull },

    birthPlace: { type: String, set: dashToNull },
    birthDate: { type: Date, set: dashToDate },

    registrationNumber: { type: String, set: dashToNull },
    gender: { type: String, set: dashToNull },
    phone: { type: String, set: dashToNull },

    maritalStatus: { type: String, set: dashToNull },
    wivesCount: { type: Number, set: dashToNumber },
    childrenCount: { type: Number, set: dashToNumber },

    /* ---------- Organization Levels ---------- */
    level1: { type: String, set: dashToNull },
    level2: { type: String, set: dashToNull },
    level3: { type: String, set: dashToNull },
    level4: { type: String, set: dashToNull },
    level5: { type: String, set: dashToNull },
    level6: { type: String, set: dashToNull },

    /* ---------- Employment ---------- */
    currentJobTitle: { type: String, set: dashToNull },
    employmentType: { type: String, set: dashToNull },
    status: { type: String, set: dashToNull },

    hiringDate: { type: Date, set: dashToDate },

    contractType: { type: String, set: dashToNull },
    contractDetails: { type: String, set: dashToNull },
    jobCategory: { type: String, set: dashToNull },

    /* ---------- Education ---------- */
    educationLevel: { type: String, set: dashToNull },
    specialization: { type: String, set: dashToNull },

    degreeType: { type: String, set: dashToNull },
    university: { type: String, set: dashToNull },
    faculty: { type: String, set: dashToNull },
    specialization2: { type: String, set: dashToNull },
    graduationYear: { type: String, set: dashToNull },

    managementDegree: { type: Boolean, set: yesNoToBool },

    /* ---------- Residence ---------- */
    residenceGovernorate: { type: String, set: dashToNull },
    residenceCity: { type: String, set: dashToNull },
    housingType: { type: String, set: dashToNull },

    /* ---------- Family ---------- */
    spouseIsEmployee: { type: Boolean, set: yesNoToBool },
    spouseFullName: { type: String, set: dashToNull },
    spouseWorkplace: { type: String, set: dashToNull },

    /* ---------- Health ---------- */
    healthStatus: { type: String, set: dashToNull },
    illnessDetails: { type: String, set: dashToNull },
    bloodType: { type: String, set: dashToNull },

    /* ---------- Misc ---------- */
    documentAvailable: { type: Boolean, set: yesNoToBool },
    notes: { type: String, set: dashToNull },
    workLocation: { type: String, set: dashToNull },
    onStaff: { type: Boolean, set: yesNoToBool },

    lastSalary: { type: Number, set: dashToNumber },

    administrativeLeaveBalance: { type: Number, default: 0 },

    /* ---------- Documents ---------- */
    documents: [
      {
        path: { type: String, required: true },
        description: { type: String, default: "" },
        fileName: String,
        mimeType: String,
        size: Number,
        uploadedAt: { type: Date, default: Date.now },
        uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],

    incidents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Incident",
      },
    ],
  },
  { timestamps: true }
);

/* -----------------------
   Indexes (optional safety)
----------------------- */
employeeSchema.index({ selfNumber: 1 }, { unique: true, sparse: true });
employeeSchema.index({ nationalId: 1 }, { unique: true, sparse: true });

/* -----------------------
   Export Model
----------------------- */
export default mongoose.model("Employee", employeeSchema);
