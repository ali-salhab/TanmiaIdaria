import mongoose from "mongoose";

const operationLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  username: { type: String, required: true },
  action: { type: String, required: true }, // مثال: "add", "update", "delete"
  section: { type: String, required: true }, // مثال: "vacations", "employees"
  details: { type: String }, // وصف إضافي للعملية
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("OperationLog", operationLogSchema);
