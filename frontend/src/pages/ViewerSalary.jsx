import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";
import { ArrowLeft, DollarSign, Award } from "lucide-react";
import { toast } from "react-hot-toast";
import { checkPermission } from "../utils/permissionHelper";

export default function ViewerSalary() {
  const navigate = useNavigate();
  const [salaryData, setSalaryData] = useState([]);
  const [rewardsData, setRewardsData] = useState([]);
  const [activeTab, setActiveTab] = useState("salary");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await API.get("/auth/me");
        setUser(res.data.user);
        if (!checkPermission("salary.view", res.data.user)) {
          toast.error("❌ ليس لديك صلاحية لعرض الرواتب");
          navigate("/home");
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        navigate("/home");
      }
    };
    fetchUser();
  }, [navigate]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      if (activeTab === "salary") {
        const res = await API.get("/employees", {
          params: { limit: 100 },
        });
        const employees = res.data.data || res.data || [];
        setSalaryData(employees);
      } else {
        const res = await API.get("/employees", {
          params: { limit: 100 },
        });
        const employees = res.data.data || res.data || [];
        setRewardsData(employees);
      }
    } catch (error) {
      toast.error("❌ فشل تحميل البيانات");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (user && checkPermission("salary.view", user)) {
      fetchData();
    }
  }, [user, fetchData]);

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
          <h1 className="text-3xl font-bold text-gray-800">الرواتب والمكافآت</h1>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 md:p-6 mb-6">
          <div className="flex gap-3 border-b border-gray-200">
            {[
              { label: "الرواتب", value: "salary", icon: DollarSign },
              { label: "المكافآت", value: "rewards", icon: Award },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.value}
                  onClick={() => setActiveTab(tab.value)}
                  className={`flex items-center gap-2 px-4 py-3 font-medium transition border-b-2 ${
                    activeTab === tab.value
                      ? "border-emerald-600 text-emerald-600"
                      : "border-transparent text-gray-600 hover:text-gray-800"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-gray-600">جاري التحميل...</div>
          </div>
        ) : activeTab === "salary" ? (
          salaryData.length > 0 ? (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-emerald-600 text-white">
                    <tr>
                      <th className="px-4 py-3 text-right">الاسم</th>
                      <th className="px-4 py-3 text-right">الراتب الأساسي</th>
                      <th className="px-4 py-3 text-right">البدلات</th>
                      <th className="px-4 py-3 text-right">الخصومات</th>
                      <th className="px-4 py-3 text-right">الراتب الإجمالي</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaryData.map((emp, idx) => (
                      <tr
                        key={emp._id || idx}
                        className="border-b border-gray-200 hover:bg-emerald-50 transition"
                      >
                        <td className="px-4 py-3">{emp.fullName || "-"}</td>
                        <td className="px-4 py-3">{emp.baseSalary || emp.salary || "-"}</td>
                        <td className="px-4 py-3">{emp.allowances || "0"}</td>
                        <td className="px-4 py-3">{emp.deductions || "0"}</td>
                        <td className="px-4 py-3 font-semibold">
                          {(emp.baseSalary || 0) + (emp.allowances || 0) - (emp.deductions || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <p className="text-gray-600 text-lg">لا توجد بيانات رواتب</p>
            </div>
          )
        ) : rewardsData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rewardsData.map((emp) => (
              <div
                key={emp._id}
                className="bg-white rounded-lg shadow-md p-6 border-l-4 border-amber-600"
              >
                <h3 className="font-semibold text-gray-800 mb-2">{emp.fullName}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">المكافآت:</span>
                    <span className="font-medium text-amber-600">{emp.rewards || "0"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">الإنجازات:</span>
                    <span className="font-medium">{emp.achievements || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">التقييم:</span>
                    <span className="font-medium text-yellow-600">
                      {"⭐".repeat(Math.floor(emp.rating || 0))}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 text-lg">لا توجد بيانات مكافآت</p>
          </div>
        )}
      </div>
    </div>
  );
}
