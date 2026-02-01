import React, { useEffect, useState } from "react";
import API from "../api/api";
import toast from "react-hot-toast";
import { File, Download, Search, Filter } from "lucide-react";
import DropdownWithSettings from "../components/DropdownWithSettings";

export default function Archieve() {
  const [archiveItems, setArchiveItems] = useState([]);
  const [filteredArchiveItems, setFilteredArchiveItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterYear, setFilterYear] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchArchiveItems();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [archiveItems, searchQuery, filterType, filterYear]);

  const fetchArchiveItems = async () => {
    try {
      setLoading(true);
      // For now, we'll use the file-share endpoints as our archive
      // In a full implementation, this would connect to a dedicated archive system
      const [receivedRes, sentRes] = await Promise.all([
        API.get("/file-share/received"),
        API.get("/file-share/sent"),
      ]);

      // Combine received and sent files as archive items
      const receivedFiles = receivedRes.data.map((file) => ({
        ...file,
        archiveType: "received",
      }));
      const sentFiles = sentRes.data.map((file) => ({
        ...file,
        archiveType: "sent",
      }));

      const allFiles = [...receivedFiles, ...sentFiles];

      setArchiveItems(allFiles);
    } catch (error) {
      console.error("Error fetching archive items:", error);
      toast.error("فشل جلب عناصر الأرشيف");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = archiveItems;

    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.fileName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.message?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterType) {
      filtered = filtered.filter((item) => item.archiveType === filterType);
    }

    if (filterYear) {
      filtered = filtered.filter(
        (item) =>
          new Date(item.createdAt).getFullYear().toString() === filterYear
      );
    }

    setFilteredArchiveItems(filtered);
  };

  const handleDownloadFile = async (fileShare) => {
    try {
      await API.put(`/file-share/${fileShare._id}/download`);

      const baseURL = import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace("/api", "")
        : `http://${window.location.hostname}:5001`;

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

  const getInitials = (user) => {
    if (!user) return "?";
    if (user.profile?.firstName && user.profile?.lastName) {
      return `${user.profile.firstName[0]}${user.profile.lastName[0]}`;
    }
    if (user.username) {
      return user.username[0].toUpperCase();
    }
    return "?";
  };

  const years = Array.from(
    { length: 10 },
    (_, i) => new Date().getFullYear() - i
  );

  return (
    <div className="p-6 font-custom min-h-screen bg-slate-900" dir="rtl">
      <h2 className="text-3xl text-slate-100 font-extrabold mb-6">الأرشيف</h2>

      <div className="bg-slate-800 rounded-lg shadow-md p-6 border border-slate-700">
        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ابحث في الأرشيف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded border border-slate-600 bg-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-slate-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <DropdownWithSettings
              id="archive_filter_type"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              options={[
                { value: "", label: "جميع الأنواع" },
                { value: "received", label: "الوارد" },
                { value: "sent", label: "الصادر" },
              ]}
              label="نوع الوثيقة"
              placeholder="اختر النوع"
            />

            <DropdownWithSettings
              id="archive_filter_year"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              options={[
                { value: "", label: "جميع السنوات" },
                ...years.map((year) => ({
                  value: year.toString(),
                  label: year.toString(),
                })),
              ]}
              label="السنة"
              placeholder="اختر السنة"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-400">جاري التحميل...</div>
        ) : filteredArchiveItems.length > 0 ? (
          <div className="space-y-4">
            {filteredArchiveItems.map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between bg-slate-700/50 p-4 rounded-lg border border-slate-600 hover:border-slate-500 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-600 rounded-lg flex items-center justify-center flex-shrink-0 text-2xl">
                    {item.fileType === "image"
                      ? "🖼️"
                      : item.fileType === "document"
                        ? "📄"
                        : "📎"}
                  </div>
                  <div>
                    <p className="font-medium text-slate-200">
                      {item.fileName}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${item.archiveType === "received"
                            ? "bg-blue-900/50 text-blue-300 border border-blue-500/30"
                            : "bg-amber-900/50 text-amber-300 border border-amber-500/30"
                          }`}
                      >
                        {item.archiveType === "received" ? "وارد" : "صادر"}
                      </span>
                      <span className="text-xs bg-slate-600 text-slate-300 px-2 py-0.5 rounded">
                        {(item.fileSize / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    {item.message && (
                      <p className="text-sm text-slate-400 mt-1 line-clamp-1">
                        {item.message}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(item.createdAt).toLocaleDateString("ar-SA")} ·{" "}
                      {new Date(item.createdAt).toLocaleTimeString("ar-SA")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-center text-xs font-bold text-slate-300"
                    title={
                      item.archiveType === "received" ? "المرسل" : "المستلم"
                    }
                  >
                    {item.archiveType === "received"
                      ? getInitials(item.sender)
                      : getInitials(item.recipient)}
                  </div>
                  <button
                    onClick={() => handleDownloadFile(item)}
                    className="p-2 text-blue-400 hover:bg-slate-600 rounded-lg transition"
                    title="تحميل"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500">
            <File className="w-12 h-12 mx-auto text-slate-600 mb-4" />
            <p>لا توجد عناصر في الأرشيف</p>
          </div>
        )}
      </div>
    </div>
  );
}
