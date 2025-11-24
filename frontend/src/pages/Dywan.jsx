import { useState, useEffect } from "react";
import API from "../api/api";
import { Upload, File, X, Search, Download, Eye, Trash2, Filter, Send, MessageSquare, Archive } from "lucide-react";
import toast from "react-hot-toast";
import DropdownWithSettings from "../components/DropdownWithSettings";

export default function Dywan() {
  const [activeTab, setActiveTab] = useState("outgoing");
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
  
  // File sharing states
  const [receivedFiles, setReceivedFiles] = useState([]);
  const [sentFiles, setSentFiles] = useState([]);
  const [users, setUsers] = useState([]);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFileForShare, setSelectedFileForShare] = useState(null);
  const [selectedRecipient, setSelectedRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [fileSharingLoading, setFileSharingLoading] = useState(false);

  useEffect(() => {
    if (activeTab === "outgoing" || activeTab === "incoming" || activeTab === "decisions") {
      fetchDocuments();
    } else if (activeTab === "file-sharing") {
      fetchReceivedFiles();
      fetchSentFiles();
      fetchUsersWithDywanPermission();
    }
  }, [activeTab]);

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

  const fetchReceivedFiles = async () => {
    try {
      const response = await API.get("/file-share/received");
      setReceivedFiles(response.data);
    } catch (error) {
      console.error("Error fetching received files:", error);
      toast.error("فشل جلب الملفات المستقبلة");
    }
  };

  const fetchSentFiles = async () => {
    try {
      const response = await API.get("/file-share/sent");
      setSentFiles(response.data);
    } catch (error) {
      console.error("Error fetching sent files:", error);
      toast.error("فشل جلب الملفات المرسلة");
    }
  };

  const fetchUsersWithDywanPermission = async () => {
    try {
      const response = await API.get("/file-share/dywan-users");
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users with dywan permission:", error);
      toast.error("فشل جلب المستخدمين");
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

  const handleFileSelectForShare = (e) => {
    setSelectedFileForShare(e.target.files[0]);
  };

  const handleSendFile = async (e) => {
    e.preventDefault();
    if (!selectedFileForShare || !selectedRecipient) {
      toast.error("اختر ملف وموظف");
      return;
    }

    setFileSharingLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFileForShare);
      formData.append("recipientId", selectedRecipient);
      formData.append("message", message);

      await API.post("/file-share/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("تم إرسال الملف بنجاح");
      setUploadModalOpen(false);
      setSelectedFileForShare(null);
      setSelectedRecipient("");
      setMessage("");
      fetchSentFiles();
    } catch (error) {
      console.error("Error sending file:", error);
      toast.error("فشل إرسال الملف");
    } finally {
      setFileSharingLoading(false);
    }
  };

  const handleDownloadFile = async (fileShare) => {
    try {
      await API.put(`/file-share/${fileShare._id}/download`);

      const baseURL = import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace("/api", "")
        : `http://${window.location.hostname}:5000`;

      const link = document.createElement("a");
      link.href = `${baseURL}${fileShare.fileUrl}`;
      link.download = fileShare.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("تم تحميل الملف بنجاح");
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("فشل تحميل الملف");
    }
  };

  const handleDeleteFile = async (id) => {
    if (!window.confirm("هل تريد حذف هذا الملف؟")) return;

    try {
      await API.delete(`/file-share/${id}`);
      toast.success("تم حذف الملف بنجاح");
      if (activeTab === "file-sharing") {
        fetchReceivedFiles();
        fetchSentFiles();
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("فشل حذف الملف");
    }
  };

  const getInitials = (user) => {
    if (user.profile?.firstName && user.profile?.lastName) {
      return `${user.profile.firstName[0]}${user.profile.lastName[0]}`;
    }
    return user.username[0].toUpperCase();
  };

  const renderFilesList = (files, isSent = false) => {
    if (files.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          {isSent ? "لم تقم بإرسال أي ملفات بعد" : "لم تستقبل أي ملفات بعد"}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {files.map((file) => (
          <div
            key={file._id}
            className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                  {file.fileType === "image"
                    ? "🖼️"
                    : file.fileType === "document"
                    ? "📄"
                    : "📎"}
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate text-gray-800">
                    {file.fileName}
                  </p>
                  <div className="text-sm text-gray-500 flex gap-2">
                    <span>{(file.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                    {!isSent && <span>التنزيلات: {file.downloadCount}</span>}
                  </div>
                  {file.message && (
                    <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                      <MessageSquare size={14} /> {file.message}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {new Date(file.createdAt).toLocaleDateString("ar-SA")} ·{" "}
                {new Date(file.createdAt).toLocaleTimeString("ar-SA")}
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4">
              {isSent ? (
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-center text-xs font-bold text-blue-700">
                  {getInitials(file.recipient)}
                </div>
              ) : (
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-center text-xs font-bold text-green-700">
                  {getInitials(file.sender)}
                </div>
              )}
            </div>

            <div className="flex gap-2 ml-4">
              <button
                onClick={() => handleDownloadFile(file)}
                className="p-2 text-blue-600 hover:bg-blue-100 rounded transition"
                title="تحميل"
              >
                <Download size={18} />
              </button>
              <button
                onClick={() => handleDeleteFile(file._id)}
                className="p-2 text-red-600 hover:bg-red-100 rounded transition"
                title="حذف"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="p-6 font-custom" dir="rtl">
      <h2 className="text-3xl text-teal-700 font-extrabold mb-6">الديوان</h2>

      {/* Tab Navigation */}
      <div className="mb-6 flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("outgoing")}
          className={`px-4 py-2 font-medium transition ${
            activeTab === "outgoing"
              ? "border-b-2 border-teal-600 text-teal-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          الصادر
        </button>
        <button
          onClick={() => setActiveTab("incoming")}
          className={`px-4 py-2 font-medium transition ${
            activeTab === "incoming"
              ? "border-b-2 border-teal-600 text-teal-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          الوارد
        </button>
        <button
          onClick={() => setActiveTab("decisions")}
          className={`px-4 py-2 font-medium transition ${
            activeTab === "decisions"
              ? "border-b-2 border-teal-600 text-teal-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          القرارات
        </button>
        <button
          onClick={() => setActiveTab("file-sharing")}
          className={`px-4 py-2 font-medium transition ${
            activeTab === "file-sharing"
              ? "border-b-2 border-teal-600 text-teal-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          مشاركة الملفات
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "file-sharing" ? (
        // File Sharing Tab Content
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-800">مشاركة الملفات</h3>
            <button
              onClick={() => setUploadModalOpen(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
            >
              <Send size={18} />
              إرسال ملف جديد
            </button>
          </div>

          <div className="mb-6 flex gap-2 border-b">
            <button
              onClick={() => {}}
              className={`px-4 py-2 font-medium transition ${
                true
                  ? "border-b-2 border-green-600 text-green-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              الملفات المستقبلة ({receivedFiles.length})
            </button>
            <button
              onClick={() => {}}
              className={`px-4 py-2 font-medium transition ${
                false
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              الملفات المرسلة ({sentFiles.length})
            </button>
          </div>

          <div className="bg-white rounded-lg p-6">
            {renderFilesList(receivedFiles, false)}
          </div>

          {uploadModalOpen && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full transform transition-all duration-300 animate-fadeInUp overflow-y-auto max-h-[90vh]">
                <h3 className="text-xl font-bold mb-4 text-center text-gray-800">
                  إرسال ملف جديد
                </h3>

                <form onSubmit={handleSendFile} className="space-y-4">
                  <div>
                    <label className="block mb-2 font-medium">اختر المستقبل</label>
                    <select
                      value={selectedRecipient}
                      onChange={(e) => setSelectedRecipient(e.target.value)}
                      className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-green-500"
                    >
                      <option value="">-- اختر موظف --</option>
                      {users.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.profile?.firstName && user.profile?.lastName
                            ? `${user.profile.firstName} ${user.profile.lastName}`
                            : user.username}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2 font-medium">اختر الملف</label>
                    <input
                      type="file"
                      onChange={handleFileSelectForShare}
                      className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-green-500"
                    />
                    {selectedFileForShare && (
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedFileForShare.name} (
                        {(selectedFileForShare.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-2 font-medium">
                      رسالة (اختياري)
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="أضف رسالة مع الملف..."
                      className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-green-500"
                      rows="3"
                    />
                  </div>

                  <div className="flex justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setUploadModalOpen(false)}
                      className="flex-1 bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      disabled={fileSharingLoading}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {fileSharingLoading ? (
                        "جاري الإرسال..."
                      ) : (
                        <>
                          <Send size={16} />
                          إرسال
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Document Management Tabs Content (Outgoing, Incoming, Decisions)
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
                <DropdownWithSettings
                  id="dywan_document_year"
                  value={documentYear}
                  onChange={(e) => setDocumentYear(e.target.value)}
                  options={years.map((year) => ({ value: year.toString(), label: year.toString() }))}
                  label="السنة"
                  placeholder="اختر السنة"
                />

                <DropdownWithSettings
                  id="dywan_department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  options={[
                    { value: "", label: "اختر" },
                    { value: "مديرية المعلوماتية", label: "المعلوماتية" },
                    { value: "مديرية التنمية الإدارية", label: "التنمية الإدارية" },
                    { value: "مكتب التنمية المحلية", label: "التنمية المحلية" },
                    { value: "مديرية إدارة النفايات الصلبة", label: "النفايات الصلبة" },
                    { value: "مديرية المجالس المحلية", label: "المجالس المحلية" },
                  ]}
                  label="القسم *"
                  placeholder="اختر"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <DropdownWithSettings
                  id="dywan_document_type"
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  options={[
                    { value: "", label: "اختر" },
                    { value: "تقرير", label: "تقرير" },
                    { value: "قرار", label: "قرار" },
                    { value: "تعميم", label: "تعميم" },
                    { value: "محضر", label: "محضر" },
                    { value: "مراسلة", label: "مراسلة" },
                    { value: "أخرى", label: "أخرى" },
                  ]}
                  label="نوع الوثيقة *"
                  placeholder="اختر"
                />

                <DropdownWithSettings
                  id="dywan_status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  options={[
                    { value: "", label: "اختر" },
                    { value: "جديدة", label: "جديدة" },
                    { value: "قيد المراجعة", label: "قيد المراجعة" },
                    { value: "موافق عليها", label: "موافق عليها" },
                    { value: "مرفوضة", label: "مرفوضة" },
                    { value: "مؤرشفة", label: "مؤرشفة" },
                  ]}
                  label="الحالة *"
                  placeholder="اختر"
                />
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
                <DropdownWithSettings
                  id="dywan_filter_year"
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  options={years.map((year) => ({ value: year.toString(), label: year.toString() }))}
                  label="السنة"
                  placeholder="السنة"
                  className="text-sm"
                />

                <DropdownWithSettings
                  id="dywan_filter_dept"
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  options={[
                    { value: "", label: "القسم" },
                    { value: "مديرية المعلوماتية", label: "المعلوماتية" },
                    { value: "مديرية التنمية الإدارية", label: "التنمية الإدارية" },
                    { value: "مكتب التنمية المحلية", label: "التنمية المحلية" },
                    { value: "مديرية إدارة النفايات الصلبة", label: "النفايات الصلبة" },
                    { value: "مديرية المجالس المحلية", label: "المجالس المحلية" },
                  ]}
                  placeholder="القسم"
                  className="text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <DropdownWithSettings
                  id="dywan_filter_type"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  options={[
                    { value: "", label: "نوع الوثيقة" },
                    { value: "تقرير", label: "تقرير" },
                    { value: "قرار", label: "قرار" },
                    { value: "تعميم", label: "تعميم" },
                    { value: "محضر", label: "محضر" },
                    { value: "مراسلة", label: "مراسلة" },
                    { value: "أخرى", label: "أخرى" },
                  ]}
                  placeholder="نوع الوثيقة"
                  className="text-sm"
                />

                <DropdownWithSettings
                  id="dywan_filter_status"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  options={[
                    { value: "", label: "الحالة" },
                    { value: "جديدة", label: "جديدة" },
                    { value: "قيد المراجعة", label: "قيد المراجعة" },
                    { value: "موافق عليها", label: "موافق عليها" },
                    { value: "مرفوضة", label: "مرفوضة" },
                    { value: "مؤرشفة", label: "مؤرشفة" },
                  ]}
                  placeholder="الحالة"
                  className="text-sm"
                />
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
      )}
    </div>
  );
}