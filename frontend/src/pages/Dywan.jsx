import { useState } from "react";
import API from "../api/api";
import { Upload, File, X } from "lucide-react";
import toast from "react-hot-toast";

export default function Dywan() {
  const [file, setFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [department, setDepartment] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [status, setStatus] = useState("");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setFile(selectedFile);
      toast.success("File selected successfully");
    }
  };

  const handleScan = async () => {
    if (!file) {
      toast.error("Please select a document first");
      return;
    }

    if (!department || !documentType || !status) {
      toast.error("Please fill all required fields");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("department", department);
    formData.append("documentType", documentType);
    formData.append("status", status);

    try {
      setLoading(true);
      const res = await API.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Document uploaded successfully");
      setDocuments([...documents, res.data.document]);
      setFile(null);
      setDepartment("");
      setDocumentType("");
      setStatus("");
      document.getElementById("fileInput").value = "";
    } catch (err) {
      toast.error(err.response?.data?.message || "Error uploading document");
    } finally {
      setLoading(false);
    }
  };

  const removeDocument = (index) => {
    setDocuments(documents.filter((_, i) => i !== index));
    toast.success("Document removed");
  };

  return (
    <div className="p-6 font-custom" dir="rtl">
      <div className="mb-6">
        <h2 className="text-3xl text-teal-700 font-extrabold">الديوان</h2>
      </div>

      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-800 mb-6">
          إضافة وثيقة جديدة
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              القسم
            </label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-teal-500"
            >
              <option value="">اختر القسم</option>
              <option value="مديرية المعلوماتية">مديرية المعلوماتية</option>
              <option value="مديرية التنمية الإدارية">
                مديرية التنمية الإدارية
              </option>
              <option value="مكتب التنمية المحلية">مكتب التنمية المحلية</option>
              <option value="مديرية إدارة النفايات الصلبة">
                مديرية إدارة النفايات الصلبة
              </option>
              <option value="مديرية المجالس المحلية">
                مديرية المجالس المحلية
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              نوع الوثيقة
            </label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-teal-500"
            >
              <option value="">اختر نوع الوثيقة</option>
              <option value="تقرير">تقرير</option>
              <option value="قرار">قرار</option>
              <option value="تعميم">تعميم</option>
              <option value="محضر">محضر</option>
              <option value="مراسلة">مراسلة</option>
              <option value="أخرى">أخرى</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              الحالة
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-teal-500"
            >
              <option value="">اختر الحالة</option>
              <option value="جديدة">جديدة</option>
              <option value="قيد المراجعة">قيد المراجعة</option>
              <option value="موافق عليها">موافق عليها</option>
              <option value="مرفوضة">مرفوضة</option>
              <option value="مؤرشفة">مؤرشفة</option>
            </select>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            اختر ملف أو امسح وثيقة
          </label>
          <div className="flex flex-col items-center border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-teal-400 transition bg-gray-50">
            <Upload className="w-10 h-10 text-gray-400 mb-2" />
            <input
              id="fileInput"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-600
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-teal-50 file:text-teal-700
                hover:file:bg-teal-100 cursor-pointer"
            />
            {file && (
              <p className="mt-3 text-gray-600 text-sm">
                الملف المختار:{" "}
                <span className="font-medium text-teal-600">{file.name}</span>
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleScan}
          disabled={loading || !file}
          className={`w-full py-3 rounded-lg text-white font-semibold transition flex items-center justify-center gap-2 ${
            loading || !file
              ? "bg-gray-300 cursor-not-allowed"
              : "bg-teal-600 hover:bg-teal-700"
          }`}
        >
          <Upload className="w-5 h-5" />
          {loading ? "جاري التحميل..." : "تحميل الوثيقة"}
        </button>
      </div>

      {documents.length > 0 && (
        <div className="mt-8 max-w-4xl mx-auto">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">
            الوثائق المرفوعة ({documents.length})
          </h3>
          <div className="space-y-3">
            {documents.map((doc, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition"
              >
                <div className="flex items-center gap-3">
                  <File className="w-6 h-6 text-teal-600" />
                  <div>
                    <p className="font-medium text-gray-800">{doc.name}</p>
                    <p className="text-sm text-gray-500">
                      {doc.department} • {doc.documentType} • {doc.status}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeDocument(index)}
                  className="text-red-500 hover:bg-red-50 p-2 rounded transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
