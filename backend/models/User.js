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
  // console.log(this);
  // console.log(this);
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

export default mongoose.model("User", userSchema);
