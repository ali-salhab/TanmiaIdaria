import Incident from "../models/Incident.js";

export const createIncident = async (req, res) => {
  try {
    const incident = await Incident.create(req.body);
    res.status(201).json(incident);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getIncidentsByEmployee = async (req, res) => {
  try {
    const incidents = await Incident.find({
      employee: req.params.employeeId,
    }).sort({ start_date: 1 });
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
export const deleteIncident = async (req, res) => {
  try {
    console.log(req.params.id);

    const incident = await Incident.find({ _id: req.params.id });
    console.log(incident);
    if (!incident) {
      console.log("==============if======================");

      return res.status(404).send({ message: "content not found" });
    } else {
      console.log("================else====================");

      const res = await Incident.deleteOne({ _id: req.params.id });
      console.log(res);
      return res.send({ res });
    }

    res.send({ message: "erroe" });
  } catch (error) {}
};
export const updateIncident = async (req, res) => {
  console.log("====================================");
  console.log(req.body);
  console.log("====================================");
  try {
  } catch (error) {}
};
