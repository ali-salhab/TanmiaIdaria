import { useState, useEffect } from "react";
import API from "../api/api";
import {
  Scale,
  FileText,
  Search,
  Filter,
  Plus,
  MessageSquare,
  Paperclip,
  Send,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  Download,
  Eye,
} from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../hooks/useAuth";
import { checkPermission } from "../utils/permissionHelper";

export default function Legal() {
  const { user } = useAuth();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterType, setFilterType] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Create form states
  const [newCase, setNewCase] = useState({
    title: "",
    description: "",
    caseType: "استشارة قانونية",
    priority: "عادية",
    assignedTo: "",
    dueDate: "",
  });

  // Reply states
  const [replyText, setReplyText] = useState("");
  const [replyFile, setReplyFile] = useState(null);
  const [sendingReply, setSendingReply] = useState(false);

  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchCases();
    fetchUsers();
  }, []);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const res = await API.get("/legal");
      setCases(res.data.cases || []);
    } catch (error) {
      console.error("Error fetching legal cases:", error);
      toast.error("فشل في جلب القضايا القانونية");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await API.get("/users");
      setUsers(res.data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleCreateCase = async (e) => {
    e.preventDefault();
    try {
      await API.post("/legal", newCase);
      toast.success("تم إنشاء القضية بنجاح");
      setShowCreateModal(false);
      setNewCase({
        title: "",
        description: "",
        caseType: "استشارة قانونية",
        priority: "عادية",
        assignedTo: "",
        dueDate: "",
      });
      fetchCases();
    } catch (error) {
      console.error("Error creating case:", error);
      toast.error("فشل إنشاء القضية");
    }
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText && !replyFile) return;

    try {
      setSendingReply(true);
      if (replyFile) {
        const formData = new FormData();
        formData.append("replyText", replyText);
        formData.append("files", replyFile);
        formData.append("replyType", "both");

        await API.post(
          `/legal/${selectedCase._id}/reply-with-files`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          }
        );
      } else {
        await API.post(`/legal/${selectedCase._id}/reply`, {
          replyText,
          replyType: "text",
        });
      }

      toast.success("تم إرسال الرد");
      setReplyText("");
      setReplyFile(null);
      // Refresh selected case
      const res = await API.get(`/legal/${selectedCase._id}`);
      setSelectedCase(res.data);
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("فشل إرسال الرد");
    } finally {
      setSendingReply(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "مفتوحة":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "قيد المعالجة":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "في الانتظار":
        return "bg-slate-500/20 text-slate-300 border-slate-500/30";
      case "مغلقة":
        return "bg-green-500/20 text-green-300 border-green-500/30";
      case "ملغاة":
        return "bg-red-500/20 text-red-300 border-red-500/30";
      default:
        return "bg-slate-500/20 text-slate-300 border-slate-500/30";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "عاجل جداً":
        return "text-red-400";
      case "عاجلة":
        return "text-orange-400";
      case "متوسطة":
        return "text-yellow-400";
      default:
        return "text-green-400";
    }
  };

  const filteredCases = cases.filter((c) => {
    const matchSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = filterStatus ? c.status === filterStatus : true;
    const matchType = filterType ? c.caseType === filterType : true;
    return matchSearch && matchStatus && matchType;
  });

  const buildFileUrl = (filePath) => {
    const baseURL = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace("/api", "")
      : `http://${window.location.hostname}:5001`;
    return `${baseURL}${filePath}`;
  };

  return (
    <div
      className="p-6 min-h-screen bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 text-slate-100 font-custom"
      dir="rtl"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-extrabold text-amber-300 flex items-center gap-3">
          <Scale className="w-8 h-8" />
          الشؤون القانونية
        </h2>
        {checkPermission("legal.access", user) && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-lg shadow-amber-600/20"
          >
            <Plus size={20} />
            قضية جديدة
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6 h-[calc(100vh-140px)]">
        {/* List Panel */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-800 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                type="text"
                placeholder="بحث في القضايا..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="">كل الحالات</option>
                <option value="مفتوحة">مفتوحة</option>
                <option value="قيد المعالجة">قيد المعالجة</option>
                <option value="في الانتظار">في الانتظار</option>
                <option value="مغلقة">مغلقة</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="">كل الأنواع</option>
                <option value="استشارة قانونية">استشارة</option>
                <option value="قضية إدارية">قضية إدارية</option>
                <option value="شكوى">شكوى</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {filteredCases.map((c) => (
              <div
                key={c._id}
                onClick={() => setSelectedCase(c)}
                className={`p-3 rounded-lg border cursor-pointer transition hover:bg-slate-800/50 ${selectedCase?._id === c._id
                    ? "bg-amber-500/10 border-amber-500/40"
                    : "bg-slate-900/40 border-slate-800"
                  }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className="font-semibold text-slate-200 truncate flex-1 ml-2">
                    {c.title}
                  </h4>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded border ${getStatusColor(
                      c.status
                    )}`}
                  >
                    {c.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 mb-2">
                  {c.description}
                </p>
                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <span className={getPriorityColor(c.priority)}>
                    {c.priority}
                  </span>
                  <span>
                    {new Date(c.createdAt).toLocaleDateString("ar-SA")}
                  </span>
                </div>
              </div>
            ))}
            {filteredCases.length === 0 && (
              <div className="text-center py-8 text-slate-500 text-sm">
                لا توجد قضايا مطابقة
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
          {selectedCase ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-slate-100 mb-1">
                    {selectedCase.title}
                  </h3>
                  <div className="flex gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <User size={12} />{" "}
                      {selectedCase.createdBy?.username || "مستخدم"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />{" "}
                      {new Date(selectedCase.createdAt).toLocaleString("ar-SA")}
                    </span>
                    <span className="flex items-center gap-1">
                      <FileText size={12} /> {selectedCase.caseType}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {/* Actions like Edit/Close could go here */}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Description */}
                <div className="bg-slate-950/50 p-4 rounded-lg border border-slate-800">
                  <h4 className="text-sm font-semibold text-amber-400 mb-2">
                    التفاصيل
                  </h4>
                  <p className="text-slate-300 whitespace-pre-wrap text-sm leading-relaxed">
                    {selectedCase.description}
                  </p>
                </div>

                {/* Related Document */}
                {selectedCase.relatedDocument && (
                  <div className="bg-blue-900/10 p-4 rounded-lg border border-blue-800/30">
                    <h4 className="text-sm font-semibold text-blue-400 mb-2 flex items-center gap-2">
                      <Paperclip size={14} /> وثيقة مرتبطة
                    </h4>
                    <div className="flex items-center justify-between bg-slate-900 p-3 rounded border border-slate-800">
                      <div className="text-sm text-slate-300">
                        وثيقة رقم #{selectedCase.relatedDocument}
                      </div>
                      {/* You would ideally fetch document details here */}
                    </div>
                  </div>
                )}

                {/* Attachments */}
                {selectedCase.attachments?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-400 mb-2">
                      المرفقات
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedCase.attachments.map((att, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-slate-800/50 p-2 rounded border border-slate-700"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <FileText size={14} className="text-slate-400" />
                            <span className="text-xs text-slate-300 truncate">
                              {att.fileName}
                            </span>
                          </div>
                          <a
                            href={buildFileUrl(att.fileUrl)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-400 hover:text-blue-300 p-1"
                          >
                            <Download size={14} />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Replies / Timeline */}
                <div className="border-t border-slate-800 pt-6">
                  <h4 className="text-sm font-semibold text-slate-400 mb-4">
                    الردود والمناقشات
                  </h4>
                  <div className="space-y-4">
                    {selectedCase.replies?.map((reply, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                          {reply.repliedBy?.username?.[0] || "?"}
                        </div>
                        <div className="flex-1 bg-slate-800/50 rounded-lg p-3 border border-slate-700">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold text-amber-500">
                              {reply.repliedBy?.username || "مستخدم"}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {new Date(reply.repliedAt).toLocaleString(
                                "ar-SA"
                              )}
                            </span>
                          </div>
                          {reply.replyText && (
                            <p className="text-sm text-slate-300 mb-2">
                              {reply.replyText}
                            </p>
                          )}
                          {reply.attachments?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {reply.attachments.map((att, i) => (
                                <a
                                  key={i}
                                  href={buildFileUrl(att.fileUrl)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="flex items-center gap-1 text-xs bg-slate-900 px-2 py-1 rounded border border-slate-600 text-blue-300 hover:bg-slate-800"
                                >
                                  <Paperclip size={10} /> {att.fileName}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reply Input */}
              <div className="p-4 border-t border-slate-800 bg-slate-900/80">
                <form
                  onSubmit={handleSendReply}
                  className="flex flex-col gap-2"
                >
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="اكتب رداً..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm focus:outline-none focus:border-amber-500 min-h-[80px]"
                  />
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer text-slate-400 hover:text-amber-400 transition">
                        <Paperclip size={18} />
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => setReplyFile(e.target.files[0])}
                        />
                      </label>
                      {replyFile && (
                        <span className="text-xs text-amber-300 bg-amber-900/20 px-2 py-0.5 rounded border border-amber-500/30">
                          {replyFile.name}
                        </span>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={sendingReply || (!replyText && !replyFile)}
                      className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingReply ? "جاري الإرسال..." : "إرسال الرد"}
                      <Send size={14} />
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <Scale size={48} className="mb-4 opacity-20" />
              <p>اختر قضية لعرض التفاصيل</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-amber-300 mb-4">
              إنشاء قضية جديدة
            </h3>
            <form onSubmit={handleCreateCase} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  العنوان
                </label>
                <input
                  type="text"
                  required
                  value={newCase.title}
                  onChange={(e) =>
                    setNewCase({ ...newCase, title: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm focus:border-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  الوصف
                </label>
                <textarea
                  required
                  value={newCase.description}
                  onChange={(e) =>
                    setNewCase({ ...newCase, description: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm focus:border-amber-500 outline-none h-24"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    النوع
                  </label>
                  <select
                    value={newCase.caseType}
                    onChange={(e) =>
                      setNewCase({ ...newCase, caseType: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm focus:border-amber-500 outline-none"
                  >
                    <option value="استشارة قانونية">استشارة قانونية</option>
                    <option value="قضية إدارية">قضية إدارية</option>
                    <option value="قضية عمالية">قضية عمالية</option>
                    <option value="عقد">عقد</option>
                    <option value="شكوى">شكوى</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    الأولوية
                  </label>
                  <select
                    value={newCase.priority}
                    onChange={(e) =>
                      setNewCase({ ...newCase, priority: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm focus:border-amber-500 outline-none"
                  >
                    <option value="عادية">عادية</option>
                    <option value="متوسطة">متوسطة</option>
                    <option value="عاجلة">عاجلة</option>
                    <option value="عاجل جداً">عاجل جداً</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  تعيين إلى (اختياري)
                </label>
                <select
                  value={newCase.assignedTo}
                  onChange={(e) =>
                    setNewCase({ ...newCase, assignedTo: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm focus:border-amber-500 outline-none"
                >
                  <option value="">-- اختر مستخدم --</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.username}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 rounded transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-amber-600 hover:bg-amber-500 text-white rounded transition font-semibold"
                >
                  إنشاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
