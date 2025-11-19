import FileShare from "../models/FileShare.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const uploadAndShareFile = async (req, res) => {
  try {
    const { recipientId, message } = req.body;
    const senderId = req.user._id;

    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const fileType = req.file.mimetype.startsWith("image/") 
      ? "image" 
      : req.file.mimetype.includes("document") || req.file.originalname.endsWith(".pdf") || req.file.originalname.endsWith(".docx") || req.file.originalname.endsWith(".xlsx")
      ? "document"
      : "other";

    const fileShare = await FileShare.create({
      sender: senderId,
      recipient: recipientId,
      fileName: req.file.originalname,
      fileUrl,
      fileSize: req.file.size,
      fileType,
      message,
    });

    res.status(201).json(fileShare);
  } catch (error) {
    console.error("Error sharing file:", error);
    res.status(500).json({ message: "Server error while sharing file" });
  }
};

export const getReceivedFiles = async (req, res) => {
  try {
    const userId = req.user._id;

    const files = await FileShare.find({ recipient: userId })
      .populate("sender", "username profile.firstName profile.lastName profile.avatar")
      .sort({ createdAt: -1 });

    res.json(files);
  } catch (error) {
    console.error("Error fetching received files:", error);
    res.status(500).json({ message: "Server error while fetching files" });
  }
};

export const getSentFiles = async (req, res) => {
  try {
    const userId = req.user._id;

    const files = await FileShare.find({ sender: userId })
      .populate("recipient", "username profile.firstName profile.lastName profile.avatar")
      .sort({ createdAt: -1 });

    res.json(files);
  } catch (error) {
    console.error("Error fetching sent files:", error);
    res.status(500).json({ message: "Server error while fetching files" });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const fileShare = await FileShare.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true }
    );

    if (!fileShare) {
      return res.status(404).json({ message: "File share not found" });
    }

    res.json(fileShare);
  } catch (error) {
    console.error("Error marking file as read:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteFileShare = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const fileShare = await FileShare.findById(id);

    if (!fileShare) {
      return res.status(404).json({ message: "File share not found" });
    }

    if (fileShare.sender.toString() !== userId.toString() && fileShare.recipient.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized to delete this file" });
    }

    const filePath = path.join(__dirname, "..", "public", fileShare.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await FileShare.findByIdAndDelete(id);

    res.json({ message: "File share deleted successfully" });
  } catch (error) {
    console.error("Error deleting file share:", error);
    res.status(500).json({ message: "Server error while deleting file" });
  }
};

export const incrementDownloadCount = async (req, res) => {
  try {
    const { id } = req.params;

    const fileShare = await FileShare.findByIdAndUpdate(
      id,
      { $inc: { downloadCount: 1 } },
      { new: true }
    );

    if (!fileShare) {
      return res.status(404).json({ message: "File share not found" });
    }

    res.json(fileShare);
  } catch (error) {
    console.error("Error updating download count:", error);
    res.status(500).json({ message: "Server error" });
  }
};
