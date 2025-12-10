import Employee from "../models/Employee.js";
import Circular from "../models/Circular.js";
import User from "../models/User.js";
import Incident from "../models/Incident.js";

export const globalSearch = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    const regex = new RegExp(query, "i"); // Case-insensitive search

    // Search Employees
    const employeesPromise = Employee.find({
      $or: [
        { fullName: regex },
        { firstName: regex },
        { lastName: regex },
        { nationalId: regex },
        { selfNumber: regex },
        { currentJobTitle: regex },
      ],
    })
      .select("fullName currentJobTitle _id")
      .limit(5);

    // Search Circulars
    const circularsPromise = Circular.find({
      $or: [{ title: regex }, { content: regex }],
    })
      .select("title _id")
      .limit(5);

    // Search Users
    const usersPromise = User.find({
      username: regex,
    })
      .select("username _id")
      .limit(5);

    // Search Incidents
    const incidentsPromise = Incident.find({
      $or: [{ reason: regex }, { document_number: regex }],
    })
      .populate("employee", "fullName")
      .select("reason document_number employee _id")
      .limit(5);

    const [employees, circulars, users, incidents] = await Promise.all([
      employeesPromise,
      circularsPromise,
      usersPromise,
      incidentsPromise,
    ]);

    res.status(200).json({
      employees,
      circulars,
      users,
      incidents,
    });
  } catch (error) {
    console.error("Global search error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
