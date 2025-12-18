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

  const fetchUserProfile = useCallback(async () => {
    try {
      const targetId = authUser?._id || localStorage.getItem("userId");
      if (!targetId) {
        throw new Error("No user id available to load profile");
      }
      const res = await API.get(`/users/${targetId}`);
      setUserData(res.data);

      // Set employee data if available
      if (res.data.employeeId) {
        setEmployeeData(res.data.employeeId);
      }

      const emp = res.data.employeeId || {};
      const prof = res.data.profile || {};

      setProfile({
        firstName: prof.firstName || emp.firstName || "",
        lastName: prof.lastName || emp.lastName || "",
        email: prof.email || "",
        phone: prof.phone || emp.phone || "",
        department: prof.department || emp.currentJobTitle || "",
        bio: prof.bio || "",
        avatar: prof.avatar || "",
      });

      // Fetch permission details
      try {
        const permRes = await API.get(
          `/permissions/user/${targetId}/permissions`
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
    } catch (err) {
      // Better error logging to help debug 401/403 from server
      console.error("Error fetching user profile:", err?.response || err);
      toast.error("فشل في تحميل الملف الشخصي");
      setLoading(false);
    }
  }, [authUser?._id]);

  useEffect(() => {
    if (authUser?._id) {
      fetchUserProfile();
    }
  }, [authUser?._id, fetchUserProfile]);

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
    // { id: "images", label: "الصور", icon: <Image size={20} /> },
    // { id: "documents", label: "المستندات", icon: <FileIcon size={20} /> },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">جاري تحميل الملف الشخصي...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-900 p-4 md:p-6 relative overflow-hidden font-custom"
    >
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-64 h-64 opacity-10">
        <img
          src={floatingOrb1}
          alt=""
          className="w-full h-full object-contain animate-float"
        />
      </div>
      <div className="absolute bottom-0 right-0 w-64 h-64 opacity-10">
        <img
          src={gradientSphere1}
          alt=""
          className="w-full h-full object-contain animate-floatRandom"
        />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header with decorative patterns */}
        <div className="relative mb-8">
          <div className="absolute -top-6 -left-6 w-32 h-32 opacity-20">
            <img
              src={bluePattern}
              alt=""
              className="w-full h-full object-contain"
            />
          </div>
          <div className="absolute -top-6 -right-6 w-32 h-32 opacity-20">
            <img
              src={emeraldPattern}
              alt=""
              className="w-full h-full object-contain"
            />
          </div>

          <div className="text-center py-8 relative">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-100 mb-2 animate-fadeInDown">
              👤 الملف الشخصي
            </h1>
            <p className="text-slate-400 animate-fadeInUp">
              إدارة معلوماتك الشخصية والمستندات
            </p>
          </div>
        </div>

        {/* Profile Header Card */}
        <div className="bg-slate-800/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 mb-8 border border-slate-700/50 relative overflow-hidden animate-fadeIn">
          <div className="absolute top-0 right-0 w-32 h-32 opacity-5">
            <img
              src={purplePattern}
              alt=""
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="relative group">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 p-1 shadow-lg">
                <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                  {userData?.profile?.avatar ? (
                    <img
                      src={userData.profile.avatar}
                      alt="الصورة الشخصية"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-600">
                      <img
                        src={avatarBlue}
                        alt="الصورة الشخصية"
                        className="w-20 h-20 opacity-80"
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="absolute inset-0 rounded-full border-4 border-white/10 group-hover:border-white/30 transition-all duration-300"></div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <span className="text-white text-xs">✏️</span>
              </div>
            </div>

            <div className="flex-1 text-center md:text-right">
              <h2 className="text-2xl font-bold text-slate-100">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-slate-400 mb-2">
                {profile.department || "غير محدد"}
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-4">
                <span className="px-3 py-1 bg-blue-900/30 text-blue-300 border border-blue-500/30 rounded-full text-sm">
                  البريد: {profile.email || "غير محدد"}
                </span>
                <span className="px-3 py-1 bg-green-900/30 text-green-300 border border-green-500/30 rounded-full text-sm">
                  الهاتف: {profile.phone || "غير محدد"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-6 bg-slate-800/60 backdrop-blur-sm p-2 rounded-xl border border-slate-700/50 shadow-sm">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                activeTab === tab.id
                  ? "bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md"
                  : "text-slate-400 hover:bg-slate-700/50 hover:text-slate-200"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-slate-800/80 backdrop-blur-lg rounded-2xl shadow-xl p-6 border border-slate-700/50 animate-fadeIn">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="animate-fadeIn">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center">
                  <img src={userIcon1} alt="" className="w-6 h-6 opacity-80" />
                </div>
                <h3 className="text-xl font-bold text-slate-100">
                  معلومات الملف الشخصي
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    الاسم الأول
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={profile.firstName || ""}
                    onChange={handleProfileChange}
                    className="w-full border border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm hover:shadow-md bg-slate-700 text-slate-100 placeholder-slate-500"
                    placeholder="الاسم الأول"
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    اسم العائلة
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={profile.lastName || ""}
                    onChange={handleProfileChange}
                    className="w-full border border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm hover:shadow-md bg-slate-700 text-slate-100 placeholder-slate-500"
                    placeholder="اسم العائلة"
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={profile.email || ""}
                    onChange={handleProfileChange}
                    className="w-full border border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm hover:shadow-md bg-slate-700 text-slate-100 placeholder-slate-500"
                    placeholder="البريد الإلكتروني"
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    رقم الهاتف
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={profile.phone || ""}
                    onChange={handleProfileChange}
                    className="w-full border border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm hover:shadow-md bg-slate-700 text-slate-100 placeholder-slate-500"
                    placeholder="رقم الهاتف"
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    القسم
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={profile.department || ""}
                    onChange={handleProfileChange}
                    className="w-full border border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm hover:shadow-md bg-slate-700 text-slate-100 placeholder-slate-500"
                    placeholder="القسم"
                    disabled={!isEditing}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    النبذة الشخصية
                  </label>
                  <textarea
                    name="bio"
                    value={profile.bio || ""}
                    onChange={handleProfileChange}
                    rows="4"
                    className="w-full border border-slate-600 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all shadow-sm hover:shadow-md bg-slate-700 text-slate-100 placeholder-slate-500"
                    placeholder="النبذة الشخصية"
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-8">
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-6 py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                  >
                    ✏️ تعديل الملف الشخصي
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white px-6 py-3 rounded-lg font-medium shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-70"
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
                      className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-6 py-3 rounded-lg font-medium shadow hover:shadow-md transition-all"
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
                <div className="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-100">
                  بيانات الموظف
                </h3>
              </div>

              {employeeData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-blue-900/20 to-indigo-900/20 rounded-2xl p-6 border border-blue-500/20">
                    <h4 className="text-lg font-semibold text-slate-200 mb-4">
                      المعلومات الأساسية
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between border-b border-slate-700 pb-2">
                        <span className="text-slate-400">الاسم الثلاثي:</span>
                        <span className="font-medium text-slate-200">
                          {employeeData.fullName || "غير محدد"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-700 pb-2">
                        <span className="text-slate-400">الرقم الوطني:</span>
                        <span className="font-medium text-slate-200">
                          {employeeData.nationalId || "غير محدد"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-700 pb-2">
                        <span className="text-slate-400">تاريخ الميلاد:</span>
                        <span className="font-medium text-slate-200">
                          {employeeData.birthDate
                            ? new Date(
                                employeeData.birthDate
                              ).toLocaleDateString("ar-EG")
                            : "غير محدد"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-700 pb-2">
                        <span className="text-slate-400">الجنس:</span>
                        <span className="font-medium text-slate-200">
                          {employeeData.gender || "غير محدد"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-700 pb-2">
                        <span className="text-slate-400">
                          الحالة الاجتماعية:
                        </span>
                        <span className="font-medium text-slate-200">
                          {employeeData.maritalStatus || "غير محدد"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-2xl p-6 border border-green-500/20">
                    <h4 className="text-lg font-semibold text-slate-200 mb-4">
                      معلومات العمل
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between border-b border-slate-700 pb-2">
                        <span className="text-slate-400">المسمى الوظيفي:</span>
                        <span className="font-medium text-slate-200">
                          {employeeData.currentJobTitle || "غير محدد"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-700 pb-2">
                        <span className="text-slate-400">القسم:</span>
                        <span className="font-medium text-slate-200">
                          {employeeData.level4 || "غير محدد"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-700 pb-2">
                        <span className="text-slate-400">تاريخ التعيين:</span>
                        <span className="font-medium text-slate-200">
                          {employeeData.hiringDate
                            ? new Date(
                                employeeData.hiringDate
                              ).toLocaleDateString("ar-EG")
                            : "غير محدد"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-700 pb-2">
                        <span className="text-slate-400">نوع التوظيف:</span>
                        <span className="font-medium text-slate-200">
                          {employeeData.employmentType || "غير محدد"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-700 pb-2">
                        <span className="text-slate-400">الراتب الأخير:</span>
                        <span className="font-medium text-slate-200">
                          {employeeData.lastSalary
                            ? `${employeeData.lastSalary} ل س`
                            : "غير محدد"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 rounded-2xl p-6 border border-amber-500/20 md:col-span-2">
                    <h4 className="text-lg font-semibold text-slate-200 mb-4">
                      معلومات الاتصال
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex justify-between border-b border-slate-700 pb-2">
                        <span className="text-slate-400">الهاتف:</span>
                        <span className="font-medium text-slate-200">
                          {employeeData.phone || "غير محدد"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-700 pb-2">
                        <span className="text-slate-400">المحافظة:</span>
                        <span className="font-medium text-slate-200">
                          {employeeData.governorate || "غير محدد"}
                        </span>
                      </div>
                      <div className="flex justify-between border-b border-slate-700 pb-2">
                        <span className="text-slate-400">المدينة:</span>
                        <span className="font-medium text-slate-200">
                          {employeeData.city || "غير محدد"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl border border-slate-600">
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-700 rounded-full flex items-center justify-center">
                    <Briefcase className="w-8 h-8 text-slate-500" />
                  </div>
                  <h4 className="text-lg font-medium text-slate-300 mb-2">
                    لا توجد بيانات موظف
                  </h4>
                  <p className="text-slate-500">
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
                <div className="w-10 h-10 rounded-full bg-indigo-900/30 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-100">
                  الصلاحيات والمجموعات
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Groups Section */}
                <div className="bg-gradient-to-br from-indigo-900/20 to-purple-900/20 rounded-2xl p-6 border border-indigo-500/20">
                  <h4 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                    <span className="text-indigo-400">👥</span>
                    مجموعات الصلاحيات
                  </h4>
                  {permissionDetails.groups.length > 0 ? (
                    <div className="space-y-2">
                      {permissionDetails.groups.map((group, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-3 bg-slate-700 rounded-lg border border-indigo-500/20 shadow-sm"
                        >
                          <span className="w-8 h-8 rounded-full bg-indigo-900/30 flex items-center justify-center text-indigo-400 text-sm font-bold">
                            {idx + 1}
                          </span>
                          <span className="font-medium text-slate-200">
                            {group}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-slate-700/50 rounded-lg border border-dashed border-indigo-500/30">
                      <p className="text-slate-500">لا توجد مجموعات مخصصة</p>
                    </div>
                  )}
                </div>

                {/* Permissions Section */}
                <div className="bg-gradient-to-br from-emerald-900/20 to-teal-900/20 rounded-2xl p-6 border border-emerald-500/20">
                  <h4 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2">
                    <span className="text-emerald-400">🔐</span>
                    الصلاحيات الممنوحة
                  </h4>
                  {permissionDetails.permissions.length > 0 ? (
                    <div className="space-y-2">
                      {permissionDetails.permissions.map((perm, idx) => (
                        <div
                          key={`${perm.key}-${idx}`}
                          className="p-3 bg-slate-700 rounded-lg border border-emerald-500/20 shadow-sm flex flex-wrap gap-2 justify-between"
                        >
                          <div>
                            <div className="font-semibold text-slate-200">
                              {perm.label}
                            </div>
                            <div className="text-xs text-slate-400">
                              المفتاح: {perm.key} • الفئة: {perm.category}
                            </div>
                          </div>
                          <span className="px-2 py-1 bg-emerald-900/30 text-emerald-300 rounded-full text-xs font-medium border border-emerald-500/30">
                            {perm.source}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-slate-700/50 rounded-lg border border-dashed border-emerald-500/30">
                      <p className="text-slate-500">لا توجد صلاحيات مخصصة</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Info Note */}
              <div className="mt-6 p-4 bg-blue-900/20 rounded-xl border border-blue-500/30 flex items-start gap-3">
                <span className="text-blue-400 text-xl">ℹ️</span>
                <div>
                  <p className="text-blue-300 font-medium">ملاحظة</p>
                  <p className="text-blue-400 text-sm">
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
                <div className="bg-gradient-to-br from-amber-900/20 to-orange-900/20 rounded-2xl p-6 border border-amber-500/20 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-amber-900/30 flex items-center justify-center">
                      <span className="text-amber-500">💰</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-100">
                      صورة الراتب
                    </h3>
                  </div>

                  {userData?.profile?.salaryInfo?.image ? (
                    <div className="mb-4 rounded-lg overflow-hidden h-48 shadow-inner">
                      <img
                        src={userData.profile.salaryInfo.image}
                        alt="صورة الراتب"
                        className="w-full h-full object-contain bg-slate-700 p-2 rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="mb-4 rounded-lg overflow-hidden h-48 bg-gradient-to-br from-amber-900/10 to-orange-900/10 flex items-center justify-center border border-amber-500/10">
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
                <div className="bg-gradient-to-br from-emerald-900/20 to-teal-900/20 rounded-2xl p-6 border border-emerald-500/20 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-emerald-900/30 flex items-center justify-center">
                      <span className="text-emerald-500">👥</span>
                    </div>
                    <h3 className="text-xl font-bold text-slate-100">
                      قائمة الموظفين
                    </h3>
                  </div>

                  {userData?.profile?.employeeList?.image ? (
                    <div className="mb-4 rounded-lg overflow-hidden h-48 shadow-inner">
                      <img
                        src={userData.profile.employeeList.image}
                        alt="قائمة الموظفين"
                        className="w-full h-full object-contain bg-slate-700 p-2 rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="mb-4 rounded-lg overflow-hidden h-48 bg-gradient-to-br from-emerald-900/10 to-teal-900/10 flex items-center justify-center border border-emerald-500/10">
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
              <div className="mt-8 bg-gradient-to-br from-blue-900/20 to-indigo-900/20 rounded-2xl p-6 border border-blue-500/20 shadow-sm">
                <h3 className="text-xl font-bold text-slate-100 mb-6">
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
        </div>
      </div>

      {/* Custom styles for animations */}
      <style>{`
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
