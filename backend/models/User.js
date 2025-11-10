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
    },
  },
  { timestamps: true }
);

// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model("User", userSchema);
