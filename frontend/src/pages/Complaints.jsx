import { useEffect, useMemo, useState } from "react";
import API from "../api/api";
import { toast } from "react-hot-toast";
import { checkPermission } from "../utils/permissionHelper";
import { useAuth } from "../hooks/useAuth";

const statusOptions = ["جديد", "قيد المراجعة", "قيد المعالجة", "مغلق"];

const priorityOptions = ["منخفض", "متوسط", "عالي"];

export default function Complaints() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    status: "جديد",
    priority: "متوسط",
    attachments: [],
  });

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
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => complaints, [complaints]);

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      category: "",
      status: "جديد",
      priority: "متوسط",
      attachments: [],
    });
    setFiles([]);
    setSelected(null);
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
      toast.error("فشل في حفظ الشكوى");
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
      attachments: c.attachments || [],
    });
    setFiles([]);
  };

  return (
    <div className="p-4 space-y-4" dir="rtl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold">📢 الشكاوى</h2>
          <p className="text-sm text-gray-500">عرض، إنشاء، وإدارة الشكاوى</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث..."
            className="border rounded px-3 py-2 text-sm"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded px-3 py-2 text-sm"
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
            className="border rounded px-3 py-2 text-sm"
          >
            <option value="">كل الأولويات</option>
            {priorityOptions.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <button
            onClick={load}
            className="bg-gray-700 text-white px-4 py-2 rounded text-sm"
            disabled={loading}
          >
            تحديث
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded shadow p-3 max-h-[70vh] overflow-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">جاري التحميل...</div>
          ) : filtered.length ? (
            <div className="divide-y">
              {filtered.map((c) => (
                <div
                  key={c._id}
                  className={`p-3 hover:bg-gray-50 cursor-pointer ${
                    selected?._id === c._id ? "bg-teal-50" : ""
                  }`}
                  onClick={() => startEdit(c)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-gray-800">{c.title}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="px-2 py-1 rounded bg-gray-100">
                        {c.status}
                      </span>
                      <span className="px-2 py-1 rounded bg-gray-100">
                        الأولوية: {c.priority}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 line-clamp-2 mt-1">
                    {c.description}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex flex-wrap gap-2">
                    {c.category && (
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        {c.category}
                      </span>
                    )}
                    {c.employee?.fullName && (
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        {c.employee.fullName}
                      </span>
                    )}
                    {c.createdBy?.username && (
                      <span>أنشأها: {c.createdBy.username}</span>
                    )}
                  </div>
                  {canDelete && (
                    <div className="mt-2 text-left">
                      <button
                        className="text-red-600 text-xs hover:underline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(c._id);
                        }}
                      >
                        حذف
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">لا توجد شكاوى</div>
          )}
        </div>

        <div className="bg-white rounded shadow p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              {selected ? "تعديل الشكوى" : "إنشاء شكوى"}
            </h3>
            {selected && (
              <button
                onClick={resetForm}
                className="text-sm text-blue-600 hover:underline"
              >
                إنشاء جديدة
              </button>
            )}
          </div>
          <form onSubmit={handleSubmit} className="space-y-2">
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                العنوان
              </label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border rounded px-3 py-2"
                placeholder="عنوان الشكوى"
                disabled={selected && !canEdit && !canCreate}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">الوصف</label>
              <textarea
                required
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full border rounded px-3 py-2 min-h-[120px]"
                placeholder="تفاصيل الشكوى"
                disabled={selected && !canEdit && !canCreate}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  الفئة
                </label>
                <input
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                  placeholder="مثال: تقنية، موارد بشرية"
                  disabled={selected && !canEdit && !canCreate}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  الأولوية
                </label>
                <select
                  value={form.priority}
                  onChange={(e) =>
                    setForm({ ...form, priority: e.target.value })
                  }
                  className="w-full border rounded px-3 py-2"
                  disabled={selected && !canEdit}
                >
                  {priorityOptions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">الحالة</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full border rounded px-3 py-2"
                disabled={selected ? !canEdit : !canCreate}
              >
                {statusOptions.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                المرفقات (سحب من الماسح أو رفع ملفات)
              </label>
              <input
                type="file"
                multiple
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                className="w-full border rounded px-3 py-2"
                disabled={selected ? !canEdit : !canCreate}
              />
              {form.attachments?.length > 0 && (
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  {form.attachments.map((att, idx) => (
                    <a
                      key={idx}
                      href={att.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {att.name || att.url}
                    </a>
                  ))}
                </div>
              )}
            </div>
            <button
              type="submit"
              className="w-full bg-teal-600 text-white rounded px-4 py-2"
              disabled={selected ? !canEdit : !canCreate}
            >
              {selected ? "حفظ التعديلات" : "إرسال الشكوى"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
