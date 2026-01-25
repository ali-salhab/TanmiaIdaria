import AppSettings from "../models/AppSettings.js";
import { updateBackupJob } from "../services/backupScheduler.js";
// kkkk
export const getDropdownSettings = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    let settings = await AppSettings.findOne({ userId });

    if (!settings) {
      settings = new AppSettings({
        userId,
        dropdowns: {
          category: ["أولى", "تانية", "تالتة", "رابعة", "خامسة"],
          reason: ["زيادة أجر", "تجديد عقد", "تثبيت", "ترفيع"],
          document_type: ["مرسوم", "قرار"],
          incidentType: ["داخلي", "خارجي"],
        },
      });
      await settings.save();
    }

    res.json(settings.dropdowns);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch settings", error });
  }
};

export const saveDropdownSettings = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { category, reason, document_type } = req.body;

    let settings = await AppSettings.findOne({ userId });

    if (!settings) {
      settings = new AppSettings({
        userId,
        dropdowns: {
          category,
          reason,
          document_type,
        },
      });
    } else {
      settings.dropdowns = {
        category,
        reason,
        document_type,
      };
    }

    await settings.save();
    res.json({
      message: "Settings saved successfully",
      dropdowns: settings.dropdowns,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to save settings", error });
  }
};

export const getAppSettings = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    let settings = await AppSettings.findOne({ userId });

    if (!settings) {
      settings = new AppSettings({
        userId,
        theme: "light",
        language: "ar",
        sounds: {
          notifications: { enabled: true, volume: 0.7 },
          messages: { enabled: true, volume: 0.7 },
        },
      });
      await settings.save();
    }

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch app settings", error });
  }
};

export const updateAppSettings = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { theme, language, sounds, dropdowns, backupSettings } = req.body;

    let settings = await AppSettings.findOne({ userId });

    if (!settings) {
      settings = new AppSettings({ userId });
    }

    if (theme !== undefined) settings.theme = theme;
    if (language !== undefined) settings.language = language;
    if (sounds !== undefined) settings.sounds = sounds;
    if (dropdowns !== undefined) settings.dropdowns = dropdowns;
    if (backupSettings !== undefined) settings.backupSettings = backupSettings;

    await settings.save();

    // If backup settings were updated, refresh the scheduler
    if (backupSettings !== undefined) {
      await updateBackupJob();
    }

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: "Failed to update settings", error });
  }
};
