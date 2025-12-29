import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Document from "../models/Document.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GET /api/documents
export const getDocuments = async (req, res) => {
  try {
    const documents = await Document.find().sort({ createdAt: -1 });
    res.json({ documents });
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({ message: "خطأ في جلب الوثائق" });
  }
};

// POST /api/documents/upload
export const uploadDocument = async (req, res) => {
  try {
    const {
      department,
      documentType,
      status,
      documentNumber,
      incomingNumber,
      incomingFromEntity,
      incomingMailNumber,
      incomingRegistryNumber,
      incomingRegisteredAt,
      incomingSubject,
      year,
    } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "الملف مطلوب" });
    }

    if (!department || !documentType || !status || !documentNumber || !year) {
      return res.status(400).json({ message: "الحقول المطلوبة غير مكتملة" });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const fileType = req.file.mimetype?.startsWith("image/")
      ? "image"
      : "document";

    const document = await Document.create({
      department,
      documentType,
      status,
      documentNumber,
      incomingNumber,
      incomingFromEntity,
      incomingMailNumber,
      incomingRegistryNumber,
      incomingRegisteredAt,
      incomingSubject,
      year,
      fileName: req.file.originalname,
      fileUrl,
      fileSize: req.file.size,
      fileType,
      createdBy: req.user?._id,
    });

    res.status(201).json({ message: "تم رفع الوثيقة بنجاح", document });
  } catch (error) {
    console.error("Error uploading document:", error);
    res.status(500).json({ message: "خطأ في رفع الوثيقة" });
  }
};

// DELETE /api/documents/:id
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({ message: "الوثيقة غير موجودة" });
    }

    const filePath = path.join(
      __dirname,
      "..",
      "uploads",
      path.basename(document.fileUrl)
    );

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await document.deleteOne();

    res.json({ message: "تم حذف الوثيقة" });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({ message: "خطأ في حذف الوثيقة" });
  }
};

// PUT /api/documents/:id/download
export const incrementDocumentDownloads = async (req, res) => {
  try {
    const { id } = req.params;
    const document = await Document.findByIdAndUpdate(
      id,
      { $inc: { downloadCount: 1 } },
      { new: true }
    );

    if (!document) {
      return res.status(404).json({ message: "الوثيقة غير موجودة" });
    }

    res.json({ document });
  } catch (error) {
    console.error("Error incrementing download count:", error);
    res.status(500).json({ message: "خطأ أثناء تحميل الوثيقة" });
  }
};

// PUT /api/documents/:id
export const updateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (req.file) {
      updateData.fileUrl = `/uploads/${req.file.filename}`;
      updateData.fileName = req.file.originalname;
      updateData.fileSize = req.file.size;
      updateData.fileType = req.file.mimetype?.startsWith("image/")
        ? "image"
        : "document";
    }

    const document = await Document.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!document) {
      return res.status(404).json({ message: "الوثيقة غير موجودة" });
    }

    res.json({ message: "تم تحديث الوثيقة بنجاح", document });
  } catch (error) {
    console.error("Error updating document:", error);
    res.status(500).json({ message: "خطأ في تحديث الوثيقة" });
  }
};
