import React, { createContext, useContext, useState, useEffect } from "react";
import API from "../api/api";
import { playNotificationSound, playMessageSound } from "../utils/sounds";

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    theme: "light",
    language: "ar",
    sounds: {
      notifications: { enabled: true, volume: 0.7 },
      messages: { enabled: true, volume: 0.7 },
    },
  });
  const [loading, setLoading] = useState(true);

  // Load settings from localStorage and API
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load from localStorage first (for instant access)
      const localSettings = localStorage.getItem("appSettings");
      if (localSettings) {
        const parsed = JSON.parse(localSettings);
        setSettings(parsed);
        applyTheme(parsed.theme);
        applyLanguage(parsed.language);
      }

      // Then load from API
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const res = await API.get("/app-settings");
          if (res.data) {
            const apiSettings = {
              theme: res.data.theme || "light",
              language: res.data.language || "ar",
              sounds: res.data.sounds || {
                notifications: { enabled: true, volume: 0.7 },
                messages: { enabled: true, volume: 0.7 },
              },
            };
            setSettings(apiSettings);
            localStorage.setItem("appSettings", JSON.stringify(apiSettings));
            applyTheme(apiSettings.theme);
            applyLanguage(apiSettings.language);
          }
        } catch (error) {
          console.log("Could not load settings from API, using local settings");
        }
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (newSettings) => {
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      localStorage.setItem("appSettings", JSON.stringify(updatedSettings));

      // Apply theme and language immediately
      if (newSettings.theme) applyTheme(newSettings.theme);
      if (newSettings.language) applyLanguage(newSettings.language);

      // Save to API
      const token = localStorage.getItem("token");
      if (token) {
        try {
          await API.put("/app-settings", updatedSettings);
        } catch (error) {
          console.log("Could not save settings to API:", error);
        }
      }
    } catch (error) {
      console.error("Error updating settings:", error);
      throw error;
    }
  };

  const applyTheme = (theme) => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    
    if (theme === "auto") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.add(prefersDark ? "dark" : "light");
    } else {
      root.classList.add(theme);
    }
  };

  const applyLanguage = (language) => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  };

  const playNotification = () => {
    playNotificationSound(
      settings.sounds?.notifications?.enabled,
      settings.sounds?.notifications?.volume || 0.7
    );
  };

  const playMessage = () => {
    playMessageSound(
      settings.sounds?.messages?.enabled,
      settings.sounds?.messages?.volume || 0.7
    );
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        playNotification,
        playMessage,
        loading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

