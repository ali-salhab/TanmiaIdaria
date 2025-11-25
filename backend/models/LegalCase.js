import mongoose from "mongoose";

const legalCaseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    caseType: {
      type: String,
      enum: [
        "استشارة قانونية",
        "قضية إدارية",
        "قضية عمالية",
        "عقد",
        "شكوى",
        "طلب",
        "مراجعة",
        "استئناف",
        "أخرى",
      ],
      required: true,
    },
    priority: {
      type: String,
      enum: ["عادية", "متوسطة", "عاجلة", "عاجل جداً"],
      default: "عادية",
    },
    status: {
      type: String,
      enum: ["مفتوحة", "قيد المعالجة", "في الانتظار", "مغلقة", "ملغاة"],
      default: "مفتوحة",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    attachments: [
      {
        fileName: { type: String, required: true },
        fileUrl: { type: String, required: true },
        fileSize: { type: Number },
        fileType: {
          type: String,
          enum: ["image", "document", "other"],
          default: "other",
        },
        uploadedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    replies: [
      {
        replyText: String,
        attachments: [
          {
            fileName: { type: String, required: true },
            fileUrl: { type: String, required: true },
            fileSize: { type: Number },
            fileType: {
              type: String,
              enum: ["image", "document", "other"],
              default: "other",
            },
            uploadedBy: {
              type: mongoose.Schema.Types.ObjectId,
              ref: "User",
              required: true,
            },
            uploadedAt: {
              type: Date,
              default: Date.now,
            },
          },
        ],
        repliedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        repliedAt: {
          type: Date,
          default: Date.now,
        },
        replyType: {
          type: String,
          enum: ["text", "file", "both"],
          default: "text",
        },
      },
    ],
    dueDate: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    tags: [String],
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Create indexes for better performance
legalCaseSchema.index({ status: 1 });
legalCaseSchema.index({ caseType: 1 });
legalCaseSchema.index({ createdBy: 1 });
legalCaseSchema.index({ assignedTo: 1 });
legalCaseSchema.index({ createdAt: -1 });

export default mongoose.model("LegalCase", legalCaseSchema);
