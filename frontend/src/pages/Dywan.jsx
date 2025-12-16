import { useState, useEffect } from "react";
import API from "../api/api";
import {
  Upload,
  File,
  X,
  Search,
  Download,
  Eye,
  Trash2,
  Filter,
  Send,
  MessageSquare,
  Archive,
} from "lucide-react";
import toast from "react-hot-toast";
import DropdownWithSettings from "../components/DropdownWithSettings";
import { useAuth } from "../hooks/useAuth";

export default function Dywan() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const [activeTab, setActiveTab] = useState("outgoing");
  const [file, setFile] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [department, setDepartment] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [status, setStatus] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [documentYear, setDocumentYear] = useState(
    new Date().getFullYear().toString()
  );
  const [incomingNumber, setIncomingNumber] = useState("");

  // Incoming metadata (to match Dywan-style form)
  const [incomingFromEntity, setIncomingFromEntity] = useState("");
  const [incomingMailNumber, setIncomingMailNumber] = useState("");
  const [incomingRegistryNumber, setIncomingRegistryNumber] = useState("");
  const [incomingRegisteredAt, setIncomingRegisteredAt] = useState("");
  const [incomingSubject, setIncomingSubject] = useState("");
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

  const buildFileUrl = (filePath) => {
    const baseURL = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace("/api", "")
      : `http://${window.location.hostname}:5000`;
    return `${baseURL}${filePath}`;
  };

  useEffect(() => {
    if (
      activeTab === "outgoing" ||
      activeTab === "incoming" ||
      activeTab === "decisions"
    ) {
      fetchDocuments();
    } else if (activeTab === "file-sharing") {
      fetchReceivedFiles();
      fetchSentFiles();
      fetchUsersWithDywanPermission();
    }
  }, [activeTab]);

  useEffect(() => {
    applyFilters();
  }, [
    documents,
    searchQuery,
    filterDept,
    filterType,
    filterStatus,
    filterYear,
  ]);

  const fetchDocuments = async () => {
    try {
      const res = await API.get("/documents");
      setDocuments(res.data.documents || []);
    } catch (err) {
      console.error("Error fetching documents:", err);
      toast.error("فشل في جلب الوثائق");
    }
  };

  const fetchReceivedFiles = async () => {
    try {
      const res = await API.get("/file-share/received");
      setReceivedFiles(res.data);
    } catch (error) {
      console.error("Error fetching received files:", error);
      toast.error("فشل في جلب الملفات المستلمة");
    }
  };

  const fetchSentFiles = async () => {
    try {
      const res = await API.get("/file-share/sent");
      setSentFiles(res.data);
    } catch (error) {
      console.error("Error fetching sent files:", error);
      toast.error("فشل في جلب الملفات المرسلة");
    }
  };

  const fetchUsersWithDywanPermission = async () => {
    try {
      const res = await API.get("/users/with-permission/dywan_access");
      setUsers(res.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("فشل في جلب قائمة المستخدمين");
    }
  };

  const applyFilters = () => {
    let filtered = documents.filter((doc) => {
      const typeMatch =
        activeTab === "outgoing"
          ? ["outgoing", "decision"].includes(doc.documentType)
          : activeTab === "incoming"
          ? doc.documentType === "incoming"
          : activeTab === "decisions"
          ? doc.documentType === "decision"
          : true;

      const searchMatch =
        !searchQuery ||
        doc.documentNumber?.includes(searchQuery) ||
        doc.incomingNumber?.includes(searchQuery) ||
        doc.department?.includes(searchQuery) ||
        doc.status?.includes(searchQuery) ||
        doc.subject?.toLowerCase().includes(searchQuery.toLowerCase());

      return typeMatch && searchMatch;
    });
    if (filterType)
      filtered = filtered.filter((doc) => doc.documentType === filterType);
    if (filterStatus)
      filtered = filtered.filter((doc) => doc.status === filterStatus);
    if (filterYear)
      filtered = filtered.filter((doc) => doc.year === filterYear);

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

  const handleViewDocument = (doc) => {
    if (!doc?.fileUrl) {
      toast.error("لا يوجد ملف مرتبط بهذه الوثيقة");
      return;
    }

    const fileHref = buildFileUrl(doc.fileUrl);
    window.open(fileHref, "_blank", "noopener,noreferrer");
  };

  const handleDownloadDocument = async (doc) => {
    if (!doc?.fileUrl) {
      toast.error("لا يوجد ملف متاح للتحميل");
      return;
    }

    try {
      await API.put(`/documents/${doc._id}/download`);

      const link = document.createElement("a");
      link.href = buildFileUrl(doc.fileUrl);
      link.download =
        doc.fileName || `document-${doc.documentNumber || doc._id}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("تم تحميل الوثيقة");
    } catch (error) {
      console.error("Error downloading document:", error);
      toast.error("فشل تحميل الوثيقة");
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
      const link = document.createElement("a");
      link.href = buildFileUrl(fileShare.fileUrl);
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

  const years = Array.from(
    { length: 10 },
    (_, i) => new Date().getFullYear() - i
  );

  const pageBg =
    "min-h-screen bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 text-slate-100";
  const panelClass =
    "bg-slate-900/70 border border-slate-800 rounded-2xl shadow-xl shadow-black/30 backdrop-blur";
  const cardClass =
    "bg-slate-900/60 border border-slate-800 rounded-xl shadow-lg";
  const inputClass =
    "w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition";
  const tabClass = (active) =>
    `px-4 py-2 font-medium transition rounded-lg border ${
      active
        ? "bg-amber-500 text-slate-900 border-amber-400 shadow-lg shadow-amber-500/20"
        : "text-slate-300 border-transparent hover:text-amber-300 hover:border-slate-700"
    }`;
  const pillClass = (color) =>
    `text-xs px-2 py-0.5 rounded font-medium bg-${color}-900/40 text-${color}-200 border border-${color}-800/60`;

  return (
    <div className={`p-6 font-custom ${pageBg}`} dir="rtl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-3xl font-extrabold text-amber-300 drop-shadow-[0_4px_20px_rgba(245,158,11,0.35)]">
          الديوان
        </h2>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={() => setActiveTab("outgoing")}
          className={tabClass(activeTab === "outgoing")}
        >
          الصادر
        </button>
        <button
          onClick={() => setActiveTab("incoming")}
          className={tabClass(activeTab === "incoming")}
        >
          الوارد
        </button>
        <button
          onClick={() => setActiveTab("decisions")}
          className={tabClass(activeTab === "decisions")}
        >
          القرارات
        </button>
        <button
          onClick={() => setActiveTab("file-sharing")}
          className={tabClass(activeTab === "file-sharing")}
        >
          مشاركة الملفات
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "incoming" ? (
        // Incoming (Dywan) — two-pane layout in dark theme
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4">
          {/* Left: list pane */}
          <div
            className={`${cardClass} flex flex-col min-h-[75vh]`}
            style={{ boxShadow: "0 20px 40px rgba(0,0,0,0.35)" }}
          >
            <div className="px-3 py-2 border-b border-slate-800 bg-slate-900/70 flex items-center justify-between">
              <div className="text-sm font-semibold text-amber-300">
                قائمة الوارد
              </div>
              <div className="text-xs text-slate-400">
                {filteredDocuments.length}
              </div>
            </div>

            <div className="p-3 border-b border-slate-800">
              <input
                type="text"
                placeholder="بحث..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${inputClass} bg-slate-950/80`}
              />
            </div>

            <div className="flex-1 overflow-auto">
              {filteredDocuments.length > 0 ? (
                filteredDocuments.map((doc) => (
                  <button
                    key={doc._id}
                    type="button"
                    onClick={() => setSelectedDocument(doc)}
                    className={`w-full text-right px-4 py-3 border-b border-slate-800 transition text-slate-200 ${
                      selectedDocument?._id === doc._id
                        ? "bg-amber-500/10 border-amber-500/40"
                        : "bg-slate-900/40 hover:bg-slate-800/70"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 flex items-center justify-center border border-slate-700 rounded bg-slate-900 text-amber-300">
                        📄
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-slate-100 truncate">
                          {doc.incomingNumber
                            ? `وارد ${doc.incomingNumber}`
                            : `#${doc.documentNumber}`}
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                          {doc.department || ""}
                        </div>
                        <div className="text-xs text-slate-500 truncate">
                          {doc.documentType || ""}
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 whitespace-nowrap">
                        {doc.year || ""}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-6 text-center text-slate-400">
                  لا توجد وثائق
                </div>
              )}
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-900/70 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedDocument(null)}
                className="px-3 py-2 text-sm bg-slate-800 border border-slate-700 rounded hover:bg-slate-700 text-slate-200"
              >
                جديد
              </button>
            </div>
          </div>

          {/* Right: details/form pane */}
          <div className={`${panelClass} min-h-[75vh] flex flex-col`}>
            <div className="px-3 py-3 border-b border-slate-800 bg-slate-900/80 flex items-center justify-between">
              <div className="text-sm font-semibold text-amber-200">
                إدخال الوارد
              </div>
              <div className="text-xs text-slate-400">
                {new Date().toLocaleDateString("ar-SA")}
              </div>
            </div>

            <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  نوع الوارد*
                </label>
                <DropdownWithSettings
                  id="dywan_incoming_department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  options={[{ value: "", label: "اختر" }]}
                  placeholder="اختر"
                  isAdmin={isAdmin}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  نوع الوثيقة
                </label>
                <DropdownWithSettings
                  id="dywan_incoming_type"
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
                  placeholder="اختر"
                  isAdmin={isAdmin}
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اسم الجهة الوارد منها البريد الوارد
                </label>
                <input
                  type="text"
                  value={incomingFromEntity}
                  onChange={(e) => setIncomingFromEntity(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  رقم البريد وفق الجهة الوارد منها
                </label>
                <input
                  type="text"
                  value={incomingMailNumber}
                  onChange={(e) => setIncomingMailNumber(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  رقم الوارد وفق سجل المحافظة
                </label>
                <input
                  type="text"
                  value={incomingRegistryNumber}
                  onChange={(e) => setIncomingRegistryNumber(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  تاريخ تسجيل البريد الوارد
                </label>
                <input
                  type="date"
                  value={incomingRegisteredAt}
                  onChange={(e) => setIncomingRegisteredAt(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  السنة
                </label>
                <input
                  type="text"
                  value={documentYear}
                  onChange={(e) => setDocumentYear(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  موضوع البريد الوارد
                </label>
                <input
                  type="text"
                  value={incomingSubject}
                  onChange={(e) => setIncomingSubject(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  رقم الوثيقة
                </label>
                <input
                  type="text"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  رقم الوارد
                </label>
                <input
                  type="text"
                  value={incomingNumber}
                  onChange={(e) => setIncomingNumber(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  الحالة
                </label>
                <DropdownWithSettings
                  id="dywan_incoming_status"
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
                  placeholder="اختر"
                  className={inputClass}
                  isAdmin={isAdmin}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  اختيار ملف
                </label>
                <input
                  id="fileInput"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileChange}
                  className="w-full text-sm"
                />
                {file ? (
                  <div className="text-xs text-gray-600 mt-1">{file.name}</div>
                ) : null}
              </div>

              <div className="lg:col-span-2">
                {selectedDocument ? (
                  <div className="p-3 bg-teal-50 border border-teal-200 rounded">
                    <div className="text-sm font-semibold text-gray-800 mb-2">
                      تفاصيل الوثيقة المحددة
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-gray-700">
                        الرقم:{" "}
                        <span className="font-semibold">
                          {selectedDocument.documentNumber || "-"}
                        </span>
                      </div>
                      <div className="text-gray-700">
                        الوارد:{" "}
                        <span className="font-semibold">
                          {selectedDocument.incomingNumber || "-"}
                        </span>
                      </div>
                      <div className="text-gray-700">
                        القسم:{" "}
                        <span className="font-semibold">
                          {selectedDocument.department || "-"}
                        </span>
                      </div>
                      <div className="text-gray-700">
                        الحالة:{" "}
                        <span className="font-semibold">
                          {selectedDocument.status || "-"}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => handleViewDocument(selectedDocument)}
                        className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white py-2 rounded transition text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        عرض
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadDocument(selectedDocument)}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded transition text-sm"
                      >
                        <Download className="w-4 h-4" />
                        تحميل
                      </button>
                      <button
                        type="button"
                        onClick={() => removeDocument(selectedDocument._id)}
                        className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-2 rounded transition text-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        حذف
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600">
                    اختر وثيقة من القائمة اليسرى لعرض التفاصيل.
                  </div>
                )}
              </div>
            </div>

            {/* Bottom action bar (Dywan-like) */}
            <div className="mt-auto border-t bg-gray-50 p-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedDocument(null)}
                className="px-4 py-2 text-sm bg-white border rounded hover:bg-gray-100"
              >
                إغلاق
              </button>
              <button
                type="button"
                onClick={handleScan}
                disabled={loading || !file}
                className={`px-4 py-2 text-sm rounded text-white ${
                  loading || !file
                    ? "bg-gray-400"
                    : "bg-teal-600 hover:bg-teal-700"
                }`}
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      ) : activeTab === "file-sharing" ? (
        // File Sharing Tab Content
        <div className={`${panelClass} p-6 border border-slate-800`}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-amber-300">
              مشاركة الملفات
            </h3>
            <button
              onClick={() => setUploadModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg transition flex items-center gap-2 shadow-lg shadow-emerald-600/30"
            >
              <Send size={18} />
              إرسال ملف جديد
            </button>
          </div>

          <div className="mb-6 flex gap-2 border-b border-slate-800 pb-2 text-sm">
            <span className="px-3 py-2 rounded-lg bg-amber-500/15 text-amber-200 border border-amber-500/40">
              الملفات المستقبلة ({receivedFiles.length})
            </span>
            <span className="px-3 py-2 rounded-lg bg-slate-800 text-slate-200 border border-slate-700">
              الملفات المرسلة ({sentFiles.length})
            </span>
          </div>

          <div className={`${cardClass} p-4 border border-slate-800/80`}>
            {renderFilesList(receivedFiles, false)}
          </div>

          {uploadModalOpen && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-50">
              <div
                className={`${panelClass} p-6 max-w-md w-full transform transition-all duration-300 animate-fadeInUp overflow-y-auto max-h-[90vh]`}
              >
                <h3 className="text-xl font-bold mb-4 text-center text-amber-300">
                  إرسال ملف جديد
                </h3>

                <form onSubmit={handleSendFile} className="space-y-4">
                  <div>
                    <label className="block mb-2 font-medium text-slate-200">
                      اختر المستقبل
                    </label>
                    <select
                      value={selectedRecipient}
                      onChange={(e) => setSelectedRecipient(e.target.value)}
                      className={`${inputClass} bg-slate-950/80`}
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
                    <label className="block mb-2 font-medium text-slate-200">
                      اختر الملف
                    </label>
                    <input
                      type="file"
                      onChange={handleFileSelectForShare}
                      className={`${inputClass} bg-slate-950/80`}
                    />
                    {selectedFileForShare && (
                      <p className="text-sm text-slate-300 mt-1">
                        {selectedFileForShare.name} (
                        {(selectedFileForShare.size / 1024 / 1024).toFixed(2)}{" "}
                        MB)
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block mb-2 font-medium text-slate-200">
                      رسالة (اختياري)
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="أضف رسالة مع الملف..."
                      className={`${inputClass} bg-slate-950/80`}
                      rows="3"
                    />
                  </div>

                  <div className="flex justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setUploadModalOpen(false)}
                      className="flex-1 bg-slate-800 text-slate-200 px-4 py-2 rounded border border-slate-700 hover:bg-slate-700 transition"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      disabled={fileSharingLoading}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded border border-emerald-500/60 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25"
                    >
                      {fileSharingLoading ? (
                        "جاري الإرسال..."
                      ) : (
                        <>
                          <Send size={16} /> إرسال
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
        // Document Management Tabs Content (Outgoing/Decisions fallback)
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className={`${panelClass} p-6 max-h-screen overflow-y-auto`}>
            <h3 className="text-xl font-semibold text-amber-300 mb-6 flex items-center gap-2">
              <Upload className="w-5 h-5 text-amber-400" />
              إضافة وارد جديد
            </h3>

            <div className="space-y-4 mb-6">
              <DropdownWithSettings
                id="dywan_department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                options={[{ value: "", label: "اختر" }]}
                label="نوع الوارد*"
                placeholder="اختر"
                className={inputClass}
                isAdmin={isAdmin}
              />

              <label className="block text-sm font-medium text-slate-300 mb-2">
                اسم الجهة الوارد منها البريد الوارد
              </label>
              <input
                type="text"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                className={`${inputClass} mt-1`}
                placeholder="أدخل رقم الوارد"
              />

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  رقم البريد وفق الجهة الوارد منها
                </label>
                <div className="flex flex-row">
                  <input
                    type="number"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    className={inputClass}
                    placeholder="أدخل رقم الوارد"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  رقم الوارد وفق سجل المحافظة
                </label>
                <input
                  type="text"
                  value={incomingNumber}
                  onChange={(e) => setIncomingNumber(e.target.value)}
                  className={inputClass}
                  placeholder="أدخل رقم الوارد"
                />
                <label className="block text-sm font-medium text-slate-300 mb-2 mt-2">
                  تاريخ تسجيل البريد الوارد
                </label>
                <input
                  type="date"
                  value={incomingNumber}
                  onChange={(e) => setIncomingNumber(e.target.value)}
                  className={inputClass}
                  placeholder="أدخل رقم الوارد"
                />
                <label className="block text-sm font-medium text-slate-300 mb-2 mt-2">
                  موضوع البريد الوارد
                </label>
                <input
                  type="text"
                  value={incomingNumber}
                  onChange={(e) => setIncomingNumber(e.target.value)}
                  className={inputClass}
                  placeholder="أدخل رقم الوارد"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-amber-200 mb-2">
                اختر ملف أو امسح وثيقة *
              </label>
              <div className="flex flex-col items-center border-2 border-dashed border-slate-700 rounded-lg p-6 hover:border-amber-400/60 transition bg-slate-900/60">
                <Upload className="w-8 h-8 text-amber-400 mb-2" />
                <input
                  id="fileInput"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-slate-200 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-amber-500/15 file:text-amber-200 hover:file:bg-amber-500/25 cursor-pointer"
                />
                {file && (
                  <p className="mt-2 text-sm text-amber-200 font-medium">
                    ✓ {file.name}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleScan}
              disabled={loading || !file}
              className={`w-full py-3 rounded-lg text-white font-semibold transition flex items-center justify-center gap-2 ${
                loading || !file
                  ? "bg-slate-700 cursor-not-allowed"
                  : "bg-amber-500 hover:bg-amber-400"
              }`}
            >
              <Upload className="w-5 h-5" />
              {loading ? "جاري التحميل..." : "تحميل الوثيقة"}
            </button>
          </div>

          <div className={`${panelClass} p-6 flex flex-col max-h-screen`}>
            <h3 className="text-xl font-semibold text-amber-300 mb-4 flex items-center gap-2">
              <Filter className="w-5 h-5 text-amber-400" />
              الوثائق وتفاصيلها
            </h3>

            <div className="space-y-3 mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-4 h-4" />
                <input
                  type="text"
                  placeholder="ابحث برقم الوثيقة أو الوارد..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`${inputClass} pl-10 bg-slate-950/80`}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <DropdownWithSettings
                  id="dywan_filter_year"
                  value={filterYear}
                  onChange={(e) => setFilterYear(e.target.value)}
                  options={years.map((year) => ({
                    value: year.toString(),
                    label: year.toString(),
                  }))}
                  label="السنة"
                  placeholder="السنة"
                  className={inputClass}
                  isAdmin={isAdmin}
                />

                <DropdownWithSettings
                  id="dywan_filter_dept"
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  options={[
                    { value: "", label: "القسم" },
                    { value: "مديرية المعلوماتية", label: "المعلوماتية" },
                    {
                      value: "مديرية التنمية الإدارية",
                      label: "التنمية الإدارية",
                    },
                    { value: "مكتب التنمية المحلية", label: "التنمية المحلية" },
                    {
                      value: "مديرية إدارة النفايات الصلبة",
                      label: "النفايات الصلبة",
                    },
                    {
                      value: "مديرية المجالس المحلية",
                      label: "المجالس المحلية",
                    },
                  ]}
                  placeholder="القسم"
                  className={inputClass}
                  isAdmin={isAdmin}
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
                  className={inputClass}
                  isAdmin={isAdmin}
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
                  className={inputClass}
                  isAdmin={isAdmin}
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
                        ? "bg-amber-500/10 border-amber-500/40"
                        : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <File className="w-4 h-4 text-amber-400 mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-100 text-sm truncate">
                          #{doc.documentNumber}
                        </p>
                        <p className="text-xs text-slate-400">
                          {doc.department}
                        </p>
                        <div className="flex gap-1 mt-1 flex-wrap">
                          <span className="text-xs bg-blue-900/40 text-blue-200 px-2 py-0.5 rounded border border-blue-800/60">
                            {doc.documentType}
                          </span>
                          <span
                            className={
                              doc.status === "موافق عليها"
                                ? pillClass("green")
                                : doc.status === "مرفوضة"
                                ? pillClass("red")
                                : pillClass("amber")
                            }
                          >
                            {doc.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-400 py-8">لا توجد وثائق</p>
              )}
            </div>

            {selectedDocument && (
              <div className="mt-4 p-4 bg-slate-900/60 rounded-lg border border-amber-500/30 space-y-2">
                <div>
                  <p className="text-xs text-slate-400">رقم الوثيقة</p>
                  <p className="font-semibold text-amber-200">
                    #{selectedDocument.documentNumber}
                  </p>
                </div>
                {selectedDocument.incomingNumber && (
                  <div>
                    <p className="text-xs text-slate-400">رقم الوارد</p>
                    <p className="font-semibold text-amber-200">
                      {selectedDocument.incomingNumber}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-400">السنة</p>
                  <p className="font-semibold text-amber-200">
                    {selectedDocument.year}
                  </p>
                </div>
                {selectedDocument.fileName && (
                  <div>
                    <p className="text-xs text-slate-400">اسم الملف</p>
                    <p className="font-semibold text-amber-200">
                      {selectedDocument.fileName}
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                  <button
                    onClick={() => handleViewDocument(selectedDocument)}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded transition text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    عرض الوثيقة
                  </button>
                  <button
                    onClick={() => handleDownloadDocument(selectedDocument)}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded transition text-sm"
                  >
                    <Download className="w-4 h-4" />
                    تحميل الوثيقة
                  </button>
                  <button
                    onClick={() => removeDocument(selectedDocument._id)}
                    className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white py-2 rounded transition text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    حذف الوثيقة
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
