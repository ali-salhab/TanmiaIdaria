import Circular from "../models/Circular.js";
import User from "../models/User.js";

export const createCircular = async (req, res) => {
  try {
    const { title, content } = req.body;
    const userId = req.user._id;

    if (!title || title.trim() === "") {
      return res.status(400).json({ message: "العنوان مطلوب" });
    }

    const files = [];
    const images = [];

    if (req.files && Array.isArray(req.files)) {
      req.files.forEach((file) => {
        const group = file.fieldname.split("_")[0]; // "files" or "images"

        const fileData = {
          filename: file.filename,
          originalName: file.originalname,
          path: `/uploads/circulars/${file.filename}`,
          mimetype: file.mimetype,
          size: file.size,
        };

        if (group === "files") {
          files.push(fileData);
        } else if (group === "images") {
          images.push(fileData);
        }
      });
    }

    const circular = new Circular({
      title,
      content,
      createdBy: userId,
      files,
      images,
      viewers: [{ userId, viewedAt: new Date() }],
    });

    await circular.save();
    await circular.populate("createdBy", "username profile.avatar");

    res.status(201).json({
      message: "تم إنشاء التعميم بنجاح",
      circular,
    });
  } catch (error) {
    console.error("Error creating circular:", error);
    res
      .status(500)
      .json({ message: "خطأ في إنشاء التعميم", error: error.message });
  }
};

export const getAllCirculars = async (req, res) => {
  try {
    const userId = req.user._id;

    const circulars = await Circular.find({
      isDeleted: false,
      isPublished: true,
    })
      .populate("createdBy", "username profile.avatar")
      .sort({ createdAt: -1 })
      .lean();

    const circularWithViewStatus = circulars.map((circular) => {
      const isViewed = circular.viewers.some(
        (v) => v.userId.toString() === userId
      );
      return {
        ...circular,
        isViewed,
        viewerCount: circular.viewers.length,
      };
    });

    res.json(circularWithViewStatus);
  } catch (error) {
    console.error("Error fetching circulars:", error);
    res
      .status(500)
      .json({ message: "خطأ في تحميل التعاميم", error: error.message });
  }
};

export const getCircularById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const circular = await Circular.findById(id)
      .populate("createdBy", "username profile.avatar")
      .populate("viewers.userId", "username profile.avatar");

    if (!circular || circular.isDeleted) {
      return res.status(404).json({ message: "التعميم غير موجود" });
    }

    const isViewed = circular.viewers.some(
      (v) => v.userId._id.toString() === userId.toString()
    );

    if (!isViewed) {
      circular.viewers.push({ userId, viewedAt: new Date() });
      await circular.save();
    }

    res.json(circular);
  } catch (error) {
    console.error("Error fetching circular:", error);
    res
      .status(500)
      .json({ message: "خطأ في تحميل التعميم", error: error.message });
  }
};

export const updateCircular = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const userId = req.user._id;

    const circular = await Circular.findById(id);

    if (!circular) {
      return res.status(404).json({ message: "التعميم غير موجود" });
    }

    if (circular.createdBy.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "لا توجد صلاحية لتحديث هذا التعميم" });
    }

    circular.title = title || circular.title;
    circular.content = content || circular.content;

    await circular.save();
    await circular.populate("createdBy", "username profile.avatar");

    res.json({
      message: "تم تحديث التعميم بنجاح",
      circular,
    });
  } catch (error) {
    console.error("Error updating circular:", error);
    res
      .status(500)
      .json({ message: "خطأ في تحديث التعميم", error: error.message });
  }
};

export const deleteCircular = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    const circular = await Circular.findById(id);

    if (!circular) {
      return res.status(404).json({ message: "التعميم غير موجود" });
    }

    if (circular.createdBy.toString() !== userId && userRole !== "admin") {
      return res
        .status(403)
        .json({ message: "لا توجد صلاحية لحذف هذا التعميم" });
    }

    circular.isDeleted = true;
    await circular.save();

    res.json({ message: "تم حذف التعميم بنجاح" });
  } catch (error) {
    console.error("Error deleting circular:", error);
    res
      .status(500)
      .json({ message: "خطأ في حذف التعميم", error: error.message });
  }
};

export const markAsViewed = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(id, "-----< id ");
    const userId = req.user._id;

    const circular = await Circular.findById(id);

    if (!circular) {
      return res.status(404).json({ message: "التعميم غير موجود" });
    }

    const isViewed = circular.viewers.some((v) => {
      console.log(v.userId.toString() === userId?.toString(), "<----------");
      return v.userId.toString() === userId?.toString();
    });
    console.log("-------------------->");
    console.log(isViewed);
    console.log(circular.viewers);
    if (!isViewed) {
      circular.viewers.push({ userId, viewedAt: new Date() });
      await circular.save();
    }

    res.json({ message: "تم تسجيل المشاهدة", circular });
  } catch (error) {
    console.error("Error marking as viewed:", error);
    res
      .status(500)
      .json({ message: "خطأ في تسجيل المشاهدة", error: error.message });
  }
};

export const getCircularViewers = async (req, res) => {
  console.log("====================================");
  console.log("circular Count");
  console.log("====================================");
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const circular = await Circular.findById(id).populate(
      "viewers.userId",
      "username profile.avatar email"
    );

    if (!circular) {
      return res.status(404).json({ message: "التعميم غير موجود" });
    }

    // if (circular.createdBy.toString() !== userId && req.user.role !== "admin") {
    //   return res.status(403).json({ message: "لا توجد صلاحية لعرض المشاهدين" });
    // }

    res.json({
      totalViewers: circular.viewers.length,
      viewers: circular.viewers,
    });
  } catch (error) {
    console.error("Error fetching viewers:", error);
    res
      .status(500)
      .json({ message: "خطأ في تحميل المشاهدين", error: error.message });
  }
};

export const getCircularStats = async (req, res) => {
  try {
    const userRole = req.user.role;

    if (userRole !== "admin") {
      return res
        .status(403)
        .json({ message: "لا توجد صلاحية للوصول لهذه البيانات" });
    }

    const stats = await Circular.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: null,
          totalCirculars: { $sum: 1 },
          totalViews: { $sum: { $size: "$viewers" } },
          avgViewsPerCircular: { $avg: { $size: "$viewers" } },
        },
      },
    ]);

    const circularsByUser = await Circular.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: "$createdBy",
          count: { $sum: 1 },
          views: { $sum: { $size: "$viewers" } },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
    ]);

    res.json({
      stats: stats[0] || {
        totalCirculars: 0,
        totalViews: 0,
        avgViewsPerCircular: 0,
      },
      topUsers: circularsByUser,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res
      .status(500)
      .json({ message: "خطأ في تحميل الإحصائيات", error: error.message });
  }
};

export const getUnviewedCount = async (req, res) => {
  try {
    const userId = req.user._id;

    const unviewedCount = await Circular.countDocuments({
      isDeleted: false,
      isPublished: true,
      "viewers.userId": { $ne: userId },
    });

    res.json({ unviewedCount });
  } catch (error) {
    console.error("Error fetching unviewed count:", error);
    res
      .status(500)
      .json({ message: "خطأ في تحميل العدد", error: error.message });
  }
};
