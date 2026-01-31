import { useEffect, useMemo, useState } from "react";
import API from "../api/api";
import { toast } from "react-hot-toast";
import { checkPermission } from "../utils/permissionHelper";
import { useAuth } from "../hooks/useAuth";
import {
  FileText,
  Trash2,
  Plus,
  X,
  Image as ImageIcon,
  File,
  Search,
  RefreshCcw,
  MessageSquare,
  AlertCircle
} from "lucide-react";

const statusOptions = ["جديد", "قيد المراجعة", "قيد المعالجة", "مغلق"];
const priorityOptions = ["منخفض", "متوسط", "عالي"];
const categoryOptions = ["إدارية", "مالية", "تقنية", "سلوك وظيفي", "خدمات عامة", "شكوى مواطن", "أخرى"];

export default function Complaints() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    status: "جديد",
    priority: "متوسط",
    complainantName: "",
    mobilePhone: "",
    nationalId: "",
    attachments: [],
  });

  const [showModal, setShowModal] = useState(false);
  const [files, setFiles] = useState([]);

  const canCreate = checkPermission("complaints.create", user);
  const canEdit = checkPermission("complaints.edit", user);
  const canDelete = checkPermission("complaints.delete", user);

  const load = async () => {
    setLoading(true);
    try {
      const res = await API.get("/complaints", {
        params: {
          q: search || undefined,
          status: status || undefined,
          priority: priority || undefined,
          category: category || undefined,
          year: year || undefined,
          month: month || undefined,
        },
      });
      setComplaints(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error("فشل في تحميل الشكاوى");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 300); // 300ms debounce for search
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, priority, category, year, month]);

  const filtered = useMemo(() => complaints, [complaints]);

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      category: "",
      status: "جديد",
      priority: "متوسط",
      complainantName: "",
      mobilePhone: "",
      nationalId: "",
      attachments: [],
    });
    setFiles([]);
    setSelected(null);
    setShowModal(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("category", form.category);
      formData.append("status", form.status);
      formData.append("priority", form.priority);
      formData.append("complainantName", form.complainantName);
      formData.append("mobilePhone", form.mobilePhone);
      formData.append("nationalId", form.nationalId);
      files.forEach((file) => formData.append("attachments", file));

      if (selected) {
        await API.put(`/complaints/${selected._id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("تم تحديث الشكوى");
      } else {
        await API.post("/complaints", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        toast.success("تم إنشاء الشكوى");
      }
      resetForm();
      await load();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || "فشل في حفظ الشكوى";
      toast.error(msg);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("متأكد من الحذف؟")) return;
    try {
      await API.delete(`/complaints/${id}`);
      toast.success("تم الحذف");
      if (selected?._id === id) resetForm();
      await load();
    } catch (err) {
      console.error(err);
      toast.error("فشل في الحذف");
    }
  };

  const startEdit = (c) => {
    setSelected(c);
    setForm({
      title: c.title || "",
      description: c.description || "",
      category: c.category || "",
      status: c.status || "جديد",
      priority: c.priority || "متوسط",
      complainantName: c.complainantName || "",
      mobilePhone: c.mobilePhone || "",
      nationalId: c.nationalId || "",
      attachments: c.attachments || [],
    });
    setFiles([]);
    setShowModal(true);
  };

  const isImage = (type) => type?.startsWith("image/");
  const getFileUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http")) return url;
    // When using Vite proxy, we can just use the path if it starts with /uploads
    // or concatenate if VITE_API_URL is available.
    const baseUrl = import.meta.env.VITE_API_URL || "";
    return `${baseUrl}${url}`;
  };

  return (
    <div
      className="p-4 space-y-4 min-h-screen bg-slate-900 text-slate-100"
      dir="rtl"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold text-slate-100">📢 الشكاوى</h2>
          <p className="text-sm text-slate-400">عرض، إنشاء، وإدارة الشكاوى</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث..."
            className="border border-slate-600 bg-slate-700 text-slate-100 rounded px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-slate-600 bg-slate-700 text-slate-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">كل الحالات</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="border border-slate-600 bg-slate-700 text-slate-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">كل الأولويات</option>
            {priorityOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="border border-slate-600 bg-slate-700 text-slate-100 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">كل الفئات</option>
            {categoryOptions.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Date Filtering: Year and Month */}
          <div className="flex gap-2">
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="border border-slate-600 bg-slate-700 text-slate-100 rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-24"
            >
              <option value="">سنة...</option>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="border border-slate-600 bg-slate-700 text-slate-100 rounded px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-28"
            >
              <option value="">شهر...</option>
              {["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"].map((m, i) => (
                <option key={i + 1} value={i + 1}>{m}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-4 py-2 rounded-lg text-sm transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
            disabled={!canCreate}
          >
            <Plus size={18} />
            إنشاء شكوى جديدة
          </button>
          <button
            onClick={load}
            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm transition-colors border border-slate-600 flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
            تحديث
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {loading && !complaints.length ? (
          <div className="bg-slate-800 rounded-xl p-8 text-center text-slate-500 flex flex-col items-center gap-3 border border-slate-700 shadow-xl mt-8">
            <RefreshCcw size={32} className="animate-spin text-amber-500" />
            <span className="font-medium tracking-wide">جاري تحديث البيانات...</span>
          </div>
        ) : filtered.length ? (
          <div className="flex flex-col gap-6">
            {filtered.map((c) => (
              <div
                key={c._id}
                className="bg-slate-800 p-6 rounded-3xl hover:bg-slate-800/80 cursor-pointer transition-all group border border-slate-700/50 shadow-2xl relative overflow-hidden active:scale-[0.99]"
                onClick={() => startEdit(c)}
              >
                {/* Visual Status Indicator Bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${c.status === "جديد" ? "bg-blue-500" :
                  c.status === "مغلق" ? "bg-emerald-500" :
                    "bg-amber-500"
                  }`} />

                <div className="flex flex-col md:flex-row items-start justify-between gap-6">
                  <div className="flex-1 space-y-5 w-full">
                    {/* Header Row: ID and Metadata */}
                    <div className="flex items-center justify-between flex-wrap gap-4 mb-1">
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] bg-slate-900/50 text-slate-400 px-3 py-1.5 rounded-xl font-mono border border-slate-700/50 tracking-wider">
                          # {c._id.slice(-6).toUpperCase()}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border uppercase tracking-wider ${c.priority === "عالي" ? "bg-red-500/10 border-red-500/20 text-red-500" :
                            c.priority === "متوسط" ? "bg-orange-500/10 border-orange-500/20 text-orange-500" :
                              "bg-slate-500/10 border-slate-500/20 text-slate-500"
                            }`}>
                            {c.priority}
                          </span>
                          <span className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] px-2.5 py-1 rounded-lg font-black uppercase tracking-wider">
                            {c.category || "عام"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 text-[10px] font-bold">
                        <span>بتاريخ:</span>
                        <span className="text-slate-500">{new Date(c.createdAt).toLocaleDateString("ar-SY")}</span>
                      </div>
                    </div>

                    {/* Content Row: Title and Description */}
                    <div className="flex items-start gap-5">
                      <div className="hidden sm:flex w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 items-center justify-center text-amber-500 shadow-xl group-hover:scale-105 transition-transform flex-shrink-0 border border-slate-600/30">
                        <MessageSquare size={32} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-black text-slate-100 group-hover:text-amber-400 transition-colors mb-2.5 leading-tight">
                          {c.title}
                        </h3>
                        <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed bg-slate-900/40 p-4 rounded-2xl border border-slate-700/30 shadow-inner" dir="auto">
                          {c.description}
                        </p>
                      </div>
                    </div>

                    {/* Info Grid: Complainant Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 pl-0 md:pr-16">
                      <div className="flex items-center gap-4 bg-slate-900/30 p-3.5 rounded-2xl border border-slate-700/20 group-hover:border-amber-500/10 transition-colors">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-500 font-black uppercase tracking-tighter mb-0.5">مقدم الشكوى</span>
                          <span className="text-sm text-slate-200 font-bold">{c.complainantName}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 bg-slate-900/30 p-3.5 rounded-2xl border border-slate-700/20 group-hover:border-amber-500/10 transition-colors">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                        <div className="flex flex-col">
                          <span className="text-[10px] text-slate-500 font-black uppercase tracking-tighter mb-0.5">رقم الموبايل</span>
                          <span className="text-sm text-slate-200 font-mono font-bold" dir="ltr">{c.mobilePhone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Attachments Row */}
                    {c.attachments?.length > 0 && (
                      <div className="flex flex-wrap gap-3 pt-2 pr-0 md:pr-16">
                        {c.attachments.map((att, idx) => (
                          <div
                            key={idx}
                            className="relative group/att bg-slate-950 border border-slate-700/50 hover:border-amber-500/50 rounded-2xl p-1 transition-all cursor-zoom-in shadow-2xl"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(getFileUrl(att.url), "_blank");
                            }}
                          >
                            {isImage(att.fileType) ? (
                              <img
                                src={getFileUrl(att.url)}
                                alt={att.name}
                                className="w-14 h-14 object-cover rounded-xl opacity-70 group-hover/att:opacity-100 transition-opacity"
                              />
                            ) : (
                              <div className="w-14 h-14 flex items-center justify-center bg-slate-800 rounded-xl">
                                <FileText size={24} className="text-slate-600 group-hover/att:text-amber-500 transition-colors" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions and Status Column */}
                  <div className="flex flex-row md:flex-col items-center justify-between md:justify-center gap-4 w-full md:w-auto md:min-w-[140px] pt-4 md:pt-0 border-t md:border-t-0 border-slate-700/30">
                    <span className={`px-5 py-2.5 rounded-2xl text-[11px] font-black shadow-xl whitespace-nowrap border text-center flex-1 md:flex-none w-full tracking-widest uppercase ${c.status === "جديد" ? "bg-blue-500/20 border-blue-500/30 text-blue-400" :
                      c.status === "مغلق" ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-400" :
                        "bg-amber-500/20 border-amber-500/30 text-amber-500"
                      }`}>
                      {c.status}
                    </span>
                    <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all transform translate-y-0 md:translate-y-2 group-hover:translate-y-0">
                      <button
                        className="p-3.5 text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-2xl transition-all border border-transparent hover:border-amber-500/20 shadow-lg"
                        onClick={() => startEdit(c)}
                        title="تفاصيل"
                      >
                        <FileText size={22} />
                      </button>
                      {canDelete && (
                        <button
                          className="p-3.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-2xl transition-all border border-transparent hover:border-red-500/20 shadow-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(c._id);
                          }}
                          title="حذف"
                        >
                          <Trash2 size={22} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-800/50 rounded-[2.5rem] border border-slate-800 p-20 text-center text-slate-500 flex flex-col items-center gap-8 shadow-2xl border-dashed">
            <MessageSquare size={48} className="text-slate-700" />
            <div className="space-y-1">
              <p className="text-lg font-bold text-slate-400">لا توجد شكاوى حالياً</p>
              <p className="text-sm text-slate-600 italic">ابدأ بإضافة أول شكوى عبر الضغط على الزر أعلاه</p>
            </div>
          </div>
        )}
      </div>

      {/* Modal for Creating/Editing Complaints */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm transition-opacity"
            onClick={() => setShowModal(false)}
          />
          <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-fadeInUp flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 rounded-2xl">
                  <MessageSquare className="text-amber-500" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-100">
                    {selected ? "تعديل بيانات الشكوى" : "تقديم شكوى جديدة"}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium tracking-wide">يرجى ملء كافة الحقول المطلوبة بدقة</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl transition-all"
              >
                <X size={24} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Right Column: Main Details */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    <span className="w-6 h-[1px] bg-slate-700" />
                    بيان الشكوى
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 mr-1">العنوان *</label>
                    <input
                      required
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full bg-slate-800/50 border border-slate-700 text-slate-100 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 outline-none transition-all placeholder:text-slate-600 shadow-inner text-sm"
                      placeholder="عنوان مختصر للشكوى"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2 mr-1">الفئة</label>
                      <select
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="w-full bg-slate-800/50 border border-slate-700 text-slate-100 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 outline-none transition-all shadow-inner text-sm appearance-none cursor-pointer"
                      >
                        <option value="">اختر الفئة...</option>
                        {categoryOptions.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2 mr-1">الأولوية</label>
                      <select
                        value={form.priority}
                        onChange={(e) => setForm({ ...form, priority: e.target.value })}
                        className="w-full bg-slate-800/50 border border-slate-700 text-slate-100 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 outline-none transition-all shadow-inner text-sm appearance-none cursor-pointer"
                      >
                        {priorityOptions.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 mr-1">الحالة</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full bg-slate-800/50 border border-slate-700 text-slate-100 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 outline-none transition-all shadow-inner text-sm appearance-none cursor-pointer"
                      disabled={!selected && !canEdit}
                    >
                      {statusOptions.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Left Column: Contact Info */}
                <div className="space-y-5">
                  <div className="flex items-center gap-2 text-[10px] font-black text-amber-500/60 uppercase tracking-[0.2em]">
                    <span className="w-6 h-[1px] bg-amber-500/20" />
                    بيانات التواصل
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 mr-1">اسم مقدم الشكوى *</label>
                    <input
                      required
                      value={form.complainantName}
                      onChange={(e) => setForm({ ...form, complainantName: e.target.value })}
                      className="w-full bg-slate-800/50 border border-slate-700 text-slate-100 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 outline-none transition-all shadow-inner text-sm"
                      placeholder="الاسم الكامل"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 mr-1">رقم الموبايل *</label>
                    <input
                      required
                      value={form.mobilePhone}
                      onChange={(e) => setForm({ ...form, mobilePhone: e.target.value })}
                      className="w-full bg-slate-800/50 border border-slate-700 text-slate-100 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 outline-none transition-all shadow-inner text-sm"
                      placeholder="09XXXXXXXX"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-2 mr-1">الرقم الوطني</label>
                    <input
                      value={form.nationalId}
                      onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
                      className="w-full bg-slate-800/50 border border-slate-700 text-slate-100 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 outline-none transition-all shadow-inner text-sm"
                      placeholder="11 خانة"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Description - Full Width Overlay */}
                <div className="md:col-span-2 space-y-4 pt-2">
                  <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    <span className="w-6 h-[1px] bg-slate-700" />
                    الشرح التفصيلي
                  </div>
                  <textarea
                    required
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full bg-slate-800/50 border border-slate-700 text-slate-100 rounded-2xl px-5 py-3.5 focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/50 outline-none transition-all placeholder:text-slate-600 shadow-inner resize-none text-sm leading-relaxed"
                    placeholder="اشرح المشكلة بوضوح، مع ذكر التواريخ والأطراف المعنية..."
                  />
                </div>

                {/* Attachments & Previews */}
                <div className="md:col-span-2 space-y-4 pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                      <span className="w-6 h-[1px] bg-slate-700" />
                      المرفقات والمستندات الداعمة
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Upload Box */}
                    <div className="space-y-3">
                      <label className="relative flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-700 rounded-2xl cursor-pointer bg-slate-950/30 hover:bg-slate-800 hover:border-amber-500/30 transition-all group/upload shadow-lg">
                        <div className="flex flex-col items-center justify-center p-4 text-center">
                          <ImageIcon className="w-8 h-8 mb-2 text-slate-600 group-hover/upload:text-amber-500 transition-colors" />
                          <p className="text-[11px] font-bold text-slate-400 group-hover/upload:text-slate-200">انقر هنا لاختيار ملفات جديدة</p>
                          <p className="text-[9px] text-slate-600 mt-1">صور، مستندات PDF</p>
                        </div>
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          onChange={(e) => setFiles(Array.from(e.target.files || []))}
                        />
                      </label>

                      {/* Preview of NEWLY selected files */}
                      {files.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                          <p className="w-full text-[10px] font-bold text-amber-500 mb-1">ملفات بانتظار الرفع:</p>
                          {files.map((file, idx) => (
                            <div key={idx} className="relative group/newatt w-12 h-12 bg-slate-800 rounded-lg overflow-hidden border border-slate-700 shadow-sm">
                              {isImage(file.type) ? (
                                <img
                                  src={URL.createObjectURL(file)}
                                  className="w-full h-full object-cover"
                                  onLoad={(e) => URL.revokeObjectURL(e.target.src)} // Cleanup memory
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-500">
                                  <FileText size={18} />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/newatt:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="text-[8px] font-bold text-white px-1 text-center truncate">{file.name}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Existing Files Preview */}
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-slate-500 mr-1 uppercase tracking-tight">الملفات الحالية:</p>
                      {form.attachments?.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3 max-h-32 overflow-y-auto custom-scrollbar p-1">
                          {form.attachments.map((att, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-2 bg-slate-800/40 border border-slate-700/50 rounded-xl hover:bg-slate-800 hover:border-slate-600 transition-all">
                              <div className="w-10 h-10 flex-shrink-0 bg-slate-700 rounded-lg overflow-hidden flex items-center justify-center shadow-inner">
                                {isImage(att.fileType) ? (
                                  <img src={getFileUrl(att.url)} className="w-full h-full object-cover" alt="" />
                                ) : (
                                  <FileText size={16} className="text-slate-500" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-slate-300 truncate leading-tight">{att.name || 'ملف مرفق'}</p>
                                <button
                                  type="button"
                                  onClick={() => window.open(getFileUrl(att.url), "_blank")}
                                  className="text-[9px] text-amber-500 font-black hover:text-amber-400 uppercase tracking-tighter mt-1"
                                >
                                  معاينة
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="h-full min-h-[80px] flex items-center justify-center border border-slate-800 rounded-2xl bg-slate-950/20 border-dashed">
                          <p className="text-[10px] text-slate-600 font-bold italic">لا توجد ملفات مرفقة حالياً</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </form>

            {/* Footer Actions */}
            <div className="p-6 bg-slate-950/50 border-t border-slate-800 flex gap-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 px-6 py-3.5 rounded-2xl border border-slate-700 text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-800 hover:text-slate-100 transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={handleSubmit}
                className="flex-[2] bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-[0.2em] py-3.5 rounded-2xl transition-all shadow-xl shadow-amber-500/20 active:scale-[0.98] border-none"
              >
                {selected ? "حفظ التعديلات" : "إرسال الطلب الآن"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
