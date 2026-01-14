import React, { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useSocket } from "../context/SocketContext";
import API from "../api/api";

export default function Notifications() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState({
    username: "",
    section: "",
  });
  const { socket } = useSocket();

  const fetchLogs = async () => {
    try {
      const res = await API.get("/operations");
      setLogs(res.data.reverse());
    } catch {
      toast.error("❌ خطأ في جلب الإشعارات");
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleNewOperation = (log) => {
      setLogs((prev) => [log, ...prev]);
      toast.success(`📢ppppppp ${log.details}`);
    };

    socket.on("new_operation", handleNewOperation);
    return () => socket.off("new_operation", handleNewOperation);
  }, [socket]);

  // فلترة الإشعارات
  const filteredLogs = logs.filter(
    (log) =>
      log.username.toLowerCase().includes(filter.username.toLowerCase()) &&
      log.section.toLowerCase().includes(filter.section.toLowerCase())
  );

  const pageBg =
    "min-h-screen bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 text-slate-100";
  const panelClass =
    "bg-slate-900/70 border border-slate-800 rounded-2xl shadow-xl shadow-black/30 backdrop-blur";
  const inputClass =
    "w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition";
  const thClass =
    "py-3 px-4 text-right font-semibold text-amber-300 bg-slate-900 border-b border-slate-800";
  const tdClass = "py-3 px-4 text-slate-300 border-b border-slate-800/50";
  const trClass = "hover:bg-slate-800/60 transition-colors duration-200";

  return (
    <div className={`p-6 font-custom ${pageBg}`} dir="rtl">
      <h2 className="text-3xl font-extrabold text-amber-300 drop-shadow-[0_4px_20px_rgba(245,158,11,0.35)] mb-6">
        🔔 الإشعارات والأرشيف
      </h2>

      {/* فلترة */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="فلترة حسب اسم الموظف"
          value={filter.username}
          onChange={(e) => setFilter({ ...filter, username: e.target.value })}
          className={inputClass}
        />
        <input
          type="text"
          placeholder="فلترة حسب القسم"
          value={filter.section}
          onChange={(e) => setFilter({ ...filter, section: e.target.value })}
          className={inputClass}
        />
      </div>

      {/* جدول الإشعارات */}
      <div className={`overflow-x-auto ${panelClass} p-4`}>
        <table className="min-w-full border-collapse">
          <thead>
            <tr>
              <th className={thClass}>الوقت</th>
              <th className={thClass}>الموظف</th>
              <th className={thClass}>القسم</th>
              <th className={thClass}>الإجراء</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length ? (
              filteredLogs.map((log, idx) => (
                <tr key={idx} className={trClass}>
                  <td className={tdClass}>
                    {new Date(log.createdAt).toLocaleString("ar-SA")}
                  </td>
                  <td className={tdClass}>{log.username}</td>
                  <td className={tdClass}>{log.section}</td>
                  <td className={tdClass}>{log.details}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center py-6 text-slate-500">
                  لا توجد إشعارات
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
