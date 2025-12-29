import Penalty from "../models/Penalty.js";

export const getPenalties = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const penalties = await Penalty.find({ employee: employeeId }).sort({
      date: -1,
    });
    res.status(200).json(penalties);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createPenalty = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { type, reason, date, decisionNumber } = req.body;
    const file = req.file ? req.file.path : null;

    const newPenalty = new Penalty({
      employee: employeeId,
      type,
      reason,
      date,
      decisionNumber,
      file,
      createdBy: req.user.userId,
    });

    await newPenalty.save();
    res.status(201).json(newPenalty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePenalty = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, reason, date, decisionNumber } = req.body;
    const updateData = { type, reason, date, decisionNumber };

    if (req.file) {
      updateData.file = req.file.path;
    }

    const updatedPenalty = await Penalty.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    res.status(200).json(updatedPenalty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deletePenalty = async (req, res) => {
  try {
    const { id } = req.params;
    await Penalty.findByIdAndDelete(id);
    res.status(200).json({ message: "Penalty deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
