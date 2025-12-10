import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import API from "../api/api";
import { Trash2, Plus, Printer, FileText, X } from "lucide-react";
import toast from "react-hot-toast";

export default function EmployeeCourses() {
  const { id } = useParams();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    duration: "",
    startDate: new Date().toISOString().split("T")[0],
  });
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchCourses();
  }, [id]);

  const fetchCourses = async () => {
    try {
      const res = await API.get(`/courses/${id}`);
      setCourses(res.data);
    } catch (error) {
      toast.error("فشل تحميل الدورات");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("name", formData.name);
    data.append("duration", formData.duration);
    data.append("startDate", formData.startDate);
    if (file) {
      data.append("file", file);
    }

    try {
      await API.post(`/courses/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("تم إضافة الدورة");
      setShowModal(false);
      setFormData({
        name: "",
        duration: "",
        startDate: new Date().toISOString().split("T")[0],
      });
      setFile(null);
      fetchCourses();
    } catch (error) {
      toast.error("فشل إضافة الدورة");
    }
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه الدورة؟")) return;
    try {
      await API.delete(`/courses/${courseId}`);
      toast.success("تم حذف الدورة");
      setCourses(courses.filter((c) => c._id !== courseId));
    } catch (error) {
      toast.error("فشل حذف الدورة");
    }
  };

  const handlePrint = (course) => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>طباعة الدورة</title>
          <style>
            body { font-family: 'Arial', sans-serif; padding: 20px; text-align: center; }
            .header { margin-bottom: 30px; }
            .content { border: 1px solid #000; padding: 20px; border-radius: 10px; }
            .row { margin: 10px 0; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>وثيقة دورة تدريبية</h1>
          </div>
          <div class="content">
            <div class="row"><strong>اسم الدورة:</strong> ${course.name}</div>
            <div class="row"><strong>المدة:</strong> ${course.duration}</div>
            <div class="row"><strong>تاريخ البداية:</strong> ${new Date(course.startDate).toLocaleDateString('ar-SY')}</div>
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">سجل الدورات التدريبية</h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-purple-700"
        >
          <Plus size={18} /> إضافة دورة
        </button>
      </div>

      {loading ? (
        <p className="text-center">جاري التحميل...</p>
      ) : courses.length === 0 ? (
        <p className="text-center text-gray-500">لا توجد دورات مسجلة.</p>
      ) : (
        <div className="grid gap-4">
          {courses.map((course) => (
            <div
              key={course._id}
              className="bg-white border rounded-lg p-4 flex justify-between items-center shadow-sm"
            >
              <div>
                <p className="font-bold text-lg text-purple-700">{course.name}</p>
                <p className="text-gray-600">المدة: {course.duration}</p>
                <p className="text-sm text-gray-500">
                  تاريخ البداية: {new Date(course.startDate).toLocaleDateString("ar-SY")}
                </p>
                {course.file && (
                  <a
                    href={`${import.meta.env.VITE_API_URL}/${course.file}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-sm flex items-center gap-1 mt-1 hover:underline"
                  >
                    <FileText size={14} /> عرض الملف المرفق
                  </a>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePrint(course)}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                  title="طباعة"
                >
                  <Printer size={18} />
                </button>
                <button
                  onClick={() => handleDelete(course._id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                  title="حذف"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">إضافة دورة جديدة</h3>
              <button onClick={() => setShowModal(false)}>
                <X className="text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">اسم الدورة</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full border rounded p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">المدة</label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) =>
                    setFormData({ ...formData, duration: e.target.value })
                  }
                  className="w-full border rounded p-2"
                  required
                  placeholder="مثال: 3 أيام، أسبوعين..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">تاريخ البداية</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="w-full border rounded p-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  المرفقات (سكنر أو ملف)
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => setFile(e.target.files[0])}
                  className="w-full border rounded p-2"
                />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
