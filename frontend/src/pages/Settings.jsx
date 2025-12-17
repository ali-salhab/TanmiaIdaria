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
  const { settings, updateSettings, playNotification, playMessage, loading } =
    useSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = async (path, value) => {
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

      // Instant update for theme and language
      if (path === "theme" || path === "language") {
        try {
          await updateSettings({ ...settings, [path]: value });
          toast.success("✅ تم تحديث الإعدادات");
        } catch (error) {
          console.error("Error updating settings:", error);
          toast.error("❌ فشل تحديث الإعدادات");
        }
      }
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
    <div
      dir="rtl"
      className="min-h-screen bg-slate-900 p-4 md:p-8 animate-fadeIn"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-slate-800 rounded-2xl shadow-lg p-6 mb-6 transform transition-all hover:shadow-xl">
          <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
            <div className="p-2 bg-blue-900/50 rounded-xl">
              <SettingsIcon className="w-8 h-8 text-blue-400 animate-spin-slow" />
            </div>
            الإعدادات
          </h1>
          <p className="text-slate-400 mt-2 mr-14">
            إدارة إعدادات التطبيق والتفضيلات الشخصية
          </p>
        </div>

        {/* Theme Settings */}
        <div className="bg-slate-800 rounded-2xl shadow-lg p-6 mb-6 transform transition-all hover:shadow-xl">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
            <div className="p-2 bg-yellow-900/30 rounded-lg">
              <Sun className="w-6 h-6 text-yellow-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">المظهر</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                value: "light",
                label: "فاتح",
                icon: Sun,
                color: "text-yellow-500",
              },
              {
                value: "dark",
                label: "داكن",
                icon: Moon,
                color: "text-indigo-400",
              },
              {
                value: "auto",
                label: "تلقائي",
                icon: RefreshCw,
                color: "text-slate-400",
              },
            ].map((option) => {
              const Icon = option.icon;
              const isSelected = localSettings.theme === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => handleChange("theme", option.value)}
                  className={`group relative p-4 rounded-xl border-2 transition-all duration-300 overflow-hidden ${
                    isSelected
                      ? "border-blue-500 bg-blue-900/20 shadow-md"
                      : "border-slate-700 hover:border-blue-500/50 hover:shadow-md bg-slate-800"
                  }`}
                >
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div
                      className={`p-3 rounded-full transition-all duration-300 ${
                        isSelected
                          ? "bg-slate-700 shadow-sm"
                          : "bg-slate-700 group-hover:bg-slate-600"
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 transition-transform duration-300 group-hover:scale-110 ${option.color}`}
                      />
                    </div>
                    <span
                      className={`font-bold ${
                        isSelected
                          ? "text-blue-400"
                          : "text-slate-400 group-hover:text-slate-200"
                      }`}
                    >
                      {option.label}
                    </span>
                  </div>

                  {/* Hover Effect Background */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br from-white/0 to-blue-50/0 group-hover:from-blue-500/10 group-hover:to-blue-600/10 transition-all duration-300`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Language Settings */}
        <div className="bg-slate-800 rounded-2xl shadow-lg p-6 mb-6 transform transition-all hover:shadow-xl">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
            <div className="p-2 bg-blue-900/30 rounded-lg">
              <Globe className="w-6 h-6 text-blue-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">اللغة</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { value: "ar", label: "العربية", flag: "🇸🇦", sub: "Arabic" },
              { value: "en", label: "English", flag: "🇬🇧", sub: "الإنجليزية" },
            ].map((option) => {
              const isSelected = localSettings.language === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => handleChange("language", option.value)}
                  className={`group relative p-4 rounded-xl border-2 transition-all duration-300 ${
                    isSelected
                      ? "border-blue-500 bg-blue-900/20 shadow-md"
                      : "border-slate-700 hover:border-blue-500/50 hover:shadow-md bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-4xl filter drop-shadow-sm transition-transform duration-300 group-hover:scale-110">
                      {option.flag}
                    </span>
                    <div className="text-right">
                      <p
                        className={`font-bold text-lg ${
                          isSelected ? "text-blue-400" : "text-slate-100"
                        }`}
                      >
                        {option.label}
                      </p>
                      <p className="text-xs text-slate-500 font-medium">
                        {option.sub}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sound Settings */}
        <div className="bg-slate-800 rounded-2xl shadow-lg p-6 mb-6 transform transition-all hover:shadow-xl">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
            <div className="p-2 bg-green-900/30 rounded-lg">
              <Volume2 className="w-6 h-6 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-100">الأصوات</h2>
          </div>

          {/* Notification Sounds */}
          <div className="mb-6 p-5 bg-slate-700/50 rounded-2xl border border-slate-600 hover:border-blue-500/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-800 rounded-lg shadow-sm">
                  <Bell className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100">أصوات الإشعارات</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    تخصيص نغمة التنبيهات العامة
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  handleSoundChange(
                    "notifications",
                    "enabled",
                    !localSettings.sounds?.notifications?.enabled
                  )
                }
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  localSettings.sounds?.notifications?.enabled
                    ? "bg-blue-600"
                    : "bg-slate-600"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition duration-300 shadow-sm ${
                    localSettings.sounds?.notifications?.enabled
                      ? "translate-x-1"
                      : "translate-x-6"
                  }`}
                />
              </button>
            </div>

            {localSettings.sounds?.notifications?.enabled && (
              <div className="mr-11 space-y-4 animate-fadeIn">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-400 mb-2">
                      مستوى الصوت
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={localSettings.sounds?.notifications?.volume || 0.7}
                      onChange={(e) =>
                        handleSoundChange(
                          "notifications",
                          "volume",
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>
                  <button
                    onClick={testNotificationSound}
                    className="p-2 bg-blue-900/30 text-blue-400 rounded-lg hover:bg-blue-900/50 transition-colors shadow-sm"
                    title="تجربة الصوت"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Message Sounds */}
          <div className="p-5 bg-slate-700/50 rounded-2xl border border-slate-600 hover:border-purple-500/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-800 rounded-lg shadow-sm">
                  <MessageCircle className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100">أصوات الرسائل</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    تخصيص نغمة المحادثات
                  </p>
                </div>
              </div>
              <button
                onClick={() =>
                  handleSoundChange(
                    "messages",
                    "enabled",
                    !localSettings.sounds?.messages?.enabled
                  )
                }
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${
                  localSettings.sounds?.messages?.enabled
                    ? "bg-purple-600"
                    : "bg-slate-600"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition duration-300 shadow-sm ${
                    localSettings.sounds?.messages?.enabled
                      ? "translate-x-1"
                      : "translate-x-6"
                  }`}
                />
              </button>
            </div>

            {localSettings.sounds?.messages?.enabled && (
              <div className="mr-11 space-y-4 animate-fadeIn">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-400 mb-2">
                      مستوى الصوت
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={localSettings.sounds?.messages?.volume || 0.7}
                      onChange={(e) =>
                        handleSoundChange(
                          "messages",
                          "volume",
                          parseFloat(e.target.value)
                        )
                      }
                      className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>
                  <button
                    onClick={testMessageSound}
                    className="p-2 bg-purple-900/30 text-purple-400 rounded-lg hover:bg-purple-900/50 transition-colors shadow-sm"
                    title="تجربة الصوت"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="bg-slate-800 rounded-2xl shadow-lg p-6">
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
