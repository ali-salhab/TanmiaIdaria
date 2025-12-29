import Decision from "../models/Decision.js";
import path from "path";
import fs from "fs/promises";

// Get all decisions with filters and search
export const getAllDecisions = async (req, res) => {
  try {
    const {
      search,
      category,
      status,
      priority,
      year,
      receivedFrom,
      startDate,
      endDate,
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};

    // Text search
    if (search) {
      query.$or = [
        { decisionNumber: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { receivedFrom: { $regex: search, $options: "i" } },
      ];
    }

    // Filters
    if (category) query.category = category;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (receivedFrom)
      query.receivedFrom = { $regex: receivedFrom, $options: "i" };

    // Date filters
    if (year) {
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59);
      query.decisionDate = { $gte: startOfYear, $lte: endOfYear };
    }

    if (startDate || endDate) {
      query.decisionDate = {};
      if (startDate) query.decisionDate.$gte = new Date(startDate);
      if (endDate) query.decisionDate.$lte = new Date(endDate);
    }

    const decisions = await Decision.find(query)
      .populate("createdBy", "username")
      .populate("updatedBy", "username")
      .populate("relatedEmployees", "firstName lastName fullName nationalId")
      .sort({ decisionDate: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await Decision.countDocuments(query);

    res.json({
      decisions,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    console.error("Error fetching decisions:", error);
    res
      .status(500)
      .json({ message: "خطأ في جلب القرارات", error: error.message });
  }
};

// Get single decision by ID
export const getDecisionById = async (req, res) => {
  try {
    const decision = await Decision.findById(req.params.id)
      .populate("createdBy", "username")
      .populate("updatedBy", "username")
      .populate(
        "relatedEmployees",
        "firstName lastName fullName nationalId phone currentJobTitle"
      );

    if (!decision) {
      return res.status(404).json({ message: "القرار غير موجود" });
    }

    res.json(decision);
  } catch (error) {
    console.error("Error fetching decision:", error);
    res
      .status(500)
      .json({ message: "خطأ في جلب القرار", error: error.message });
  }
};

// Create new decision
export const createDecision = async (req, res) => {
  try {
    const {
      decisionNumber,
      decisionDate,
      receivedFrom,
      title,
      description,
      category,
      status,
      priority,
      relatedEmployees,
      tags,
      notes,
    } = req.body;

    // Check if decision number already exists
    const existing = await Decision.findOne({ decisionNumber });
    if (existing) {
      return res.status(400).json({ message: "رقم القرار موجود مسبقاً" });
    }

    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        attachments.push({
          fileName: file.originalname,
          fileUrl: `/uploads/${file.filename}`,
          fileType: file.mimetype,
          fileSize: file.size,
        });
      }
    }

    const decision = new Decision({
      decisionNumber,
      decisionDate,
      receivedFrom,
      title,
      description,
      category,
      status,
      priority,
      attachments,
      relatedEmployees: relatedEmployees ? JSON.parse(relatedEmployees) : [],
      tags: tags ? JSON.parse(tags) : [],
      notes,
      createdBy: req.user.id,
    });

    await decision.save();

    const populatedDecision = await Decision.findById(decision._id)
      .populate("createdBy", "username")
      .populate("relatedEmployees", "firstName lastName fullName");

    res.status(201).json({
      message: "تم إنشاء القرار بنجاح",
      decision: populatedDecision,
    });
  } catch (error) {
    console.error("Error creating decision:", error);
    res
      .status(500)
      .json({ message: "خطأ في إنشاء القرار", error: error.message });
  }
};

// Update decision
export const updateDecision = async (req, res) => {
  try {
    const decision = await Decision.findById(req.params.id);

    if (!decision) {
      return res.status(404).json({ message: "القرار غير موجود" });
    }

    const {
      decisionNumber,
      decisionDate,
      receivedFrom,
      title,
      description,
      category,
      status,
      priority,
      relatedEmployees,
      tags,
      notes,
    } = req.body;

    // Check if new decision number conflicts with another decision
    if (decisionNumber && decisionNumber !== decision.decisionNumber) {
      const existing = await Decision.findOne({ decisionNumber });
      if (existing) {
        return res.status(400).json({ message: "رقم القرار موجود مسبقاً" });
      }
    }

    // Handle new file uploads
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        decision.attachments.push({
          fileName: file.originalname,
          fileUrl: `/uploads/${file.filename}`,
          fileType: file.mimetype,
          fileSize: file.size,
        });
      }
    }

    // Update fields
    if (decisionNumber) decision.decisionNumber = decisionNumber;
    if (decisionDate) decision.decisionDate = decisionDate;
    if (receivedFrom) decision.receivedFrom = receivedFrom;
    if (title) decision.title = title;
    if (description !== undefined) decision.description = description;
    if (category !== undefined) decision.category = category;
    if (status) decision.status = status;
    if (priority) decision.priority = priority;
    if (relatedEmployees)
      decision.relatedEmployees = JSON.parse(relatedEmployees);
    if (tags) decision.tags = JSON.parse(tags);
    if (notes !== undefined) decision.notes = notes;

    decision.updatedBy = req.user.id;

    await decision.save();

    const populatedDecision = await Decision.findById(decision._id)
      .populate("createdBy", "username")
      .populate("updatedBy", "username")
      .populate("relatedEmployees", "firstName lastName fullName");

    res.json({
      message: "تم تحديث القرار بنجاح",
      decision: populatedDecision,
    });
  } catch (error) {
    console.error("Error updating decision:", error);
    res
      .status(500)
      .json({ message: "خطأ في تحديث القرار", error: error.message });
  }
};

