import { useState, useEffect } from "react";
import API from "../api/api";
import { PlusCircle, Download, Trash2, Eye, Search, X } from "lucide-react";
import { toast } from "react-hot-toast";

const apiUrl = import.meta.env.VITE_API_URL;

export default function EmployeeDocuments({ employeeId }) {
  const [docs, setDocs] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDocs();
  }, [employeeId]);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/employees/${employeeId}`);
      if (res.data.documents) {
        setDocs(res.data.documents);
      }
    } catch (err) {
      console.error("Failed to load documents:", err);
      toast.error("فشل تحميل الوثائق");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).map((file) => ({
      file,
      description: "",
    }));
    setNewFiles((prev) => [...prev, ...files]);
  };

  const handleDescriptionChange = (index, value) => {
    const updated = [...newFiles];
    updated[index].description = value;
    setNewFiles(updated);
  };

  const removeNewFile = (index) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (!newFiles.length) {
      toast.error("يرجى اختيار ملفات");
      return;
    }

    const formData = new FormData();
    newFiles.forEach((item) => formData.append("files", item.file));
    const descriptions = newFiles.map((item) => item.description);
    formData.append("descriptions", JSON.stringify(descriptions));

    try {
      const res = await API.post(`/employees/${employeeId}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setDocs(res.data.documents);
      setNewFiles([]);
      toast.success("تم رفع الوثائق بنجاح");
    } catch (err) {
      console.error(err);
      toast.error("فشل رفع الوثائق");
    }
  };

  const handleDelete = async (index) => {
    if (!window.confirm("هل تريد حذف هذه الوثيقة؟")) return;

    try {
      const res = await API.delete(
        `/employees/${employeeId}/documents/${index}`
      );
      setDocs(res.data.documents || docs.filter((_, i) => i !== index));
      toast.success("تم حذف الوثيقة بنجاح");
    } catch (err) {
      console.error(err);
      toast.error("فشل حذف الوثيقة");
    }
  };

  const handleDownload = (doc) => {
    const url = `${apiUrl}${doc.path}`;
    const link = document.createElement("a");
    link.href = url;
    link.download = doc.description || "document";
    link.click();
    toast.success("جاري تحميل الملف");
  };

  const filteredDocs = docs.filter(
    (doc) =>
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.path?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFileIcon = (path) => {
    const ext = path?.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif"].includes(ext)) return "🖼️";
    if (["pdf"].includes(ext)) return "📕";
    if (["doc", "docx"].includes(ext)) return "📄";
    if (["xls", "xlsx"].includes(ext)) return "📊";
    return "📎";
  };

  return (
    <div className="p-4 border rounded mt-4 bg-white shadow-sm" dir="rtl">
      <h2 className="font-semibold text-lg mb-4">📂 وثائق الموظف</h2>

      {/* Search */}
      <div className="mb-4 flex items-center gap-2">
        <Search className="w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="ابحث حسب الاسم أو الوصف..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Existing Documents */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
      ) : filteredDocs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {filteredDocs.map((doc, i) => (
            <div
              key={i}
              className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-lg transition group"
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="text-3xl">{getFileIcon(doc.path)}</div>
                  <button
                    onClick={() => setSelectedDoc(doc)}
                    className="p-1 hover:bg-blue-100 rounded opacity-0 group-hover:opacity-100 transition"
                    title="عرض التفاصيل"
                  >
                    <Eye className="w-4 h-4 text-blue-600" />
                  </button>
                </div>

                <p className="font-medium text-gray-800 text-sm line-clamp-2 mb-1">
                  {doc.description || "بدون وصف"}
                </p>
                <p className="text-xs text-gray-500 mb-3 line-clamp-1">
                  {doc.path?.split("/").pop()}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(doc)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1 transition"
                  >
                    <Download className="w-4 h-4" />
                    تنزيل
                  </button>
                  <button
                    onClick={() => handleDelete(i)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? "لم يتم العثور على وثائق" : "لا توجد وثائق مرفوعة"}
        </div>
      )}

      {/* New Files Upload */}
      {newFiles.length > 0 && (
        <div className="mt-6 border-t pt-4">
          <h3 className="font-medium mb-3">📝 وثائق جديدة ({newFiles.length})</h3>
          <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
            {newFiles.map((item, index) => (
              <div key={index} className="flex items-center gap-2 border p-2 rounded bg-blue-50">
                <span className="text-gray-700 text-sm flex-1 truncate">
                  {item.file.name}
                </span>
                <button
                  onClick={() => removeNewFile(index)}
                  className="p-1 hover:bg-red-100 rounded"
                >
                  <X className="w-4 h-4 text-red-600" />
                </button>
              </div>
            ))}
          </div>
          <div className="space-y-2 mb-4">
            {newFiles.map((item, index) => (
              <div key={index}>
                <label className="text-xs text-gray-600 mb-1 block">
                  الوصف: {item.file.name}
                </label>
                <input
                  type="text"
                  placeholder="أدخل وصف الملف..."
                  value={item.description}
                  onChange={(e) => handleDescriptionChange(index, e.target.value)}
                  className="w-full border rounded px-2 py-1 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={uploadFiles}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded font-medium hover:bg-green-700 transition"
            >
              رفع الوثائق
            </button>
            <button
              onClick={() => setNewFiles([])}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded font-medium hover:bg-gray-400 transition"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Add More Files */}
      <div className="mt-4 flex justify-center">
        <label className="flex flex-col items-center cursor-pointer hover:bg-blue-50 p-4 rounded-lg border-2 border-dashed border-blue-300 w-full transition">
          <PlusCircle className="text-blue-600 w-8 h-8 mb-1" />
          <span className="text-sm text-blue-600 font-medium">إضافة وثائق</span>
          <span className="text-xs text-gray-500">أو اسحب الملفات هنا</span>
          <input
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      </div>

      {/* Document Details Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">تفاصيل الوثيقة</h2>
              <button
                onClick={() => setSelectedDoc(null)}
                className="p-1 hover:bg-blue-500 rounded transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-center">
                <div className="text-6xl mb-4">{getFileIcon(selectedDoc.path)}</div>
              </div>

              <div className="space-y-3">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-xs text-gray-600 mb-1">الوصف</p>
                  <p className="font-medium">{selectedDoc.description || "بدون وصف"}</p>
                </div>

                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-xs text-gray-600 mb-1">اسم الملف</p>
                  <p className="font-medium break-all">{selectedDoc.path?.split("/").pop()}</p>
                </div>

                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-xs text-gray-600 mb-1">تاريخ الرفع</p>
                  <p className="font-medium">
                    {new Date(selectedDoc.uploadedAt).toLocaleString("ar-EG")}
                  </p>
                </div>

                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-xs text-gray-600 mb-1">المسار</p>
                  <p className="font-mono text-sm break-all text-gray-600">
                    {selectedDoc.path}
                  </p>
                </div>
              </div>

              {selectedDoc.path && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                  <img
                    src={`${apiUrl}${selectedDoc.path}`}
                    alt={selectedDoc.description}
                    className="w-full rounded max-h-80 object-contain"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => {
                    handleDownload(selectedDoc);
                    setSelectedDoc(null);
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded font-medium flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-5 h-5" />
                  تنزيل
                </button>
                <button
                  onClick={() => setSelectedDoc(null)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 rounded font-medium transition"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
