import LegalCase from "../models/LegalCase.js";
import User from "../models/User.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a new legal case
export const createLegalCase = async (req, res) => {
  try {
    const {
      title,
      description,
      caseType,
      priority,
      assignedTo,
      dueDate,
      tags,
    } = req.body;
    const createdBy = req.user._id;

    const legalCase = await LegalCase.create({
      title,
      description,
      caseType,
      priority,
      createdBy,
      assignedTo,
      dueDate,
      tags,
    });

    // Populate the case with user information
    await legalCase.populate([
      {
        path: "createdBy",
        select: "username profile.firstName profile.lastName",
      },
      {
        path: "assignedTo",
        select: "username profile.firstName profile.lastName",
      },
    ]);

    res.status(201).json(legalCase);
  } catch (error) {
    console.error("Error creating legal case:", error);
    res.status(500).json({ message: "خطأ في إنشاء القضية القانونية" });
  }
};

// Get all legal cases with filtering
export const getAllLegalCases = async (req, res) => {
  try {
    const {
      status,
      caseType,
      assignedTo,
      priority,
      page = 1,
      limit = 10,
      search,
    } = req.query;

    // Build filter query
    const filter = { isArchived: false };

    if (status) filter.status = status;
    if (caseType) filter.caseType = caseType;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (priority) filter.priority = priority;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Get cases with pagination and population
    const cases = await LegalCase.find(filter)
      .populate("createdBy", "username profile.firstName profile.lastName")
      .populate("assignedTo", "username profile.firstName profile.lastName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await LegalCase.countDocuments(filter);

    res.json({
      cases,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    console.error("Error fetching legal cases:", error);
    res.status(500).json({ message: "خطأ في جلب القضايا القانونية" });
  }
};

// Get a specific legal case by ID
export const getLegalCaseById = async (req, res) => {
  try {
    const { id } = req.params;

    const legalCase = await LegalCase.findById(id)
      .populate("createdBy", "username profile.firstName profile.lastName")
      .populate("assignedTo", "username profile.firstName profile.lastName")
      .populate(
        "attachments.uploadedBy",
        "username profile.firstName profile.lastName"
      )
      .populate(
        "replies.repliedBy",
        "username profile.firstName profile.lastName"
      )
      .populate(
        "replies.attachments.uploadedBy",
        "username profile.firstName profile.lastName"
      );

    if (!legalCase) {
      return res.status(404).json({ message: "القضية غير موجودة" });
    }

    res.json(legalCase);
  } catch (error) {
    console.error("Error fetching legal case:", error);
    res.status(500).json({ message: "خطأ في جلب القضية" });
  }
};

// Update a legal case
export const updateLegalCase = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if user has permission to update
    const legalCase = await LegalCase.findById(id);
    if (!legalCase) {
      return res.status(404).json({ message: "القضية غير موجودة" });
    }

    // Update the case
    const updatedCase = await LegalCase.findByIdAndUpdate(
      id,
      {
        ...updates,
        completedAt: updates.status === "مغلقة" ? new Date() : undefined,
      },
      { new: true }
    )
      .populate("createdBy", "username profile.firstName profile.lastName")
      .populate("assignedTo", "username profile.firstName profile.lastName");

    res.json(updatedCase);
  } catch (error) {
    console.error("Error updating legal case:", error);
    res.status(500).json({ message: "خطأ في تحديث القضية" });
  }
};

// Delete/archive a legal case
export const deleteLegalCase = async (req, res) => {
  try {
    const { id } = req.params;

    const legalCase = await LegalCase.findById(id);
    if (!legalCase) {
      return res.status(404).json({ message: "القضية غير موجودة" });
    }

    // Soft delete by archiving
    await LegalCase.findByIdAndUpdate(id, { isArchived: true });

    res.json({ message: "تم أرشفة القضية بنجاح" });
  } catch (error) {
    console.error("Error deleting legal case:", error);
    res.status(500).json({ message: "خطأ في حذف القضية" });
  }
};

// Add attachment to a legal case
export const addAttachment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: "لم يتم تقديم ملف" });
    }

    const fileType = req.file.mimetype.startsWith("image/")
      ? "image"
      : req.file.mimetype.includes("document") ||
        req.file.originalname.endsWith(".pdf") ||
        req.file.originalname.endsWith(".docx") ||
        req.file.originalname.endsWith(".xlsx")
      ? "document"
      : "other";

    const attachment = {
      fileName: req.file.originalname,
      fileUrl: `/uploads/${req.file.filename}`,
      fileSize: req.file.size,
      fileType,
      uploadedBy: req.user._id,
      uploadedAt: new Date(),
    };

    const updatedCase = await LegalCase.findByIdAndUpdate(
      id,
      { $push: { attachments: attachment } },
      { new: true }
    ).populate(
      "attachments.uploadedBy",
      "username profile.firstName profile.lastName"
    );

    if (!updatedCase) {
      return res.status(404).json({ message: "القضية غير موجودة" });
    }

    res.json(updatedCase);
  } catch (error) {
    console.error("Error adding attachment:", error);
    res.status(500).json({ message: "خطأ في إضافة المرفق" });
  }
};