// Delete decision
export const deleteDecision = async (req, res) => {
  try {
    const decision = await Decision.findById(req.params.id);

    if (!decision) {
      return res.status(404).json({ message: "القرار غير موجود" });
    }

    // Delete associated files
    for (const attachment of decision.attachments) {
      try {
        const filePath = path.join(__dirname, "..", attachment.fileUrl);
        await fs.unlink(filePath);
      } catch (err) {
        console.error("Error deleting file:", err);
      }
    }

    await Decision.findByIdAndDelete(req.params.id);

    res.json({ message: "تم حذف القرار بنجاح" });
  } catch (error) {
    console.error("Error deleting decision:", error);
    res
      .status(500)
      .json({ message: "خطأ في حذف القرار", error: error.message });
  }
};

// Delete attachment from decision
export const deleteAttachment = async (req, res) => {
  try {
    const { id, attachmentId } = req.params;
    const decision = await Decision.findById(id);

    if (!decision) {
      return res.status(404).json({ message: "القرار غير موجود" });
    }

    const attachment = decision.attachments.id(attachmentId);
    if (!attachment) {
      return res.status(404).json({ message: "المرفق غير موجود" });
    }

    // Delete file from disk
    try {
      const filePath = path.join(__dirname, "..", attachment.fileUrl);
      await fs.unlink(filePath);
    } catch (err) {
      console.error("Error deleting file:", err);
    }

    decision.attachments.pull(attachmentId);
    decision.updatedBy = req.user.id;
    await decision.save();

    res.json({ message: "تم حذف المرفق بنجاح", decision });
  } catch (error) {
    console.error("Error deleting attachment:", error);
    res
      .status(500)
      .json({ message: "خطأ في حذف المرفق", error: error.message });
  }
};

// Get decision statistics
export const getDecisionStats = async (req, res) => {
  try {
    const totalDecisions = await Decision.countDocuments();
    const activeDecisions = await Decision.countDocuments({ status: "نشط" });
    const archivedDecisions = await Decision.countDocuments({
      status: "مؤرشف",
    });

    const decisionsByCategory = await Decision.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const decisionsByPriority = await Decision.aggregate([
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]);

    const recentDecisions = await Decision.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("createdBy", "username");

    res.json({
      totalDecisions,
      activeDecisions,
      archivedDecisions,
      decisionsByCategory,
      decisionsByPriority,
      recentDecisions,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res
      .status(500)
      .json({ message: "خطأ في جلب الإحصائيات", error: error.message });
  }
};
