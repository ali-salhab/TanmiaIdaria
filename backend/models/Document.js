import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    department: { type: String, required: true },
    documentType: { type: String, required: true },
    status: { type: String, default: "جديدة" },
    documentNumber: { type: String, required: true },
    incomingNumber: { type: String },
    incomingFromEntity: { type: String },
    incomingMailNumber: { type: String },
    incomingRegistryNumber: { type: String },
    incomingRegisteredAt: { type: String },
    incomingSubject: { type: String },
    year: { type: String, required: true },
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileSize: { type: Number },
    fileType: { type: String },
    downloadCount: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Index for quick lookups by number/year if needed in the future
// documentSchema.index({ documentNumber: 1, year: 1 }, { unique: true });

export default mongoose.model("Document", documentSchema);
