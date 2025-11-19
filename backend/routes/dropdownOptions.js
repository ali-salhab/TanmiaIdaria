import express from "express";
import DropdownOption from "../models/DropdownOption.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const options = await DropdownOption.find();
    res.json(options);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:dropdownId", async (req, res) => {
  try {
    const option = await DropdownOption.findOne({
      dropdownId: req.params.dropdownId,
    });
    if (!option) {
      return res.status(404).json({ message: "Dropdown option not found" });
    }
    res.json(option);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
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

router.put("/:dropdownId", async (req, res) => {
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

router.delete("/:dropdownId", async (req, res) => {
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

router.post("/:dropdownId/reset", async (req, res) => {
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

router.post("/:dropdownId/options", async (req, res) => {
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

router.put("/:dropdownId/options/:optionValue", async (req, res) => {
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

router.delete("/:dropdownId/options/:optionValue", async (req, res) => {
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
