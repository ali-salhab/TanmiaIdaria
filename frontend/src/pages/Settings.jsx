import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useSettings } from "../context/SettingsContext";
import {
  Settings as SettingsIcon,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Globe,
  Bell,
  MessageCircle,
  Save,
  RefreshCw,
} from "lucide-react";
import API from "../api/api";

export default function Settings() {
  const { settings, updateSettings, playNotification, playMessage, loading } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = (path, value) => {
    if (path.includes(".")) {
      const [parent, child] = path.split(".");
      setLocalSettings((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setLocalSettings((prev) => ({
        ...prev,
        [path]: value,
      }));
    }
  };

  const handleSoundChange = (type, field, value) => {
    setLocalSettings((prev) => ({
      ...prev,
      sounds: {
        ...prev.sounds,
        [type]: {
          ...prev.sounds[type],
          [field]: value,
        },
      },
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateSettings(localSettings);
      toast.success("✅ تم حفظ الإعدادات بنجاح");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("❌ فشل في حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  };

  const testNotificationSound = () => {
    playNotification();
    toast.success("🔔 اختبار صوت الإشعارات");
  };

  const testMessageSound = () => {
    playMessage();
    toast.success("💬 اختبار صوت الرسائل");
  };

  if (loading) {
    return (
      <div dir="rtl" className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-blue-600" />
            الإعدادات
          </h1>
          <p className="text-gray-600 mt-2">إدارة إعدادات التطبيق والتفضيلات الشخصية</p>
        </div>

        {/* Theme Settings */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Sun className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-semibold text-gray-800">المظهر</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المظهر
              </label>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { value: "light", label: "فاتح", icon: Sun },
                  { value: "dark", label: "داكن", icon: Moon },
                  { value: "auto", label: "تلقائي", icon: RefreshCw },
                ].map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleChange("theme", option.value)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        localSettings.theme === option.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <Icon className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                      <p className="text-sm font-medium">{option.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Language Settings */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-800">اللغة</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                لغة الواجهة
              </label>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: "ar", label: "العربية", flag: "🇸🇦" },
                  { value: "en", label: "English", flag: "🇬🇧" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleChange("language", option.value)}
                    className={`p-4 rounded-xl border-2 transition-all flex items-center justify-center gap-2 ${
                      localSettings.language === option.value
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-2xl">{option.flag}</span>
                    <p className="text-sm font-medium">{option.label}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sound Settings */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Volume2 className="w-6 h-6 text-green-500" />
            <h2 className="text-xl font-semibold text-gray-800">الأصوات</h2>
          </div>

          {/* Notification Sounds */}
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-800">أصوات الإشعارات</h3>
              </div>
              <button
                onClick={() =>
                  handleSoundChange(
                    "notifications",
                    "enabled",
                    !localSettings.sounds?.notifications?.enabled
                  )
                }
                className={`p-2 rounded-lg transition ${
                  localSettings.sounds?.notifications?.enabled
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {localSettings.sounds?.notifications?.enabled ? (
                  <Volume2 className="w-5 h-5" />
                ) : (
                  <VolumeX className="w-5 h-5" />
                )}
              </button>
            </div>
            {localSettings.sounds?.notifications?.enabled && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    مستوى الصوت: {Math.round((localSettings.sounds?.notifications?.volume || 0.7) * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={localSettings.sounds?.notifications?.volume || 0.7}
                    onChange={(e) =>
                      handleSoundChange("notifications", "volume", parseFloat(e.target.value))
                    }
                    className="w-full"
                  />
                </div>
                <button
                  onClick={testNotificationSound}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  اختبار الصوت
                </button>
              </div>
            )}
          </div>

          {/* Message Sounds */}
          <div className="p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-800">أصوات الرسائل</h3>
              </div>
              <button
                onClick={() =>
                  handleSoundChange(
                    "messages",
                    "enabled",
                    !localSettings.sounds?.messages?.enabled
                  )
                }
                className={`p-2 rounded-lg transition ${
                  localSettings.sounds?.messages?.enabled
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {localSettings.sounds?.messages?.enabled ? (
                  <Volume2 className="w-5 h-5" />
                ) : (
                  <VolumeX className="w-5 h-5" />
                )}
              </button>
            </div>
            {localSettings.sounds?.messages?.enabled && (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    مستوى الصوت: {Math.round((localSettings.sounds?.messages?.volume || 0.7) * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={localSettings.sounds?.messages?.volume || 0.7}
                    onChange={(e) =>
                      handleSoundChange("messages", "volume", parseFloat(e.target.value))
                    }
                    className="w-full"
                  />
                </div>
                <button
                  onClick={testMessageSound}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  اختبار الصوت
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold text-lg"
          >
            {saving ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                حفظ الإعدادات
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

