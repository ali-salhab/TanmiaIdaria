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
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: function () {
        return this.role !== "admin";
      },
      unique: true,
      sparse: true,
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

userSchema.virtual("permissions").get(function () {
  const perms = {};
  if (Array.isArray(this.directPermissions)) {
    this.directPermissions.forEach((perm) => {
      if (perm && perm.key) perms[perm.key] = true;
    });
  }
  if (Array.isArray(this.permissionGroups)) {
    this.permissionGroups.forEach((group) => {
      if (group && Array.isArray(group.permissions)) {
        group.permissions.forEach((perm) => {
          if (perm && perm.key) perms[perm.key] = true;
        });
      }
    });
  }
  return perms;
});

userSchema.set("toObject", { virtuals: true });
userSchema.set("toJSON", { virtuals: true });

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
