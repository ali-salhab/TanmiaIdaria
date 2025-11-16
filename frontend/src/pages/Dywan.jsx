import { useState, useEffect } from "react";
import API from "../api/api";
import { Upload, File, X, Search, Download, Eye, Trash2, Filter } from "lucide-react";
import toast from "react-hot-toast";

export default function Dywan() {
  const [file, setFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [department, setDepartment] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [status, setStatus] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [documentYear, setDocumentYear] = useState(new Date().getFullYear().toString());
  const [incomingNumber, setIncomingNumber] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [selectedDocument, setSelectedDocument] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [documents, searchQuery, filterDept, filterType, filterStatus, filterYear]);

  const fetchDocuments = async () => {
    try {
      const res = await API.get("/documents");
      setDocuments(res.data.documents || []);
    } catch (err) {
      console.error("Error fetching documents:", err);
      toast.error("خطأ في جلب الوثائق");
    }
  };

  const applyFilters = () => {
    let filtered = documents;

    if (searchQuery) {
      filtered = filtered.filter((doc) =>
        doc.documentNumber?.toString().includes(searchQuery) ||
        doc.incomingNumber?.toString().includes(searchQuery) ||
        doc.department?.includes(searchQuery)
      );
    }

    if (filterDept) filtered = filtered.filter((doc) => doc.department === filterDept);
    if (filterType) filtered = filtered.filter((doc) => doc.documentType === filterType);
    if (filterStatus) filtered = filtered.filter((doc) => doc.status === filterStatus);
    if (filterYear) filtered = filtered.filter((doc) => doc.year === filterYear);

    setFilteredDocuments(filtered);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("حجم الملف يجب أن يكون أقل من 10MB");
        return;
      }
      setFile(selectedFile);
      toast.success("تم اختيار الملف بنجاح");
    }
  };

  const handleScan = async () => {
    if (!file) {
      toast.error("يرجى اختيار وثيقة أولاً");
      return;
    }

    if (!department || !documentType || !status || !documentNumber) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("department", department);
    formData.append("documentType", documentType);
    formData.append("status", status);
    formData.append("documentNumber", documentNumber);
    formData.append("incomingNumber", incomingNumber);
    formData.append("year", documentYear);

    try {
      setLoading(true);
      const res = await API.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("تم رفع الوثيقة بنجاح");
      fetchDocuments();
      setFile(null);
      setDepartment("");
      setDocumentType("");
      setStatus("");
      setDocumentNumber("");
      setIncomingNumber("");
      setDocumentYear(new Date().getFullYear().toString());
      document.getElementById("fileInput").value = "";
    } catch (err) {
      toast.error(err.response?.data?.message || "خطأ في رفع الوثيقة");
    } finally {
      setLoading(false);
    }
  };

  const removeDocument = async (docId) => {
    try {
      await API.delete(`/documents/${docId}`);
      setDocuments(documents.filter((doc) => doc._id !== docId));
      setSelectedDocument(null);
      toast.success("تم حذف الوثيقة");
    } catch (err) {
      toast.error("خطأ في حذف الوثيقة");
    }
  };

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="p-6 font-custom" dir="rtl">
      <h2 className="text-3xl text-teal-700 font-extrabold mb-6">الديوان</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 max-h-screen overflow-y-auto">
          <h3 className="text-xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <Upload className="w-5 h-5 text-teal-600" />
            إضافة وثيقة جديدة
          </h3>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">رقم الوثيقة *</label>
              <input
                type="text"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="أدخل رقم الوثيقة"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">رقم الوارد</label>
              <input
                type="text"
                value={incomingNumber}
                onChange={(e) => setIncomingNumber(e.target.value)}
                className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                placeholder="أدخل رقم الوارد (اختياري)"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">السنة</label>
                <select
                  value={documentYear}
                  onChange={(e) => setDocumentYear(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">القسم *</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">اختر</option>
                  <option value="مديرية المعلوماتية">المعلوماتية</option>
                  <option value="مديرية التنمية الإدارية">التنمية الإدارية</option>
                  <option value="مكتب التنمية المحلية">التنمية المحلية</option>
                  <option value="مديرية إدارة النفايات الصلبة">النفايات الصلبة</option>
                  <option value="مديرية المجالس المحلية">المجالس المحلية</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نوع الوثيقة *</label>
                <select
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">اختر</option>
                  <option value="تقرير">تقرير</option>
                  <option value="قرار">قرار</option>
                  <option value="تعميم">تعميم</option>
                  <option value="محضر">محضر</option>
                  <option value="مراسلة">مراسلة</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الحالة *</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">اختر</option>
                  <option value="جديدة">جديدة</option>
                  <option value="قيد المراجعة">قيد المراجعة</option>
                  <option value="موافق عليها">موافق عليها</option>
                  <option value="مرفوضة">مرفوضة</option>
                  <option value="مؤرشفة">مؤرشفة</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">اختر ملف أو امسح وثيقة *</label>
            <div className="flex flex-col items-center border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-teal-400 transition bg-gray-50">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <input
                id="fileInput"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-600 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 cursor-pointer"
              />
              {file && <p className="mt-2 text-sm text-teal-600 font-medium">✓ {file.name}</p>}
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

        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 flex flex-col max-h-screen">
          <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5 text-teal-600" />
            الوثائق وتفاصيلها
          </h3>

          <div className="space-y-3 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="ابحث برقم الوثيقة أو الوارد..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              >
                <option value="">السنة</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>

              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              >
                <option value="">القسم</option>
                <option value="مديرية المعلوماتية">المعلوماتية</option>
                <option value="مديرية التنمية الإدارية">التنمية الإدارية</option>
                <option value="مكتب التنمية المحلية">التنمية المحلية</option>
                <option value="مديرية إدارة النفايات الصلبة">النفايات الصلبة</option>
                <option value="مديرية المجالس المحلية">المجالس المحلية</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              >
                <option value="">نوع الوثيقة</option>
                <option value="تقرير">تقرير</option>
                <option value="قرار">قرار</option>
                <option value="تعميم">تعميم</option>
                <option value="محضر">محضر</option>
                <option value="مراسلة">مراسلة</option>
                <option value="أخرى">أخرى</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-gray-300 p-2 rounded focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
              >
                <option value="">الحالة</option>
                <option value="جديدة">جديدة</option>
                <option value="قيد المراجعة">قيد المراجعة</option>
                <option value="موافق عليها">موافق عليها</option>
                <option value="مرفوضة">مرفوضة</option>
                <option value="مؤرشفة">مؤرشفة</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2">
            {filteredDocuments.length > 0 ? (
              filteredDocuments.map((doc) => (
                <div
                  key={doc._id}
                  onClick={() => setSelectedDocument(doc)}
                  className={`p-3 rounded-lg border cursor-pointer transition ${
                    selectedDocument?._id === doc._id
                      ? "bg-teal-50 border-teal-500"
                      : "bg-gray-50 border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <File className="w-4 h-4 text-teal-600 mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 text-sm truncate">#{doc.documentNumber}</p>
                      <p className="text-xs text-gray-500">{doc.department}</p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          {doc.documentType}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-medium ${
                            doc.status === "موافق عليها"
                              ? "bg-green-100 text-green-700"
                              : doc.status === "مرفوضة"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {doc.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">لا توجد وثائق</p>
            )}
          </div>

          {selectedDocument && (
            <div className="mt-4 p-4 bg-teal-50 rounded-lg border border-teal-200 space-y-2">
              <div>
                <p className="text-xs text-gray-600">رقم الوثيقة</p>
                <p className="font-semibold text-gray-800">#{selectedDocument.documentNumber}</p>
              </div>
              {selectedDocument.incomingNumber && (
                <div>
                  <p className="text-xs text-gray-600">رقم الوارد</p>
                  <p className="font-semibold text-gray-800">{selectedDocument.incomingNumber}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-600">السنة</p>
                <p className="font-semibold text-gray-800">{selectedDocument.year}</p>
              </div>
              <button
                onClick={() => removeDocument(selectedDocument._id)}
                className="w-full mt-3 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2 rounded transition text-sm"
              >
                <Trash2 className="w-4 h-4" />
                حذف الوثيقة
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
