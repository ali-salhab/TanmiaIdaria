import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "employee", "viewer", "user", "hr", "finance"],
      default: "employee",
    },
    permissionGroups: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "PermissionGroup",
      },
    ],
    directPermissions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Permission",
      },
    ],
    permissions: {
      viewEmployees: {
        type: Boolean,
        default: false,
      },
      viewIncidents: {
        type: Boolean,
        default: false,
      },
      viewUsers: {
        type: Boolean,
        default: false,
      },
      viewDocuments: {
        type: Boolean,
        default: false,
      },
      viewSalary: {
        type: Boolean,
        default: false,
      },
      viewReports: {
        type: Boolean,
        default: false,
      },
      editEmployee: {
        type: Boolean,
        default: false,
      },
      manageLeaves: {
        type: Boolean,
        default: false,
      },
      manageReawards: {
        type: Boolean,
        default: false,
      },
      managePunischments: {
        type: Boolean,
        default: false,
      },
      createEmployee: {
        type: Boolean,
        default: false,
      },
      deleteEmployee: {
        type: Boolean,
        default: false,
      },
      createUser: {
        type: Boolean,
        default: false,
      },
      deleteUser: {
        type: Boolean,
        default: false,
      },
      managePermissions: {
        type: Boolean,
        default: false,
      },
      createIncident: {
        type: Boolean,
        default: false,
      },
      deleteIncident: {
        type: Boolean,
        default: false,
      },
      createVacation: {
        type: Boolean,
        default: false,
      },
      approveVacation: {
        type: Boolean,
        default: false,
      },
      viewAnalytics: {
        type: Boolean,
        default: false,
      },
      manageDywan: {
        type: Boolean,
        default: false,
      },
    },
    profile: {
      firstName: String,
      lastName: String,
      email: String,
      phone: String,
      department: String,
      avatar: String,
      bio: String,
      documents: [
        {
          name: String,
          url: String,
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      salaryInfo: {
        image: String,
        uploadedAt: Date,
      },
      employeeList: {
        image: String,
        uploadedAt: Date,
      },
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model("User", userSchema);
