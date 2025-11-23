import React, { useEffect, useState } from "react";
import API from "../api/api";
import toast from "react-hot-toast";
import { Upload, Download, Trash2, MessageSquare, Send } from "lucide-react";

export default function FileSharing() {
  const [activeTab, setActiveTab] = useState("received");
  const [receivedFiles, setReceivedFiles] = useState([]);
  const [sentFiles, setSentFiles] = useState([]);
  const [users, setUsers] = useState([]);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedRecipient, setSelectedRecipient] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReceivedFiles();
    fetchSentFiles();
    fetchUsers();
  }, []);

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

  const fetchUsers = async () => {
    try {
      const response = await API.get("/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleFileSelect = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleSendFile = async (e) => {
    e.preventDefault();
    if (!selectedFile || !selectedRecipient) {
      toast.error("اختر ملف وموظف");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("recipientId", selectedRecipient);
      formData.append("message", message);

      await API.post("/file-share/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("تم إرسال الملف بنجاح");
      setUploadModalOpen(false);
      setSelectedFile(null);
      setSelectedRecipient("");
      setMessage("");
      fetchSentFiles();
    } catch (error) {
      console.error("Error sending file:", error);
      toast.error("فشل إرسال الملف");
    } finally {
      setLoading(false);
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
      if (activeTab === "received") fetchReceivedFiles();
      else fetchSentFiles();
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

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 rounded-lg mt-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">نقل الملفات والصور</h2>
        <button
          onClick={() => setUploadModalOpen(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2"
        >
          <Upload size={18} />
          إرسال ملف جديد
        </button>
      </div>

      <div className="mb-6 flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("received")}
          className={`px-4 py-2 font-medium transition ${
            activeTab === "received"
              ? "border-b-2 border-green-600 text-green-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          الملفات المستقبلة ({receivedFiles.length})
        </button>
        <button
          onClick={() => setActiveTab("sent")}
          className={`px-4 py-2 font-medium transition ${
            activeTab === "sent"
              ? "border-b-2 border-blue-600 text-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          الملفات المرسلة ({sentFiles.length})
        </button>
      </div>

      <div className="bg-white rounded-lg p-6">
        {activeTab === "received"
          ? renderFilesList(receivedFiles, false)
          : renderFilesList(sentFiles, true)}
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
                  onChange={handleFileSelect}
                  className="w-full border border-gray-300 p-2 rounded focus:outline-none focus:border-green-500"
                />
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedFile.name} (
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
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
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
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
  );
}
