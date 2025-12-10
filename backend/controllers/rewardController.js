import Reward from "../models/Reward.js";

export const getRewards = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const rewards = await Reward.find({ employee: employeeId }).sort({
      date: -1,
    });
    res.status(200).json(rewards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createReward = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { type, description, date } = req.body;
    const file = req.file ? req.file.path : null;

    const newReward = new Reward({
      employee: employeeId,
      type,
      description,
      date,
      file,
      createdBy: req.user.userId,
    });

    await newReward.save();
    res.status(201).json(newReward);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteReward = async (req, res) => {
  try {
    const { id } = req.params;
    await Reward.findByIdAndDelete(id);
    res.status(200).json({ message: "Reward deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
