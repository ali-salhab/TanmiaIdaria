import Complaint from "../models/Complaint.js";
import { notifyAdmin } from "../services/notificationService.js";

export const listComplaints = async (req, res) => {
  try {
    const { q, status, priority } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } },
      ];
    }
    const complaints = await Complaint.find(filter)
      .sort({ createdAt: -1 })
      .populate("employee", "fullName currentJobTitle")
      .populate("createdBy", "username role")
      .populate("updatedBy", "username role");
    res.json(complaints);
  } catch (err) {
    console.error("listComplaints error", err);
    res.status(500).json({ message: "فشل في تحميل الشكاوى" });
  }
};

export const getComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate("employee", "fullName currentJobTitle")
      .populate("createdBy", "username role")
      .populate("updatedBy", "username role");
    if (!complaint)
      return res.status(404).json({ message: "الشكوى غير موجودة" });
    res.json(complaint);
  } catch (err) {
    console.error("getComplaint error", err);
    res.status(500).json({ message: "فشل في جلب الشكوى" });
  }
};

export const createComplaint = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      // Accept uploaded files
      attachments: (req.files || []).map((file) => ({
        name: file.originalname,
        url: `/uploads/${file.filename}`,
        type: file.mimetype,
        size: file.size,
      })),
      createdBy: req.user?._id,
      updatedBy: req.user?._id,
    };
    const complaint = await Complaint.create(payload);

    if (req.user && req.user.role !== "admin") {
      await notifyAdmin({
        actionBy: req.user._id,
        section: "complaints",
        action: "create",
        title: "تم إضافة شكوى جديدة",
        message: `قام ${
          req.user.username || "مستخدم"
        } بإنشاء شكوى جديدة بعنوان: ${complaint.title}`,
        employeeName: null,
        department: null,
        io: req.io,
      });
    }

    res.status(201).json(complaint);
  } catch (err) {
    console.error("createComplaint error", err);
    res.status(400).json({ message: "فشل في إنشاء الشكوى" });
  }
};

export const updateComplaint = async (req, res) => {
  try {
    const attachments = (req.files || []).map((file) => ({
      name: file.originalname,
      url: `/uploads/${file.filename}`,
      type: file.mimetype,
      size: file.size,
    }));

    const complaint = await Complaint.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        ...(attachments.length ? { attachments } : {}),
        updatedBy: req.user?._id,
      },
      { new: true, runValidators: true }
    );

    if (!complaint)
      return res.status(404).json({ message: "الشكوى غير موجودة" });

    if (req.user && req.user.role !== "admin") {
      await notifyAdmin({
        actionBy: req.user._id,
        section: "complaints",
        action: "update",
        title: "تم تعديل شكوى",
        message: `قام ${req.user.username || "مستخدم"} بتعديل شكوى بعنوان: ${
          complaint.title
        }`,
        io: req.io,
      });
    }

    res.json(complaint);
  } catch (err) {
    console.error("updateComplaint error", err);
    res.status(400).json({ message: "فشل في تعديل الشكوى" });
  }
};

export const deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint)
      return res.status(404).json({ message: "الشكوى غير موجودة" });

    await complaint.deleteOne();

    if (req.user && req.user.role !== "admin") {
      await notifyAdmin({
        actionBy: req.user._id,
        section: "complaints",
        action: "delete",
        title: "تم حذف شكوى",
        message: `قام ${req.user.username || "مستخدم"} بحذف شكوى بعنوان: ${
          complaint.title
        }`,
        io: req.io,
      });
    }

    res.json({ message: "تم الحذف" });
  } catch (err) {
    console.error("deleteComplaint error", err);
    res.status(500).json({ message: "فشل في حذف الشكوى" });
  }
};
