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
        API.get("/file-share/sent")
      ]);
      
      // Combine received and sent files as archive items
      const allFiles = [...receivedRes.data, ...sentRes.data];
      
      // Add type information for filtering
      const archiveItems = allFiles.map(file => ({
        ...file,
        archiveType: file.sender ? "received" : "sent"
      }));
      
      setArchiveItems(archiveItems);
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
      filtered = filtered.filter((item) =>
        item.fileName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.message?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterType) {
      filtered = filtered.filter((item) => item.archiveType === filterType);
    }

    if (filterYear) {
      filtered = filtered.filter((item) => 
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

  const getInitials = (user) => {
    if (user.profile?.firstName && user.profile?.lastName) {
      return `${user.profile.firstName[0]}${user.profile.lastName[0]}`;
    }
    return user.username[0].toUpperCase();
  };

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="p-6 font-custom" dir="rtl">
      <h2 className="text-3xl text-teal-700 font-extrabold mb-6">الأرشيف</h2>

      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="ابحث في الأرشيف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
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
                ...years.map((year) => ({ value: year.toString(), label: year.toString() }))
              ]}
              label="السنة"
              placeholder="اختر السنة"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
        ) : filteredArchiveItems.length > 0 ? (
          <div className="space-y-4">
            {filteredArchiveItems.map((item) => (
              <div
                key={item._id}
                className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {item.fileType === "image"
                      ? "🖼️"
                      : item.fileType === "document"
                      ? "📄"
                      : "📎"}
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{item.fileName}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        {item.archiveType === "received" ? "وارد" : "صادر"}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                        {(item.fileSize / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                    {item.message && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                        {item.message}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(item.createdAt).toLocaleDateString("ar-SA")} ·{" "}
                      {new Date(item.createdAt).toLocaleTimeString("ar-SA")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center text-center text-xs font-bold text-teal-700">
                    {item.archiveType === "received" 
                      ? getInitials(item.sender) 
                      : getInitials(item.recipient)}
                  </div>
                  <button
                    onClick={() => handleDownloadFile(item)}
                    className="p-2 text-teal-600 hover:bg-teal-100 rounded-lg transition"
                    title="تحميل"
                  >
                    <Download className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <File className="w-12 h-12 mx-auto text-gray-300 mb-4" />
            <p>لا توجد عناصر في الأرشيف</p>
          </div>
        )}
      </div>
    </div>
  );
}