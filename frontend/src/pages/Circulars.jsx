import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Download, Eye, Trash2, ArrowLeft, X, FileText, Image } from "lucide-react";
import API from "../api/api";
import { toast } from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";

export default function Circulars() {
  const navigate = useNavigate();
  const { user, loading: userLoading } = useAuth();
  const [circulars, setCirculars] = useState([]);
  const [selectedCircular, setSelectedCircular] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewersModal, setShowViewersModal] = useState(false);
  const [viewers, setViewers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
  });

  useEffect(() => {
    if (!userLoading) {
      fetchCirculars();
    }
  }, [userLoading]);

  const fetchCirculars = async () => {
    try {
      setLoading(true);
      const response = await API.get("/circulars");
      setCirculars(response.data);
    } catch (error) {
      console.error("Error fetching circulars:", error);
      toast.error("خطأ في تحميل التعاميم");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCircular = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("يرجى إدخال العنوان");
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("content", formData.content);

      const fileInputs = document.querySelectorAll('input[type="file"]');
      fileInputs.forEach((input, index) => {
        if (input.files && input.files[0]) {
          if (input.name.startsWith("files")) {
            formDataToSend.append(`files_${index}`, input.files[0]);
          } else if (input.name.startsWith("images")) {
            formDataToSend.append(`images_${index}`, input.files[0]);
          }
        }
      });

      await API.post("/circulars", formDataToSend, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("تم إنشاء التعميم بنجاح");
      setFormData({ title: "", content: "" });
      setShowCreateModal(false);
      fetchCirculars();
    } catch (error) {
      console.error("Error creating circular:", error);
      toast.error(error.response?.data?.message || "خطأ في إنشاء التعميم");
    }
  };

  const handleDeleteCircular = async (id) => {
    if (!window.confirm("هل تريد حذف هذا التعميم؟")) return;

    try {
      await API.delete(`/circulars/${id}`);
      toast.success("تم حذف التعميم بنجاح");
      fetchCirculars();
      setSelectedCircular(null);
    } catch (error) {
      console.error("Error deleting circular:", error);
      toast.error("خطأ في حذف التعميم");
    }
  };

  const handleViewCircular = async (circular) => {
    setSelectedCircular(circular);

    try {
      await API.post(`/circulars/${circular._id}/view`);
      fetchCirculars();
    } catch (error) {
      console.error("Error marking as viewed:", error);
    }
  };

  const handleViewViewers = async (circular) => {
    try {
      const response = await API.get(`/circulars/${circular._id}/viewers`);
      setViewers(response.data.viewers);
      setShowViewersModal(true);
    } catch (error) {
      console.error("Error fetching viewers:", error);
      toast.error("خطأ في تحميل المشاهدين");
    }
  };

  const filteredCirculars =
    filter === "viewed"
      ? circulars.filter((c) => c.isViewed)
      : filter === "unviewed"
      ? circulars.filter((c) => !c.isViewed)
      : circulars;

  if (userLoading) {
    return (
      <div dir="rtl" className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">جاري تحميل البيانات...</div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/home")}
              className="p-2 hover:bg-white rounded-lg transition"
              title="العودة"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">📢 التعاميم</h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">تعميم جديد</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "all", label: "الكل" },
            { key: "unviewed", label: "غير مقروء" },
            { key: "viewed", label: "مقروء" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg transition ${
                filter === tab.key ? "bg-blue-600 text-white" : "bg-white text-gray-700 hover:shadow-md"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Circulars List */}
        {loading ? (
          <div className="text-center py-8 text-gray-600">جاري التحميل...</div>
        ) : filteredCirculars.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-gray-600">لا توجد تعاميم</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCirculars.map((circular) => (
              <div
                key={circular._id}
                className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition cursor-pointer border-l-4 ${
                  circular.isViewed ? "border-green-500" : "border-blue-500"
                }`}
                onClick={() => handleViewCircular(circular)}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg text-gray-800 flex-1 line-clamp-2">{circular.title}</h3>
                    {!circular.isViewed && (
                      <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full ml-2 flex-shrink-0">جديد</span>
                    )}
                  </div>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">{circular.content}</p>

                  <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                    <span>👤 {circular.createdBy?.username}</span>
                    <span>👁️ {circular.viewerCount}</span>
                  </div>

                  <div className="flex gap-2 text-xs text-gray-600">
                    {circular.images?.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Image className="w-4 h-4" />
                        {circular.images.length}
                      </div>
                    )}
                    {circular.files?.length > 0 && (
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {circular.files.length}
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-gray-400 mt-3">
                    {new Date(circular.createdAt).toLocaleString("ar-EG")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">تعميم جديد</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateCircular} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">العنوان *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="أدخل عنوان التعميم"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المحتوى</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={5}
                  className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="أدخل نص التعميم"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الصور</label>
                <input
                  type="file"
                  name="images"
                  multiple
                  accept="image/*"
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الملفات</label>
                <input
                  type="file"
                  name="files"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                  className="w-full border rounded-lg px-4 py-2"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                >
                  إنشاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Circular Detail Modal */}
      {selectedCircular && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{selectedCircular.title}</h2>
                <p className="text-blue-100 text-sm">👤 {selectedCircular.createdBy?.username}</p>
              </div>
              <button
                onClick={() => setSelectedCircular(null)}
                className="p-1 hover:bg-blue-500 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-700 whitespace-pre-wrap">{selectedCircular.content}</p>

              {selectedCircular.images?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">📷 الصور</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedCircular.images.map((image, idx) => (
                      <a
                        key={idx}
                        href={image.path}
                        download
                        className="relative group rounded-lg overflow-hidden border hover:shadow-lg transition"
                      >
                        <img src={image.path} alt={image.originalName} className="w-full h-32 object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                          <Download className="w-5 h-5 text-white" />
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selectedCircular.files?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">📄 الملفات</h3>
                  <div className="space-y-2">
                    {selectedCircular.files.map((file, idx) => (
                      <a
                        key={idx}
                        href={file.path}
                        download
                        className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition border"
                      >
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{file.originalName}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                        </div>
                        <Download className="w-5 h-5 text-gray-400" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-700 font-medium">👁️ المشاهدات: {selectedCircular.viewerCount}</span>
                  {(selectedCircular.createdBy._id === user?._id || user?.role === "admin") && (
                    <button
                      onClick={() => handleViewViewers(selectedCircular)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      عرض المشاهدين
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {new Date(selectedCircular.createdAt).toLocaleString("ar-EG")}
                </p>
              </div>

              {(selectedCircular.createdBy._id === user?._id || user?.role === "admin") && (
                <div className="flex gap-2 justify-end pt-4">
                  <button
                    onClick={() => handleDeleteCircular(selectedCircular._id)}
                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition border border-red-300"
                  >
                    <Trash2 className="w-5 h-5" />
                    حذف
                  </button>
                  <button
                    onClick={() => setSelectedCircular(null)}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                  >
                    إغلاق
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Viewers Modal */}
      {showViewersModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 text-white p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">المشاهدون</h2>
              <button
                onClick={() => setShowViewersModal(false)}
                className="p-1 hover:bg-green-500 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {viewers.length === 0 ? (
                <p className="text-center text-gray-600 py-8">لم يشاهد أحد هذا التعميم حتى الآن</p>
              ) : (
                <div className="space-y-2">
                  {viewers.map((viewer, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-bold">
                          {viewer.userId?.username?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{viewer.userId?.username}</p>
                          <p className="text-xs text-gray-500">{viewer.userId?.email}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">
                        {new Date(viewer.viewedAt).toLocaleString("ar-EG")}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
