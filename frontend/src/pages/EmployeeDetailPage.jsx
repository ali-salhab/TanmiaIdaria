import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/api";
import { ArrowLeft, User, AlertCircle, Calendar, Gift, Edit2, Save, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { checkPermission } from "../utils/permissionHelper";

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [employee, setEmployee] = useState(null);
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("info");
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);

  const availableTabs = [
    {
      id: "info",
      label: "البيانات الشخصية",
      icon: User,
      permission: null,
    },
    {
      id: "incidents",
      label: "الوقوعات",
      icon: AlertCircle,
      permission: "incidents.view",
    },
    {
      id: "vacations",
      label: "الإجازات",
      icon: Calendar,
      permission: "vacations.view",
    },
    {
      id: "rewards",
      label: "المكافآت",
      icon: Gift,
      permission: "rewards.view",
    },
    {
      id: "punishments",
      label: "الجزاءات",
      icon: AlertCircle,
      permission: "punishments.view",
    },
  ];

  useEffect(() => {
    const fetchUserAndEmployee = async () => {
      try {
        setLoading(true);
        const [userRes, empRes] = await Promise.all([
          API.get("/auth/me"),
          API.get(`/employees/${id}`),
        ]);

        setUser(userRes.data.user);
        setEmployee(empRes.data);

        if (!checkPermission("employees.view", userRes.data.user)) {
          toast.error("❌ ليس لديك صلاحية لعرض الموظفين");
          navigate("/home");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("❌ فشل تحميل البيانات");
        navigate("/employees");
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndEmployee();
  }, [id, navigate]);

  const handleEditToggle = () => {
    if (!isEditing) {
      setEditData({ ...employee });
    }
    setIsEditing(!isEditing);
  };

  const handleEditChange = (field, value) => {
    setEditData({
      ...editData,
      [field]: value,
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await API.put(`/employees/${id}`, editData);
      setEmployee(editData);
      setIsEditing(false);
      toast.success("✅ تم تحديث البيانات بنجاح");
    } catch (error) {
      console.error("Error updating employee:", error);
      toast.error("❌ فشل تحديث البيانات");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData({});
    setIsEditing(false);
  };

  const getAccessibleTabs = useCallback(() => {
    if (!user) return [];
    return availableTabs.filter(
      (tab) => !tab.permission || checkPermission(tab.permission, user)
    );
  }, [user]);

  if (loading || !employee || !user) {
    return (
      <div dir="rtl" className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-gray-600">جاري تحميل البيانات...</div>
      </div>
    );
  }

  const accessibleTabs = getAccessibleTabs();

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate("/employees")}
              className="p-2 hover:bg-gray-100 rounded-lg transition flex items-center gap-2"
              title="العودة"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
              <span className="text-gray-600">العودة</span>
            </button>
            <h1 className="text-3xl font-bold text-gray-800">بيانات الموظف</h1>
            {checkPermission("employees.edit", user) && (
              <button
                onClick={handleEditToggle}
                disabled={saving}
                className="p-2 hover:bg-emerald-100 rounded-lg transition flex items-center gap-2 text-emerald-600"
                title={isEditing ? "إغلاق التحرير" : "تحرير البيانات"}
              >
                <Edit2 className="w-5 h-5" />
                <span className="text-sm font-medium">{isEditing ? "إلغاء" : "تحرير"}</span>
              </button>
            )}
          </div>

          {/* Employee Header Card */}
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                <User className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">{employee.fullName || "N/A"}</h2>
                <p className="text-emerald-50">رقم الموظف: {employee.selfNumber || "N/A"}</p>
              </div>
              <div className="text-right">
                <div className="text-sm opacity-90">الوظيفة</div>
                <div className="font-semibold">{employee.level1 || "N/A"}</div>
              </div>
            </div>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {[
              { label: "القسم", value: employee.level2 || "N/A" },
              { label: "حالة العقد", value: employee.contractStatus || "N/A" },
              { label: "البريد الإلكتروني", value: employee.email || "N/A" },
              { label: "الهاتف", value: employee.phone || "N/A" },
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-lg p-3 shadow-sm">
                <div className="text-xs text-gray-500 mb-1">{item.label}</div>
                <div className="font-semibold text-gray-800 text-sm">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        {/* Tab Navigation */}
        <div className="bg-white rounded-t-xl shadow-md overflow-x-auto">
          <div className="flex gap-2 border-b border-gray-200 p-3">
            {accessibleTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-medium whitespace-nowrap ${
                    activeTab === tab.id
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-b-xl shadow-md p-6">
          {activeTab === "info" && (
            <>
              <EmployeeInfoSection
                employee={isEditing ? editData : employee}
                isEditing={isEditing}
                onFieldChange={handleEditChange}
              />
              {isEditing && (
                <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="flex items-center gap-2 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 disabled:opacity-50 transition"
                  >
                    <X className="w-4 h-4" />
                    إلغاء
                  </button>
                </div>
              )}
            </>
          )}

          {activeTab === "incidents" && user && checkPermission("incidents.view", user) && (
            <IncidentsSection employeeId={id} />
          )}

          {activeTab === "vacations" && user && checkPermission("vacations.view", user) && (
            <VacationsSection employeeId={id} />
          )}

          {activeTab === "rewards" && user && checkPermission("rewards.view", user) && (
            <RewardsSection employeeId={id} />
          )}

          {activeTab === "punishments" && user && checkPermission("punishments.view", user) && (
            <PunishmentsSection employeeId={id} />
          )}
        </div>
      </div>
    </div>
  );
}

// Employee Information Section
function EmployeeInfoSection({ employee, isEditing, onFieldChange }) {
  const sections = [
    {
      title: "البيانات الشخصية",
      fields: [
        { label: "الاسم الكامل", key: "fullName" },
        { label: "الاسم الأول", key: "firstName" },
        { label: "اسم الأب", key: "fatherName" },
        { label: "الكنية", key: "lastName" },
        { label: "الرقم الوطني", key: "nationalId" },
        { label: "رقم الموظف", key: "selfNumber" },
        { label: "الجنسية", key: "nationality" },
        { label: "النوع", key: "gender" },
        { label: "الحالة الاجتماعية", key: "maritalStatus" },
        { label: "تاريخ الميلاد", key: "birthDate", type: "date" },
        { label: "مكان الولادة", key: "birthPlace" },
        { label: "المحافظة", key: "governorate" },
        { label: "المدينة", key: "city" },
        { label: "الناحية", key: "district" },
        { label: "البريد الإلكتروني", key: "email" },
        { label: "الهاتف", key: "phone" },
        { label: "عدد الأبناء", key: "childrenCount", type: "number" },
        { label: "عدد الزوجات", key: "wivesCount", type: "number" },
      ],
    },
    {
      title: "بيانات العمل",
      fields: [
        { label: "الوظيفة", value: employee.level1 },
        { label: "القسم", value: employee.level2 },
        { label: "مركز العمل", value: employee.workCenter },
        { label: "حالة العقد", value: employee.contractStatus },
        { label: "تاريخ المباشرة", value: employee.hireDate ? new Date(employee.hireDate).toLocaleDateString("ar-EG") : "N/A" },
      ],
    },
    {
      title: "بيانات الراتب",
      fields: [
        { label: "الراتب الأساسي", value: employee.baseSalary || "N/A" },
        { label: "البدلات", value: employee.allowances || "0" },
        { label: "الخصومات", value: employee.deductions || "0" },
        { label: "الراتب الإجمالي", value: (employee.baseSalary || 0) + (employee.allowances || 0) - (employee.deductions || 0) },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {sections.map((section, idx) => (
        <div key={idx}>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-3 border-b-2 border-emerald-500">
            {section.title}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {section.fields.map((field, fieldIdx) => (
              <div key={fieldIdx} className={`rounded-lg p-4 ${isEditing ? "bg-blue-50 border border-blue-200" : "bg-gray-50"}`}>
                <div className="text-sm text-gray-600 mb-1">{field.label}</div>
                {isEditing ? (
                  <input
                    type={field.type || "text"}
                    value={employee[field.key] || ""}
                    onChange={(e) => onFieldChange(field.key, e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800 font-semibold"
                    placeholder={field.label}
                  />
                ) : (
                  <div className="text-lg font-semibold text-gray-800">{employee[field.key] || "N/A"}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Incidents Section
function IncidentsSection({ employeeId }) {
  const [incidents, setIncidents] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    fetchIncidents();
  }, [employeeId]);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/incidents/${employeeId}`);
      setIncidents(res.data || []);
    } catch (error) {
      console.error("Error fetching incidents:", error);
      toast.error("❌ فشل تحميل الوقوعات");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-600">جاري التحميل...</div>;
  }

  return (
    <div>
      {incidents.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-right">تاريخ التبدل</th>
                <th className="px-4 py-3 text-right">المسمى الوظيفي</th>
                <th className="px-4 py-3 text-right">السبب</th>
                <th className="px-4 py-3 text-right">نوع المستند</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((incident, idx) => (
                <tr key={idx} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{incident.change_date || "N/A"}</td>
                  <td className="px-4 py-3 text-sm">{incident.job_title || "N/A"}</td>
                  <td className="px-4 py-3 text-sm">{incident.reason || "N/A"}</td>
                  <td className="px-4 py-3 text-sm">{incident.document_type || "N/A"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">لا توجد وقوعات مسجلة</div>
      )}
    </div>
  );
}

// Vacations Section
function VacationsSection({ employeeId }) {
  const [vacations, setVacations] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    fetchVacations();
  }, [employeeId]);

  const fetchVacations = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/employees/${employeeId}/vacations`);
      setVacations(res.data || []);
    } catch (error) {
      console.error("Error fetching vacations:", error);
      toast.error("❌ فشل تحميل الإجازات");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8 text-gray-600">جاري التحميل...</div>;
  }

  return (
    <div>
      {vacations.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-right">النوع</th>
                <th className="px-4 py-3 text-right">عدد الأيام</th>
                <th className="px-4 py-3 text-right">تاريخ البداية</th>
                <th className="px-4 py-3 text-right">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {vacations.map((vacation, idx) => (
                <tr key={idx} className="border-t border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{vacation.type || "N/A"}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-emerald-600">{vacation.days || "0"}</td>
                  <td className="px-4 py-3 text-sm">{vacation.startDate || "N/A"}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                      {vacation.status || "قيد الانتظار"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">لا توجد إجازات مسجلة</div>
      )}
    </div>
  );
}

// Rewards Section
function RewardsSection({ employeeId }) {
  const [rewards, setRewards] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchRewards = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/employees/${employeeId}/rewards`);
        setRewards(res.data || []);
      } catch (error) {
        console.error("Error fetching rewards:", error);
        toast.error("❌ فشل تحميل المكافآت");
      } finally {
        setLoading(false);
      }
    };
    fetchRewards();
  }, [employeeId]);

  if (loading) {
    return <div className="text-center py-8 text-gray-600">جاري التحميل...</div>;
  }

  return (
    <div>
      {rewards.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.map((reward) => (
            <div key={reward._id} className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-4 border border-amber-200">
              <div className="flex items-start gap-2 mb-3">
                <Gift className="w-5 h-5 text-amber-600 mt-1" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">{reward.title || "مكافأة"}</h4>
                  <p className="text-sm text-gray-600">{reward.description || "بدون وصف"}</p>
                </div>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>التاريخ: {reward.date ? new Date(reward.date).toLocaleDateString("ar-EG") : "N/A"}</span>
                <span className="font-semibold text-amber-600">{reward.amount || "N/A"}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">لا توجد مكافآت مسجلة</div>
      )}
    </div>
  );
}

// Punishments Section
function PunishmentsSection({ employeeId }) {
  const [punishments, setPunishments] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchPunishments = async () => {
      try {
        setLoading(true);
        const res = await API.get(`/employees/${employeeId}/punishments`);
        setPunishments(res.data || []);
      } catch (error) {
        console.error("Error fetching punishments:", error);
        toast.error("❌ فشل تحميل الجزاءات");
      } finally {
        setLoading(false);
      }
    };
    fetchPunishments();
  }, [employeeId]);

  if (loading) {
    return <div className="text-center py-8 text-gray-600">جاري التحميل...</div>;
  }

  return (
    <div>
      {punishments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {punishments.map((punishment) => (
            <div key={punishment._id} className="bg-gradient-to-br from-red-50 to-rose-50 rounded-lg p-4 border border-red-200">
              <div className="flex items-start gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-1" />
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800">{punishment.title || "جزاء"}</h4>
                  <p className="text-sm text-gray-600">{punishment.description || "بدون وصف"}</p>
                </div>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>التاريخ: {punishment.date ? new Date(punishment.date).toLocaleDateString("ar-EG") : "N/A"}</span>
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">{punishment.level || "عادي"}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">لا توجد جزاءات مسجلة</div>
      )}
    </div>
  );
}
