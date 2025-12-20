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

  // Scheduled backup settings
  const [backupSettings, setBackupSettings] = useState({
    enabled: false,
    interval: "daily",
    retention: 7,
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [toolsInfo, setToolsInfo] = useState(null);

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

  const fetchToolsInfo = async () => {
    try {
      const res = await API.get("/db-recovery/tools");
      setToolsInfo(res.data);
    } catch (err) {
      console.error("Failed to fetch tools info", err);
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await API.get("/app-settings");
      if (res.data?.backupSettings) {
        setBackupSettings(res.data.backupSettings);
      }
    } catch (err) {
      console.error("Failed to fetch backup settings", err);
    }
  };

  useEffect(() => {
    fetchBackups();
    fetchSettings();
    fetchToolsInfo();
  }, []);

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      await API.put("/app-settings", { backupSettings });
      toast.success("تم حفظ إعدادات النسخ المجدول");
    } catch (err) {
      console.error(err);
      toast.error("فشل حفظ الإعدادات");
    } finally {
      setSavingSettings(false);
    }
  };

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
          <h2 className="text-2xl font-bold text-slate-100">
            🛟 الاستعادة والنسخ الاحتياطي
          </h2>
          <p className="text-sm text-slate-400">
            إنشاء نسخة احتياطية من قاعدة البيانات واستعادتها (Admin فقط).
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchBackups}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-100 disabled:opacity-50 transition-colors"
          >
            تحديث
          </button>
          <button
            onClick={handleCreateBackup}
            disabled={creating}
            className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50 transition-colors"
          >
            {creating ? "جاري الإنشاء..." : "إنشاء نسخة احتياطية"}
          </button>
        </div>
      </div>

      {toolsInfo &&
        (toolsInfo.mongodump.hint || toolsInfo.mongorestore.hint) && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-4 text-red-200 text-sm">
            <h4 className="font-bold mb-2 flex items-center gap-2">
              ⚠️ تنبيه: أدوات MongoDB غير موجودة
            </h4>
            <p className="mb-2">
              لم يتم العثور على أدوات النسخ الاحتياطي (mongodump/mongorestore)
              في السيرفر. لن يعمل النسخ الاحتياطي أو الاستعادة حتى يتم تثبيتها.
            </p>
            <div className="bg-black/40 p-3 rounded font-mono text-xs break-all">
              <div className="mb-1 text-slate-400">
                المسار الذي تم البحث فيه: {toolsInfo.mongodump.command}
              </div>
              {toolsInfo.mongodump.hint || toolsInfo.mongorestore.hint}
            </div>
          </div>
        )}

      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <h3 className="font-semibold text-slate-100 mb-4 flex items-center gap-2">
          📅 النسخ الاحتياطي المجدول
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2">
            <label className="text-sm text-slate-400">
              تفعيل النسخ التلقائي
            </label>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={backupSettings.enabled}
                onChange={(e) =>
                  setBackupSettings({
                    ...backupSettings,
                    enabled: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-teal-500 focus:ring-teal-500"
              />
              <span className="text-sm text-slate-200">
                {backupSettings.enabled ? "مفعل" : "معطل"}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-400">التكرار</label>
            <select
              value={backupSettings.interval}
              onChange={(e) =>
                setBackupSettings({
                  ...backupSettings,
                  interval: e.target.value,
                })
              }
              disabled={!backupSettings.enabled}
              className="w-full border border-slate-700 bg-slate-900 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500 disabled:opacity-50"
            >
              <option value="daily">يومي (منتصف الليل)</option>
              <option value="weekly">أسبوعي (الأحد)</option>
              <option value="monthly">شهري (بداية الشهر)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm text-slate-400">
              عدد النسخ المحفوظة (Retention)
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={backupSettings.retention}
              onChange={(e) =>
                setBackupSettings({
                  ...backupSettings,
                  retention: parseInt(e.target.value) || 7,
                })
              }
              disabled={!backupSettings.enabled}
              className="w-full border border-slate-700 bg-slate-900 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-teal-500 disabled:opacity-50"
            />
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="px-6 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50 transition-colors text-sm font-medium"
          >
            {savingSettings ? "جاري الحفظ..." : "حفظ إعدادات الجدولة"}
          </button>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h3 className="font-semibold text-slate-100">النسخ المتاحة</h3>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-300">النسخة المحددة:</label>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="border border-slate-700 bg-slate-900 text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
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
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={drop}
              onChange={(e) => setDrop(e.target.checked)}
              className="rounded border-slate-600 bg-slate-700 text-amber-500 focus:ring-amber-500"
            />
            حذف البيانات الحالية قبل الاستعادة (DROP)
          </label>

          <button
            onClick={handleRestore}
            disabled={!canRestore}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 transition-colors"
          >
            {restoring ? "جاري الاستعادة..." : "استعادة"}
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm text-slate-300">
            <thead className="bg-slate-700/50 text-slate-200">
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
                  <td colSpan={4} className="p-4 text-center text-slate-500">
                    جاري التحميل...
                  </td>
                </tr>
              ) : backups.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-slate-500">
                    لا توجد نسخ احتياطية
                  </td>
                </tr>
              ) : (
                backups.map((b) => (
                  <tr
                    key={b.name}
                    className="border-t border-slate-700 hover:bg-slate-700/30 transition-colors"
                  >
                    <td className="p-2 font-mono text-xs text-amber-400">
                      {b.name}
                    </td>
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
                          className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                        >
                          تنزيل
                        </button>
                        <button
                          onClick={() => setSelected(b.name)}
                          className="px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
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

        <div className="mt-4 text-xs text-slate-500">
          ملاحظة: يجب تثبيت MongoDB Database Tools (mongodump/mongorestore) على
          السيرفر.
        </div>
      </div>
    </div>
  );
}