// Add reply to a legal case
export const addReply = async (req, res) => {
  try {
    const { id } = req.params;
    const { replyText, replyType = "text" } = req.body;
    const repliedBy = req.user._id;

    const legalCase = await LegalCase.findById(id);
    if (!legalCase) {
      return res.status(404).json({ message: "القضية غير موجودة" });
    }

    const reply = {
      replyText,
      replyType,
      repliedBy,
      repliedAt: new Date(),
    };

    const updatedCase = await LegalCase.findByIdAndUpdate(
      id,
      { $push: { replies: reply } },
      { new: true }
    ).populate([
      {
        path: "replies.repliedBy",
        select: "username profile.firstName profile.lastName",
      },
      {
        path: "replies.attachments.uploadedBy",
        select: "username profile.firstName profile.lastName",
      },
    ]);

    res.json(updatedCase);
  } catch (error) {
    console.error("Error adding reply:", error);
    res.status(500).json({ message: "خطأ في إضافة الرد" });
  }
};

// Add reply with attachments
export const addReplyWithFiles = async (req, res) => {
  try {
    const { id } = req.params;
    const { replyText, replyType = "both" } = req.body;
    const repliedBy = req.user._id;

    const legalCase = await LegalCase.findById(id);
    if (!legalCase) {
      return res.status(404).json({ message: "القضية غير موجودة" });
    }

    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileType = file.mimetype.startsWith("image/")
          ? "image"
          : file.mimetype.includes("document") ||
            file.originalname.endsWith(".pdf") ||
            file.originalname.endsWith(".docx") ||
            file.originalname.endsWith(".xlsx")
          ? "document"
          : "other";

        attachments.push({
          fileName: file.originalname,
          fileUrl: `/uploads/${file.filename}`,
          fileSize: file.size,
          fileType,
          uploadedBy: repliedBy,
          uploadedAt: new Date(),
        });
      }
    }

    const reply = {
      replyText,
      replyType,
      attachments,
      repliedBy,
      repliedAt: new Date(),
    };

    const updatedCase = await LegalCase.findByIdAndUpdate(
      id,
      { $push: { replies: reply } },
      { new: true }
    ).populate([
      {
        path: "replies.repliedBy",
        select: "username profile.firstName profile.lastName",
      },
      {
        path: "replies.attachments.uploadedBy",
        select: "username profile.firstName profile.lastName",
      },
    ]);

    res.json(updatedCase);
  } catch (error) {
    console.error("Error adding reply with files:", error);
    res.status(500).json({ message: "خطأ في إضافة الرد مع الملفات" });
  }
};

// Get users who can receive legal cases (have legal.receive permission)
export const getUsersWithLegalPermission = async (req, res) => {
  try {
    // This would need to be implemented based on your specific permission system
    // For now, we'll return all users as a placeholder
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users with legal permission:", error);
    res.status(500).json({ message: "خطأ في جلب المستخدمين" });
  }
};
