import { useState, useEffect } from "react";
import API from "../api/api";
import { useAuth } from "../hooks/useAuth";
import { checkPermission } from "../utils/permissionHelper";
import {
  PlusCircle,
  Download,
  Trash2,
  Eye,
  Search,
  X,
  Printer,
} from "lucide-react";
import { toast } from "react-hot-toast";

const buildFileUrl = (filePath) => {
  const base = import.meta.env.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace("/api", "")
    : `http://${window.location.hostname}:5000`;
  return `${base}${filePath}`;
};

export default function EmployeeDocuments({ employeeId }) {
  const { user } = useAuth();
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
    if (!checkPermission("employees.delete_document", user)) {
      toast.error("ليس لديك صلاحية للقيام بهذا الإجراء");
      return;
    }

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
    const url = buildFileUrl(doc.path);
    const link = document.createElement("a");
    link.href = url;
    link.download = doc.fileName || doc.description || "document";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("تم بدء التحميل");
  };

  const handleView = (doc) => {
    const url = buildFileUrl(doc.path);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handlePrint = (doc) => {
    const url = buildFileUrl(doc.path);
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("يرجى السماح بالنوافذ المنبثقة للطباعة");
      return;
    }

    const isImage = /(png|jpg|jpeg|gif|bmp|webp)$/i.test(doc.path || "");
    const content = isImage
      ? `<img src="${url}" style="max-width:100%;" />`
      : `<iframe src="${url}" style="width:100%;height:100vh;border:0;"></iframe>`;

    printWindow.document.write(
      `<!doctype html><html dir="rtl"><head><title>طباعة الوثيقة</title></head><body style="margin:0;padding:16px;">${content}<script>window.onload=()=>{setTimeout(()=>window.print(),200);};</script></body></html>`
    );
    printWindow.document.close();
  };

  const filteredDocs = docs.filter(
    (doc) =>
      doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.path?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatSize = (size) => {
    if (!size) return "--";
    if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
    if (size >= 1024) return `${(size / 1024).toFixed(0)} KB`;
    return `${size} B`;
  };

  const getFileIcon = (path) => {
    const ext = path?.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif"].includes(ext)) return "🖼️";
    if (["pdf"].includes(ext)) return "📕";
    if (["doc", "docx"].includes(ext)) return "📄";
    if (["xls", "xlsx"].includes(ext)) return "📊";
    return "📎";
  };

  return (
    <div
      className="p-4 border border-slate-700 rounded mt-4 bg-slate-800 shadow-sm"
      dir="rtl"
    >
      <h2 className="font-semibold text-lg mb-4 text-slate-100">
        📂 وثائق الموظف
      </h2>

      {/* Search */}
      <div className="mb-4 flex items-center gap-2">
        <Search className="w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="ابحث حسب الاسم أو الوصف..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-500"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="p-2 hover:bg-slate-700 rounded-lg text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Existing Documents */}
      {loading ? (
        <div className="text-center py-8 text-slate-500">جاري التحميل...</div>
      ) : filteredDocs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {filteredDocs.map((doc, i) => (
            <div
              key={i}
              className="bg-slate-700/50 rounded-xl shadow-md overflow-hidden border border-slate-600 hover:shadow-lg transition group"
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="text-3xl">{getFileIcon(doc.path)}</div>
                  <button
                    onClick={() => setSelectedDoc(doc)}
                    className="p-1 hover:bg-slate-600 rounded opacity-0 group-hover:opacity-100 transition"
                    title="عرض التفاصيل"
                  >
                    <Eye className="w-4 h-4 text-blue-400" />
                  </button>
                </div>

                <p className="font-medium text-slate-200 text-sm line-clamp-2 mb-1">
                  {doc.description || "بدون وصف"}
                </p>
                <p className="text-xs text-slate-400 mb-1 line-clamp-1">
                  {doc.fileName || doc.path?.split("/").pop()}
                </p>
                <div className="text-[11px] text-slate-400 flex gap-2 mb-2 flex-wrap">
                  <span className="bg-slate-800 border border-slate-600 px-2 py-0.5 rounded-full">
                    {formatSize(doc.size)}
                  </span>
                  <span className="bg-slate-800 border border-slate-600 px-2 py-0.5 rounded-full">
                    {doc.mimeType || "غير معروف"}
                  </span>
                  {doc.uploadedAt && (
                    <span className="bg-slate-800 border border-slate-600 px-2 py-0.5 rounded-full">
                      {new Date(doc.uploadedAt).toLocaleDateString("ar-EG")}
                    </span>
                  )}
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleView(doc)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1 transition"
                    title="عرض"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handlePrint(doc)}
                    className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1 transition"
                    title="طباعة"
                  >
                    <Printer className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDownload(doc)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1 transition"
                    title="تنزيل"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(i)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1 transition"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-slate-500">
          {searchTerm ? "لم يتم العثور على وثائق" : "لا توجد وثائق مرفوعة"}
        </div>
      )}

      {/* New Files Upload */}
      {newFiles.length > 0 && (
        <div className="mt-6 border-t border-slate-700 pt-4">
          <h3 className="font-medium mb-3 text-slate-200">
            📝 وثائق جديدة ({newFiles.length})
          </h3>
          <div className="space-y-2 mb-4 max-h-40 overflow-y-auto custom-scrollbar">
            {newFiles.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-2 border border-slate-600 p-2 rounded bg-slate-700/50"
              >
                <span className="text-slate-200 text-sm flex-1 truncate">
                  {item.file.name}
                </span>
                <button
                  onClick={() => removeNewFile(index)}
                  className="p-1 hover:bg-red-500/20 rounded"
                >
                  <X className="w-4 h-4 text-red-400" />
                </button>
              </div>
            ))}
          </div>
          <div className="space-y-2 mb-4">
            {newFiles.map((item, index) => (
              <div key={index}>
                <label className="text-xs text-slate-400 mb-1 block">
                  الوصف: {item.file.name}
                </label>
                <input
                  type="text"
                  placeholder="أدخل وصف الملف..."
                  value={item.description}
                  onChange={(e) =>
                    handleDescriptionChange(index, e.target.value)
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-500"
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
              className="flex-1 bg-slate-600 text-slate-200 px-4 py-2 rounded font-medium hover:bg-slate-500 transition"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Add More Files */}
      <div className="mt-4 flex justify-center">
        <label className="flex flex-col items-center cursor-pointer hover:bg-slate-700/50 p-4 rounded-lg border-2 border-dashed border-slate-600 w-full transition group">
          <PlusCircle className="text-blue-500 w-8 h-8 mb-1 group-hover:text-blue-400" />
          <span className="text-sm text-blue-500 font-medium group-hover:text-blue-400">
            إضافة وثائق
          </span>
          <span className="text-xs text-slate-500 group-hover:text-slate-400">
            أو اسحب الملفات هنا
          </span>
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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
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
                <div className="text-6xl mb-4">
                  {getFileIcon(selectedDoc.path)}
                </div>
              </div>

              <div className="space-y-3">
                <div className="bg-slate-700/50 p-3 rounded border border-slate-600">
                  <p className="text-xs text-slate-400 mb-1">الوصف</p>
                  <p className="font-medium text-slate-200">
                    {selectedDoc.description || "بدون وصف"}
                  </p>
                </div>

                <div className="bg-slate-700/50 p-3 rounded border border-slate-600">
                  <p className="text-xs text-slate-400 mb-1">اسم الملف</p>
                  <p className="font-medium break-all text-slate-200">
                    {selectedDoc.fileName || selectedDoc.path?.split("/").pop()}
                  </p>
                </div>

                <div className="bg-slate-700/50 p-3 rounded border border-slate-600">
                  <p className="text-xs text-slate-400 mb-1">تاريخ الرفع</p>
                  <p className="font-medium text-slate-200">
                    {selectedDoc.uploadedAt
                      ? new Date(selectedDoc.uploadedAt).toLocaleString("ar-EG")
                      : "غير متوفر"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-700/50 p-3 rounded border border-slate-600">
                    <p className="text-xs text-slate-400 mb-1">الحجم</p>
                    <p className="font-medium text-slate-200">
                      {formatSize(selectedDoc.size)}
                    </p>
                  </div>
                  <div className="bg-slate-700/50 p-3 rounded border border-slate-600">
                    <p className="text-xs text-slate-400 mb-1">النوع</p>
                    <p className="font-medium text-slate-200">
                      {selectedDoc.mimeType || "غير معروف"}
                    </p>
                  </div>
                </div>

                <div className="bg-slate-700/50 p-3 rounded border border-slate-600">
                  <p className="text-xs text-slate-400 mb-1">المسار</p>
                  <p className="font-mono text-sm break-all text-slate-300">
                    {selectedDoc.path}
                  </p>
                </div>
              </div>

              {selectedDoc.path && (
                <div className="bg-slate-900 border border-slate-700 p-4 rounded space-y-3">
                  {/* Image preview */}
                  <img
                    src={buildFileUrl(selectedDoc.path)}
                    alt={selectedDoc.description}
                    className="w-full rounded max-h-80 object-contain"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                  {/* PDF/Other fallback */}
                  <iframe
                    src={buildFileUrl(selectedDoc.path)}
                    title="preview"
                    className="w-full rounded border border-slate-600 max-h-[60vh] bg-white"
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
                  className="flex-1 bg-slate-600 hover:bg-slate-500 text-white py-2 rounded font-medium transition"
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
