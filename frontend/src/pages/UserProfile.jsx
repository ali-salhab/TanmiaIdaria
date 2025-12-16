import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import API from "../api/api";
import ImageUploadWithScanner from "../components/ImageUploadWithScanner";
import {
  FileText,
  Trash2,
  Download,
  User,
  Image,
  FileText as FileIcon,
  Briefcase,
  Shield,
} from "lucide-react";
import { toast } from "react-hot-toast";
// Import decorative circle images
import bluePattern from "../assets/circles/patterns/circle-pattern-blue.svg";
import emeraldPattern from "../assets/circles/patterns/circle-pattern-emerald.svg";
import purplePattern from "../assets/circles/patterns/circle-pattern-purple.svg";
import userIcon1 from "../assets/circles/icons/user-circle-1.svg";
import documentIcon1 from "../assets/circles/icons/document-circle-1.svg";
import badgeIcon1 from "../assets/circles/icons/badge-circle-1.svg";
import avatarBlue from "../assets/circles/avatars/avatar-placeholder-blue.svg";
import floatingOrb1 from "../assets/circles/decorative/floating-orb-1.svg";
import gradientSphere1 from "../assets/circles/decorative/gradient-sphere-1.svg";

export default function UserProfile() {
  const { user: authUser } = useAuth();
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    department: "",
    bio: "",
  });
  const [userData, setUserData] = useState(null);
  const [employeeData, setEmployeeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [documentName, setDocumentName] = useState("");
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [permissionDetails, setPermissionDetails] = useState({
    groups: [],
    permissions: [], // [{label,key,category,source}]
  });

  useEffect(() => {
    if (authUser?._id) {
      fetchUserProfile();
    }
  }, [authUser?._id, fetchUserProfile]);

  const fetchUserProfile = useCallback(async () => {
    try {
      const res = await API.get(`/users/${authUser?._id}`);
      setUserData(res.data);

      // Set employee data if available
      if (res.data.employeeId) {
        setEmployeeData(res.data.employeeId);
      }

      if (res.data.profile) {
        setProfile(res.data.profile);
      }

      // Fetch permission details
      try {
        const permRes = await API.get(
          `/permissions/user/${authUser?._id}/permissions`
        );
        const permData = permRes.data.user || {};

        const groupNames = (permData.permissionGroups || []).map(
          (g) => g.name || g._id
        );

        const perms = [];
        const pushPerm = (perm, source) => {
          if (!perm) return;
          perms.push({
            label: perm.label || perm.key || perm._id,
            key: perm.key || perm._id,
            category: perm.category || "غير مصنف",
            source,
          });
        };

        (permData.permissionGroups || []).forEach((group) => {
          (group.permissions || []).forEach((perm) => {
            pushPerm(perm, `مجموعة: ${group.name || group._id}`);
          });
        });

        (permData.directPermissions || []).forEach((perm) => {
          pushPerm(perm, "مباشر");
        });

        setPermissionDetails({
          groups: groupNames,
          permissions: perms,
        });
      } catch (permErr) {
        console.error("Error fetching permissions:", permErr);
      }

      setLoading(false);
    } catch {
      toast.error("فشل في تحميل الملف الشخصي");
      setLoading(false);
    }
  }, [authUser?._id]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await API.put(`/users/${authUser?._id}/profile`, profile);
      toast.success("تم حفظ الملف الشخصي بنجاح");
      setIsEditing(false);
      fetchUserProfile();
    } catch {
      toast.error("فشل في حفظ الملف الشخصي");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      await API.post(`/users/${authUser?._id}/avatar`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("تم تحديث الصورة الشخصية بنجاح");
      fetchUserProfile();
    } catch {
      toast.error("فشل في تحميل الصورة");
    }
  };

  const handleDocumentUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append("document", file);
      formData.append("name", documentName || file.name);
      await API.post(`/users/${authUser?._id}/documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("تم تحميل المستند بنجاح");
      setDocumentName("");
      fetchUserProfile();
    } catch {
      toast.error("فشل في تحميل المستند");
    }
  };

  const handleSalaryImageUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append("image", file);
      await API.post(`/users/${authUser?._id}/salary-image`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("تم تحميل صورة الراتب بنجاح");
      fetchUserProfile();
    } catch {
      toast.error("فشل في تحميل صورة الراتب");
    }
  };

  const handleEmployeeListImageUpload = async (file) => {
    try {
      const formData = new FormData();
      formData.append("image", file);
      await API.post(`/users/${authUser?._id}/employee-list-image`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("تم تحميل صورة قائمة الموظفين بنجاح");
      fetchUserProfile();
    } catch {
      toast.error("فشل في تحميل صورة قائمة الموظفين");
    }
  };

  const handleDeleteDocument = async (index) => {
    try {
      if (window.confirm("هل أنت متأكد من حذف هذا المستند؟")) {
        await API.delete(`/users/${authUser?._id}/documents/${index}`);
        toast.success("تم حذف المستند بنجاح");
        fetchUserProfile();
      }
    } catch {
      toast.error("فشل في حذف المستند");
    }
  };

  // Tab configuration
  const tabs = [
    { id: "profile", label: "الملف الشخصي", icon: <User size={20} /> },
    { id: "employee", label: "بيانات الموظف", icon: <Briefcase size={20} /> },
    {
      id: "permissions",
      label: "الصلاحيات والمجموعات",
      icon: <Shield size={20} />,
    },
    { id: "images", label: "الصور", icon: <Image size={20} /> },
    { id: "documents", label: "المستندات", icon: <FileIcon size={20} /> },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل الملف الشخصي...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-6 relative overflow-hidden"
    >
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-64 h-64 opacity-20">
        <img
          src={floatingOrb1}
          alt=""
          className="w-full h-full object-contain animate-float"
        />
      </div>
      <div className="absolute bottom-0 right-0 w-64 h-64 opacity-20">
        <img
          src={gradientSphere1}
          alt=""
          className="w-full h-full object-contain animate-floatRandom"
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header with decorative patterns */}
        <div className="relative mb-8">
          <div className="absolute -top-6 -left-6 w-32 h-32 opacity-30">
            <img
              src={bluePattern}
              alt=""
              className="w-full h-full object-contain"
            />
          </div>
          <div className="absolute -top-6 -right-6 w-32 h-32 opacity-30">
            <img
              src={emeraldPattern}
              alt=""
              className="w-full h-full object-contain"
            />
          </div>

          <div className="text-center py-8 relative">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 animate-fadeInDown">
              👤 الملف الشخصي
            </h1>
            <p className="text-gray-600 animate-fadeInUp">
              إدارة معلوماتك الشخصية والمستندات
            </p>
          </div>
        </div>

        {/* Profile Header Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 mb-8 border border-white/50 relative overflow-hidden animate-fadeIn">
          <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
            <img
              src={purplePattern}
              alt=""
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 p-1 shadow-lg">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                  {userData?.profile?.avatar ? (
                    <img
                      src={userData.profile.avatar}
                      alt="الصورة الشخصية"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-200">
                      <img
                        src={avatarBlue}
                        alt="الصورة الشخصية"
                        className="w-20 h-20 opacity-80"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-white/30 group-hover:border-white/60 transition-all duration-300"></div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <span className="text-white text-xs">✏️</span>
              </div>
            </div>

            <div className="flex-1 text-center md:text-right">
              <h2 className="text-2xl font-bold text-gray-800">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-gray-600 mb-2">
                {profile.department || "غير محدد"}
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  البريد: {profile.email || "غير محدد"}
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  الهاتف: {profile.phone || "غير محدد"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 bg-white/60 backdrop-blur-sm p-2 rounded-xl border border-white/50 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md"
                  : "text-gray-600 hover:bg-white/50"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-white/50 animate-fadeIn">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="animate-fadeIn">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <img src={userIcon1} alt="" className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">
                  معلومات الملف الشخصي
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الاسم الأول
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={profile.firstName || ""}
                    onChange={handleProfileChange}
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm hover:shadow-md"
                    placeholder="الاسم الأول"
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    اسم العائلة
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={profile.lastName || ""}
                    onChange={handleProfileChange}
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm hover:shadow-md"
                    placeholder="اسم العائلة"
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profile.email || ""}
                    onChange={handleProfileChange}
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm hover:shadow-md"
                    placeholder="البريد الإلكتروني"
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رقم الهاتف
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={profile.phone || ""}
                    onChange={handleProfileChange}
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm hover:shadow-md"
                    placeholder="رقم الهاتف"
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    القسم
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={profile.department || ""}
                    onChange={handleProfileChange}
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm hover:shadow-md"
                    placeholder="القسم"
                    disabled={!isEditing}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    النبذة الشخصية
                  </label>
                  <textarea
                    name="bio"
                    value={profile.bio || ""}
                    onChange={handleProfileChange}
                    rows="4"
                    className="w-full border rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm hover:shadow-md"
                    placeholder="النبذة الشخصية"
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-8">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                  >
                    ✏️ تعديل الملف الشخصي
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-6 py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-70"
                    >
                      {saving ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                          جاري الحفظ...
                        </>
                      ) : (
                        "💾 حفظ التغييرات"
                      )}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-medium shadow hover:shadow-md transition-all"
                    >
                      إلغاء
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Employee Data Tab */}
          {activeTab === "employee" && (
            <div className="animate-fadeIn">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">
                  بيانات الموظف
                </h3>
              </div>

              {employeeData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">
                      المعلومات الأساسية
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">الاسم الثلاثي:</span>
                        <span className="font-medium">
                          {employeeData.fullName || "غير محدد"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">الرقم الوطني:</span>
                        <span className="font-medium">
                          {employeeData.nationalId || "غير محدد"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">تاريخ الميلاد:</span>
                        <span className="font-medium">
                          {employeeData.birthDate
                            ? new Date(
                                employeeData.birthDate
                              ).toLocaleDateString("ar-EG")
                            : "غير محدد"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">الجنس:</span>
                        <span className="font-medium">
                          {employeeData.gender || "غير محدد"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">
                          الحالة الاجتماعية:
                        </span>
                        <span className="font-medium">
                          {employeeData.maritalStatus || "غير محدد"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">
                      معلومات العمل
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">المسمى الوظيفي:</span>
                        <span className="font-medium">
                          {employeeData.currentJobTitle || "غير محدد"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">القسم:</span>
                        <span className="font-medium">
                          {employeeData.level4 || "غير محدد"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">تاريخ التعيين:</span>
                        <span className="font-medium">
                          {employeeData.hiringDate
                            ? new Date(
                                employeeData.hiringDate
                              ).toLocaleDateString("ar-EG")
                            : "غير محدد"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">نوع التوظيف:</span>
                        <span className="font-medium">
                          {employeeData.employmentType || "غير محدد"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">الراتب الأخير:</span>
                        <span className="font-medium">
                          {employeeData.lastSalary
                            ? `${employeeData.lastSalary} دينار`
                            : "غير محدد"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100 md:col-span-2">
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">
                      معلومات الاتصال
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">الهاتف:</span>
                        <span className="font-medium">
                          {employeeData.phone || "غير محدد"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">المحافظة:</span>
                        <span className="font-medium">
                          {employeeData.governorate || "غير محدد"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-gray-600">المدينة:</span>
                        <span className="font-medium">
                          {employeeData.city || "غير محدد"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border border-gray-100">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <Briefcase className="w-8 h-8 text-gray-500" />
                  </div>
                  <h4 className="text-lg font-medium text-gray-700 mb-2">
                    لا توجد بيانات موظف
                  </h4>
                  <p className="text-gray-500">
                    يجب أن يكون لديك حساب مستخدم مرتبط بموظف
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Permissions Tab */}
          {activeTab === "permissions" && (
            <div className="animate-fadeIn">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">
                  الصلاحيات والمجموعات
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Groups Section */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="text-indigo-600">👥</span>
                    مجموعات الصلاحيات
                  </h4>
                  {permissionDetails.groups.length > 0 ? (
                    <div className="space-y-2">
                      {permissionDetails.groups.map((group, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-3 bg-white rounded-lg border border-indigo-100 shadow-sm"
                        >
                          <span className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-bold">
                            {idx + 1}
                          </span>
                          <span className="font-medium text-gray-800">
                            {group}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-white/50 rounded-lg border border-dashed border-indigo-200">
                      <p className="text-gray-500">لا توجد مجموعات مخصصة</p>
                    </div>
                  )}
                </div>

                {/* Permissions Section */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="text-emerald-600">🔐</span>
                    الصلاحيات الممنوحة
                  </h4>
                  {permissionDetails.permissions.length > 0 ? (
                    <div className="space-y-2">
                      {permissionDetails.permissions.map((perm, idx) => (
                        <div
                          key={`${perm.key}-${idx}`}
                          className="p-3 bg-white rounded-lg border border-emerald-100 shadow-sm flex flex-wrap gap-2 justify-between"
                        >
                          <div>
                            <div className="font-semibold text-gray-800">
                              {perm.label}
                            </div>
                            <div className="text-xs text-gray-500">
                              المفتاح: {perm.key} • الفئة: {perm.category}
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium border border-emerald-200">
                            {perm.source}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-white/50 rounded-lg border border-dashed border-emerald-200">
                      <p className="text-gray-500">لا توجد صلاحيات مخصصة</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Info Note */}
              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-start gap-3">
                <span className="text-blue-600 text-xl">ℹ️</span>
                <div>
                  <p className="text-blue-800 font-medium">ملاحظة</p>
                  <p className="text-blue-600 text-sm">
                    الصلاحيات تحدد ما يمكنك الوصول إليه في النظام. إذا كنت بحاجة
                    لصلاحيات إضافية، يرجى التواصل مع مدير النظام.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Images Tab */}
          {activeTab === "images" && (
            <div className="animate-fadeIn">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* صورة الراتب */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-100 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                      <span className="text-amber-600">💰</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">
                      صورة الراتب
                    </h3>
                  </div>

                  {userData?.profile?.salaryInfo?.image ? (
                    <div className="mb-4 rounded-lg overflow-hidden h-48 shadow-inner">
                      <img
                        src={userData.profile.salaryInfo.image}
                        alt="صورة الراتب"
                        className="w-full h-full object-contain bg-white p-2 rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="mb-4 rounded-lg overflow-hidden h-48 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                      <div className="text-center text-amber-500">
                        <div className="text-4xl mb-2">💰</div>
                        <p>لا توجد صورة مرفقة</p>
                      </div>
                    </div>
                  )}

                  <ImageUploadWithScanner
                    label="تحميل صورة الراتب"
                    onUpload={handleSalaryImageUpload}
                    currentImage={userData?.profile?.salaryInfo?.image}
                  />
                </div>

                {/* صورة قائمة الموظفين */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                      <span className="text-emerald-600">👥</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">
                      قائمة الموظفين
                    </h3>
                  </div>

                  {userData?.profile?.employeeList?.image ? (
                    <div className="mb-4 rounded-lg overflow-hidden h-48 shadow-inner">
                      <img
                        src={userData.profile.employeeList.image}
                        alt="قائمة الموظفين"
                        className="w-full h-full object-contain bg-white p-2 rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="mb-4 rounded-lg overflow-hidden h-48 bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                      <div className="text-center text-emerald-500">
                        <div className="text-4xl mb-2">👥</div>
                        <p>لا توجد صورة مرفقة</p>
                      </div>
                    </div>
                  )}

                  <ImageUploadWithScanner
                    label="تحميل صورة قائمة الموظفين"
                    onUpload={handleEmployeeListImageUpload}
                    currentImage={userData?.profile?.employeeList?.image}
                  />
                </div>
              </div>

              {/* Avatar Upload Section */}
              <div className="mt-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 shadow-sm">
                <h3 className="text-xl font-bold text-gray-800 mb-6">
                  الصورة الشخصية
                </h3>
                <ImageUploadWithScanner
                  label="تحميل الصورة الشخصية"
                  onUpload={handleAvatarUpload}
                  currentImage={userData?.profile?.avatar}
                />
              </div>
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === "documents" && (
            <div className="animate-fadeIn">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <img src={documentIcon1} alt="" className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-800">
                  إدارة المستندات
                </h3>
              </div>

              {authUser?.permissions?.viewDocuments && (
                <>
                  <div className="mb-8 p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl border border-purple-100">
                    <div className="mb-6">
                      <div className="flex gap-3 mb-4">
                        <input
                          type="text"
                          value={documentName}
                          onChange={(e) => setDocumentName(e.target.value)}
                          placeholder="اسم المستند (اختياري)"
                          className="flex-1 border rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 outline-none shadow-sm"
                        />
                      </div>
                      <ImageUploadWithScanner
                        label="تحميل مستند جديد"
                        onUpload={handleDocumentUpload}
                        accept="image/*,.pdf,.doc,.docx"
                      />
                    </div>
                  </div>

                  {userData?.profile?.documents &&
                  userData.profile.documents.length > 0 ? (
                    <div className="space-y-4">
                      {userData.profile.documents.map((doc, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all animate-fadeInUp delay-100"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                              <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-800">
                                {doc.name}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(doc.uploadedAt).toLocaleDateString(
                                  "ar-EG"
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <a
                              href={doc.url}
                              download
                              className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition"
                              title="تحميل"
                            >
                              <Download className="w-5 h-5" />
                            </a>
                            <button
                              onClick={() => handleDeleteDocument(idx)}
                              className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition"
                              title="حذف"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl border border-gray-100">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <img
                          src={badgeIcon1}
                          alt=""
                          className="w-8 h-8 opacity-70"
                        />
                      </div>
                      <h4 className="text-lg font-medium text-gray-700 mb-2">
                        لا توجد مستندات
                      </h4>
                      <p className="text-gray-500">ابدأ بتحميل مستند جديد</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Custom styles for animations */}
      <style jsx>{`
        @media (prefers-reduced-motion: reduce) {
          .animate-fadeIn,
          .animate-fadeInUp,
          .animate-fadeInDown {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
