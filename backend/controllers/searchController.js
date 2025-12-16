import Employee from "../models/Employee.js";
import Circular from "../models/Circular.js";
import User from "../models/User.js";
import Incident from "../models/Incident.js";
import Vacation from "../models/Vacation.js";
import FileShare from "../models/FileShare.js";

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

    // Search Vacations (by type or employee name via lookup if needed, but simple type search for now)
    // Searching vacations by type isn't very useful if we don't know the employee.
    // Let's search vacations where the type matches.
    const vacationsPromise = Vacation.find({
      type: regex,
    })
      .populate("employeeId", "fullName")
      .select("type startDate employeeId _id")
      .limit(5);

    // Search Documents (FileShare)
    const documentsPromise = FileShare.find({
      $or: [{ fileName: regex }, { message: regex }],
    })
      .populate("sender", "username")
      .select("fileName message sender _id")
      .limit(5);

    const [employees, circulars, users, incidents, vacations, documents] =
      await Promise.all([
        employeesPromise,
        circularsPromise,
        usersPromise,
        incidentsPromise,
        vacationsPromise,
        documentsPromise,
      ]);

    res.status(200).json({
      employees,
      circulars,
      users,
      incidents,
      vacations,
      documents,
    });
  } catch (error) {
    console.error("Global search error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
