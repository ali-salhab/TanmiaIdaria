import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import { ArrowLeft } from "lucide-react";
import { toast } from "react-hot-toast";
import { checkPermission } from "../utils/permissionHelper";

export default function ViewerEmployeeList() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await API.get("/auth/me");
        setUser(res.data.user);
        if (!checkPermission("employees.view", res.data.user)) {
          toast.error("❌ ليس لديك صلاحية لعرض الموظفين");
          navigate("/home");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        navigate("/home");
      }
    };
    fetchUser();
  }, [navigate]);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get("/employees", {
        params: {
          search,
          page: 1,
          limit: 100,
        },
      });
      setEmployees(res.data.data || res.data || []);
    } catch (error) {
      toast.error("❌ فشل تحميل بيانات الموظفين");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    if (user && checkPermission("employees.view", user)) {
      fetchEmployees();
    }
  }, [user, fetchEmployees]);

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
          <h1 className="text-3xl font-bold text-gray-800">بيانات الموظفين</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <input
            type="text"
            placeholder="ابحث عن موظف بالاسم أو الرقم..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-600">جاري التحميل...</div>
          </div>
        ) : employees.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-emerald-600 text-white">
                  <tr>
                    <th className="px-4 py-3 text-right">الاسم الكامل</th>
                    <th className="px-4 py-3 text-right">رقم الموظف</th>
                    <th className="px-4 py-3 text-right">الوظيفة</th>
                    <th className="px-4 py-3 text-right">القسم</th>
                    <th className="px-4 py-3 text-right">حالة العقد</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp, idx) => (
                    <tr
                      key={emp._id || idx}
                      onClick={() => navigate(`/employee/${emp._id}`)}
                      className="border-b border-gray-200 hover:bg-emerald-100 transition cursor-pointer"
                    >
                      <td className="px-4 py-3">{emp.fullName || "-"}</td>
                      <td className="px-4 py-3">{emp.selfNumber || "-"}</td>
                      <td className="px-4 py-3">{emp.level1 || "-"}</td>
                      <td className="px-4 py-3">{emp.level2 || "-"}</td>
                      <td className="px-4 py-3">{emp.contractStatus || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 text-lg">لا توجد بيانات موظفين</p>
          </div>
        )}
      </div>
    </div>
  );
}
