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
      toast.success(`📢 ${log.details}`);
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

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold mb-4">🔔 الإشعارات والأرشيف</h2>

      {/* فلترة */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="فلترة حسب اسم الموظف"
          value={filter.username}
          onChange={(e) => setFilter({ ...filter, username: e.target.value })}
          className="px-3 py-2 border rounded-lg w-1/2"
        />
        <input
          type="text"
          placeholder="فلترة حسب القسم"
          value={filter.section}
          onChange={(e) => setFilter({ ...filter, section: e.target.value })}
          className="px-3 py-2 border rounded-lg w-1/2"
        />
      </div>

      {/* جدول الإشعارات */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg shadow overflow-hidden">
          <thead className="bg-gray-200">
            <tr>
              <th className="py-2 px-4 text-left">الوقت</th>
              <th className="py-2 px-4 text-left">الموظف</th>
              <th className="py-2 px-4 text-left">القسم</th>
              <th className="py-2 px-4 text-left">الإجراء</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length ? (
              filteredLogs.map((log, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="py-2 px-4">{log.username}</td>
                  <td className="py-2 px-4">{log.section}</td>
                  <td className="py-2 px-4">{log.details}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="4"
                  className="text-center py-4 text-gray-500 italic"
                >
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
