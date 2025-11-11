import Vacation from "../models/Vacation.js";

// Get all vacations for one employee
export const getVacationsByEmployee = async (req, res) => {
  try {
    const vacations = await Vacation.find({ employeeId: req.params.id });
    res.json(vacations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Add a new vacation
export const addVacation = async (req, res) => {
  try {
    const { type, days, hours, childOrder, startDate } = req.body;

    // Logic for automatic limits (optional business rules)
    let calculatedDays = days;

    if (type === "إجازة أمومة") {
      if (childOrder === 1) calculatedDays = 120;
      else if (childOrder === 2) calculatedDays = 90;
      else if (childOrder === 3) calculatedDays = 75;
    }

    if (type === "إجازة ساعية" && hours) {
      calculatedDays = hours / 8; // 8 hours = 1 day
    }

    const vacation = await Vacation.create({
      employeeId: req.params.id,
      type,
      days: calculatedDays,
      hours,
      childOrder,
      startDate,
    });

    res.status(201).json(vacation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update vacation
export const updateVacation = async (req, res) => {
  try {
    const { type, days, hours, childOrder, startDate } = req.body;

    const vacation = await Vacation.findById(req.params.id);
    if (!vacation)
      return res.status(404).json({ message: "Vacation not found" });

    vacation.type = type ?? vacation.type;
    vacation.days = days ?? vacation.days;
    vacation.hours = hours ?? vacation.hours;
    vacation.childOrder = childOrder ?? vacation.childOrder;
    vacation.startDate = startDate ?? vacation.startDate;

    await vacation.save();
    res.json(vacation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete vacation
export const deleteVacation = async (req, res) => {
  try {
    const vacation = await Vacation.findByIdAndDelete(req.params.id);
    if (!vacation)
      return res.status(404).json({ message: "Vacation not found" });
    res.json({ message: "Vacation deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
