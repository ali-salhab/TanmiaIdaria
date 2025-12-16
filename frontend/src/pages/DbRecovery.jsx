import { useEffect, useMemo, useState } from "react";
import API from "../api/api";
import { toast } from "react-hot-toast";

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "-";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let idx = 0;
  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }
  return `${value.toFixed(idx === 0 ? 0 : 2)} ${units[idx]}`;
}

export default function DbRecovery() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [selected, setSelected] = useState("");
  const [drop, setDrop] = useState(true);

  const canRestore = useMemo(
    () => Boolean(selected) && !restoring,
    [selected, restoring]
  );

  const fetchBackups = async () => {
    try {
      setLoading(true);
      const res = await API.get("/db-recovery");
      setBackups(res.data?.backups || []);
    } catch (err) {
      console.error(err);
      toast.error("فشل جلب النسخ الاحتياطية");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = async () => {
    if (!confirm("إنشاء نسخة احتياطية جديدة الآن؟")) return;
    try {
      setCreating(true);
      const res = await API.post("/db-recovery/create");
      toast.success("تم إنشاء النسخة الاحتياطية");
      if (res.data?.backup?.name) {
        setSelected(res.data.backup.name);
      }
      await fetchBackups();
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message || "فشل إنشاء النسخة الاحتياطية"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = async (name) => {
    try {
      const url = `${
        API.defaults.baseURL
      }/db-recovery/download/${encodeURIComponent(name)}`;
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error(err);
      toast.error("فشل تنزيل النسخة");
    }
  };

  const handleRestore = async () => {
    if (!selected) return;
    const warning = drop
      ? "سيتم استبدال البيانات الحالية بالكامل (DROP). هل أنت متأكد؟"
      : "سيتم الاسترجاع بدون DROP وقد يسبب تكرار/تعارض. هل أنت متأكد؟";

    if (!confirm(warning)) return;

    try {
      setRestoring(true);
      await API.post("/db-recovery/restore", { name: selected, drop });
      toast.success("تمت الاستعادة بنجاح");
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || "فشل الاستعادة");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="space-y-4" dir="rtl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            🛟 الاستعادة والنسخ الاحتياطي
          </h2>
          <p className="text-sm text-gray-600">
            إنشاء نسخة احتياطية من قاعدة البيانات واستعادتها (Admin فقط).
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchBackups}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 disabled:opacity-50"
          >
            تحديث
          </button>
          <button
            onClick={handleCreateBackup}
            disabled={creating}
            className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50"
          >
            {creating ? "جاري الإنشاء..." : "إنشاء نسخة احتياطية"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-semibold text-gray-800">النسخ المتاحة</h3>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">النسخة المحددة:</label>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">اختر نسخة...</option>
              {backups.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={drop}
              onChange={(e) => setDrop(e.target.checked)}
            />
            حذف البيانات الحالية قبل الاستعادة (DROP)
          </label>

          <button
            onClick={handleRestore}
            disabled={!canRestore}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
          >
            {restoring ? "جاري الاستعادة..." : "استعادة"}
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="text-right p-2">الملف</th>
                <th className="text-right p-2">الحجم</th>
                <th className="text-right p-2">آخر تعديل</th>
                <th className="text-right p-2">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500">
                    جاري التحميل...
                  </td>
                </tr>
              ) : backups.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-500">
                    لا توجد نسخ احتياطية
                  </td>
                </tr>
              ) : (
                backups.map((b) => (
                  <tr key={b.name} className="border-t">
                    <td className="p-2 font-mono text-xs">{b.name}</td>
                    <td className="p-2">{formatBytes(b.size)}</td>
                    <td className="p-2">
                      {b.modifiedAt
                        ? new Date(b.modifiedAt).toLocaleString("ar")
                        : "-"}
                    </td>
                    <td className="p-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelected(b.name);
                            handleDownload(b.name);
                          }}
                          className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          تنزيل
                        </button>
                        <button
                          onClick={() => setSelected(b.name)}
                          className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800"
                        >
                          اختيار
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          ملاحظة: يجب تثبيت MongoDB Database Tools (mongodump/mongorestore) على
          السيرفر.
        </div>
      </div>
    </div>
  );
}
