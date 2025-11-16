import HomepageSettings from "../models/HomepageSettings.js";
import User from "../models/User.js";

export const getHomepageSettings = async (req, res) => {
  try {
    const { userId } = req.params;
    const settings = await HomepageSettings.findOne({ userId });
    
    if (!settings) {
      return res.status(404).json({ 
        message: "Homepage settings not found",
        settings: null 
      });
    }
    
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getMyHomepageSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const settings = await HomepageSettings.findOne({ userId });
    
    if (!settings) {
      return res.status(404).json({ 
        message: "Homepage settings not found",
        settings: null 
      });
    }
    
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createHomepageSettings = async (req, res) => {
  try {
    const { userId, widgets, layout, columns } = req.body;
    
    const exists = await HomepageSettings.findOne({ userId });
    if (exists) {
      return res.status(400).json({ message: "Settings already exist for this user" });
    }
    
    const settings = new HomepageSettings({
      userId,
      widgets,
      layout,
      columns,
    });
    
    const savedSettings = await settings.save();
    res.status(201).json({ message: "Settings created", settings: savedSettings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateHomepageSettings = async (req, res) => {
  try {
    const { userId } = req.params;
    const { widgets, layout, columns } = req.body;
    
    const settings = await HomepageSettings.findOneAndUpdate(
      { userId },
      { widgets, layout, columns },
      { new: true }
    );
    
    if (!settings) {
      return res.status(404).json({ message: "Settings not found" });
    }
    
    res.json({ message: "Settings updated", settings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateMyHomepageSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { widgets, layout, columns } = req.body;
    
    let settings = await HomepageSettings.findOne({ userId });
    
    if (!settings) {
      settings = new HomepageSettings({
        userId,
        widgets,
        layout,
        columns,
      });
      const savedSettings = await settings.save();
      return res.json({ message: "Settings created", settings: savedSettings });
    }
    
    settings.widgets = widgets || settings.widgets;
    settings.layout = layout || settings.layout;
    settings.columns = columns || settings.columns;
    
    const updatedSettings = await settings.save();
    res.json({ message: "Settings updated", settings: updatedSettings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteHomepageSettings = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const settings = await HomepageSettings.findOneAndDelete({ userId });
    
    if (!settings) {
      return res.status(404).json({ message: "Settings not found" });
    }
    
    res.json({ message: "Settings deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
