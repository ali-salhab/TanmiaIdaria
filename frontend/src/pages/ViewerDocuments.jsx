import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import { ArrowLeft, FileText, Download, Calendar } from "lucide-react";
import { toast } from "react-hot-toast";
import { checkPermission } from "../utils/permissionHelper";

export default function ViewerDocuments() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await API.get("/auth/me");
        setUser(res.data.user);
        if (!checkPermission("documents.view", res.data.user)) {
          toast.error("❌ ليس لديك صلاحية لعرض الوثائق");
          navigate("/home");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        navigate("/home");
      }
    };
    fetchUser();
  }, [navigate]);

  useEffect(() => {
    if (user && checkPermission("documents.view", user)) {
      fetchDocuments();
    }
  }, [user, filter]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await API.get("/employees", {
        params: {
          limit: 1000,
        },
      });
      const employees = res.data.data || res.data || [];
      
      const allDocs = employees.flatMap((emp) => [
        {
          id: `${emp._id}-cv`,
          name: `السيرة الذاتية - ${emp.fullName}`,
          type: "CV",
          employee: emp.fullName,
          date: emp.updatedAt,
          employeeId: emp._id,
        },
        {
          id: `${emp._id}-contract`,
          name: `العقد - ${emp.fullName}`,
          type: "Contract",
          employee: emp.fullName,
          date: emp.contractStartDate,
          employeeId: emp._id,
        },
      ]);
      
      setDocuments(allDocs);
    } catch (error) {
      toast.error("❌ فشل تحميل الوثائق");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (doc) => {
    if (doc.type === "CV") {
      window.open(`/api/excel-cv/${doc.employeeId}`, "_blank");
    } else {
      toast.info("ℹ️ قريباً: تحميل العقود");
    }
  };

  const filteredDocs = filter === "all" ? documents : documents.filter((d) => d.type === filter);

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/home")}
            className="p-2 hover:bg-gray-200 rounded-lg transition"
            title="العودة"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-3xl font-bold text-gray-800">الوثائق والمستندات</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <div className="flex gap-3 flex-wrap">
            {[
              { label: "الكل", value: "all" },
              { label: "السيرة الذاتية", value: "CV" },
              { label: "العقود", value: "Contract" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === opt.value
                    ? "bg-emerald-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-600">جاري التحميل...</div>
          </div>
        ) : filteredDocs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="bg-white rounded-lg shadow-md p-6 border-l-4 border-emerald-600 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <FileText className="w-8 h-8 text-emerald-600" />
                  <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                    {doc.type}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                  {doc.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">الموظف: {doc.employee}</p>
                {doc.date && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                    <Calendar className="w-3 h-3" />
                    {new Date(doc.date).toLocaleDateString("ar-EG")}
                  </div>
                )}
                <button
                  onClick={() => handleDownload(doc)}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white px-3 py-2 rounded-lg hover:bg-emerald-700 transition text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  تحميل
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 text-lg">لا توجد وثائق</p>
          </div>
        )}
      </div>
    </div>
  );
}
