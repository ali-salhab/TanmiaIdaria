import express from "express";
import DropdownOption from "../models/DropdownOption.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, async (req, res) => {
  try {
    const options = await DropdownOption.find();
    res.json(options);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:dropdownId", protect, async (req, res) => {
  try {
    let option = await DropdownOption.findOne({
      dropdownId: req.params.dropdownId,
    });
    
    // If dropdown doesn't exist, create it with default options from query params
    if (!option) {
      const { label, options: defaultOptions } = req.query;
      
      // If no default options provided, return empty dropdown structure
      if (!defaultOptions) {
        return res.json({
          dropdownId: req.params.dropdownId,
          label: label || req.params.dropdownId,
          options: [],
          defaultOptions: [],
        });
      }
      
      // Parse options if provided as JSON string
      let parsedOptions = [];
      try {
        parsedOptions = JSON.parse(decodeURIComponent(defaultOptions));
      } catch {
        parsedOptions = Array.isArray(defaultOptions) ? defaultOptions : [];
      }
      
      option = new DropdownOption({
        dropdownId: req.params.dropdownId,
        label: label || req.params.dropdownId,
        options: parsedOptions.map((opt, idx) => ({
          value: opt.value || opt,
          label: opt.label || opt,
          visible: true,
          order: idx,
        })),
        defaultOptions: parsedOptions.map(opt => ({
          value: opt.value || opt,
          label: opt.label || opt,
        })),
      });
      
      await option.save();
    }
    
    res.json(option);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", protect, async (req, res) => {
  const { dropdownId, label, options, defaultOptions } = req.body;

  const dropdownOption = new DropdownOption({
    dropdownId,
    label,
    options: (options || []).map((opt, idx) => ({
      ...opt,
      order: idx,
      visible: opt.visible !== false,
    })),
    defaultOptions: defaultOptions || options || [],
  });

  try {
    const newOption = await dropdownOption.save();
    res.status(201).json(newOption);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/:dropdownId", protect, async (req, res) => {
  try {
    const option = await DropdownOption.findOne({
      dropdownId: req.params.dropdownId,
    });

    if (!option) {
      return res.status(404).json({ message: "Dropdown option not found" });
    }

    if (req.body.options) {
      option.options = req.body.options.map((opt, idx) => ({
        ...opt,
        order: idx,
      }));
    }
    if (req.body.label) option.label = req.body.label;
    if (req.body.defaultOptions) option.defaultOptions = req.body.defaultOptions;

    const updatedOption = await option.save();
    res.json(updatedOption);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:dropdownId", protect, async (req, res) => {
  try {
    const option = await DropdownOption.findOneAndDelete({
      dropdownId: req.params.dropdownId,
    });
    if (!option) {
      return res.status(404).json({ message: "Dropdown option not found" });
    }
    res.json({ message: "Dropdown option deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/:dropdownId/reset", protect, async (req, res) => {
  try {
    const option = await DropdownOption.findOne({
      dropdownId: req.params.dropdownId,
    });

    if (!option) {
      return res.status(404).json({ message: "Dropdown option not found" });
    }

    option.options = option.defaultOptions.map((opt, idx) => ({
      ...opt,
      visible: true,
      order: idx,
    }));

    const updatedOption = await option.save();
    res.json(updatedOption);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/:dropdownId/options", protect, async (req, res) => {
  try {
    const { label, value } = req.body;
    
    if (!label || !value) {
      return res.status(400).json({ message: "Label and value are required" });
    }

    const option = await DropdownOption.findOne({
      dropdownId: req.params.dropdownId,
    });

    if (!option) {
      return res.status(404).json({ message: "Dropdown option not found" });
    }

    const optionExists = option.options.some(opt => opt.value === value);
    if (optionExists) {
      return res.status(400).json({ message: "Option with this value already exists" });
    }

    const newOpt = {
      label,
      value,
      visible: true,
      order: option.options.length,
    };

    option.options.push(newOpt);
    option.defaultOptions.push({ label, value });
    
    const updatedOption = await option.save();
    res.status(201).json(updatedOption);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/:dropdownId/options/:optionValue", protect, async (req, res) => {
  try {
    const { label } = req.body;
    
    if (!label) {
      return res.status(400).json({ message: "Label is required" });
    }

    const option = await DropdownOption.findOne({
      dropdownId: req.params.dropdownId,
    });

    if (!option) {
      return res.status(404).json({ message: "Dropdown option not found" });
    }

    const optIndex = option.options.findIndex(opt => opt.value === req.params.optionValue);
    if (optIndex === -1) {
      return res.status(404).json({ message: "Option not found" });
    }

    option.options[optIndex].label = label;
    
    const defaultOptIndex = option.defaultOptions.findIndex(opt => opt.value === req.params.optionValue);
    if (defaultOptIndex !== -1) {
      option.defaultOptions[defaultOptIndex].label = label;
    }

    const updatedOption = await option.save();
    res.json(updatedOption);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:dropdownId/options/:optionValue", protect, async (req, res) => {
  try {
    const option = await DropdownOption.findOne({
      dropdownId: req.params.dropdownId,
    });

    if (!option) {
      return res.status(404).json({ message: "Dropdown option not found" });
    }

    const optIndex = option.options.findIndex(opt => opt.value === req.params.optionValue);
    if (optIndex === -1) {
      return res.status(404).json({ message: "Option not found" });
    }

    option.options.splice(optIndex, 1);
    option.defaultOptions = option.defaultOptions.filter(opt => opt.value !== req.params.optionValue);
    
    const updatedOption = await option.save();
    res.json(updatedOption);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
