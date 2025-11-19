import React, { useEffect, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import API from "../api/api";
import ImageUploadWithScanner from "../components/ImageUploadWithScanner";
import { FileText, Trash2, Download, Plus } from "lucide-react";
import { toast } from "react-hot-toast";

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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [documentName, setDocumentName] = useState("");

  useEffect(() => {
    if (authUser?._id) {
      fetchUserProfile();
    }
  }, [authUser?._id]);

  const fetchUserProfile = async () => {
    try {
      const res = await API.get(`/users/${authUser?._id}`);
      setUserData(res.data);
      if (res.data.profile) {
        setProfile(res.data.profile);
      }
      setLoading(false);
    } catch {
      toast.error("فشل في تحميل الملف الشخصي");
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      await API.put(`/users/${authUser?._id}/profile`, profile);
      toast.success("تم حفظ الملف الشخصي بنجاح");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-800 mb-8">👤 الملف الشخصي</h1>

        {/* معلومات المستخدم الأساسية */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-8 mb-8">
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden mb-4 border-4 border-blue-500">
                {userData?.profile?.avatar ? (
                  <img
                    src={userData.profile.avatar}
                    alt="الصورة الشخصية"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-blue-200 flex items-center justify-center text-2xl">
                    👤
                  </div>
                )}
              </div>
              <p className="text-gray-600 text-center">الصورة الشخصية</p>
            </div>

            <div className="flex-1 space-y-4">
              <ImageUploadWithScanner
                label="تحميل الصورة الشخصية"
                onUpload={handleAvatarUpload}
                currentImage={userData?.profile?.avatar}
              />
            </div>
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
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="الاسم الأول"
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
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="اسم العائلة"
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
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="البريد الإلكتروني"
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
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="رقم الهاتف"
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
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="القسم"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                النبذة الشخصية
              </label>
              <textarea
                name="bio"
                value={profile.bio || ""}
                onChange={handleProfileChange}
                rows="3"
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="النبذة الشخصية"
              />
            </div>
          </div>

          <button
            onClick={handleSaveProfile}
            disabled={saving}
            className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
          >
            {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* صورة الراتب */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              💰 صورة الراتب
            </h2>
            {userData?.profile?.salaryInfo?.image && (
              <div className="mb-4 rounded-lg overflow-hidden h-48">
                <img
                  src={userData.profile.salaryInfo.image}
                  alt="صورة الراتب"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <ImageUploadWithScanner
              label="تحميل صورة الراتب"
              onUpload={handleSalaryImageUpload}
              currentImage={userData?.profile?.salaryInfo?.image}
            />
          </div>

          {/* صورة قائمة الموظفين */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              👥 قائمة الموظفين
            </h2>
            {userData?.profile?.employeeList?.image && (
              <div className="mb-4 rounded-lg overflow-hidden h-48">
                <img
                  src={userData.profile.employeeList.image}
                  alt="قائمة الموظفين"
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <ImageUploadWithScanner
              label="تحميل صورة قائمة الموظفين"
              onUpload={handleEmployeeListImageUpload}
              currentImage={userData?.profile?.employeeList?.image}
            />
          </div>
        </div>

        {/* إدارة المستندات */}
        {authUser?.permissions?.viewDocuments && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mt-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              📄 المستندات
            </h2>

            <div className="mb-6">
              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="اسم المستند (اختياري)"
                  className="flex-1 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <ImageUploadWithScanner
                label="تحميل مستند جديد"
                onUpload={handleDocumentUpload}
                accept="image/*,.pdf,.doc,.docx"
              />
            </div>

            {userData?.profile?.documents && userData.profile.documents.length > 0 ? (
              <div className="space-y-3">
                {userData.profile.documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{doc.name}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(doc.uploadedAt).toLocaleDateString("ar-EG")}
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
              <p className="text-gray-500 text-center py-8">لا توجد مستندات حالياً</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
