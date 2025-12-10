import Course from "../models/Course.js";

export const getCourses = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const courses = await Course.find({ employee: employeeId }).sort({
      startDate: -1,
    });
    res.status(200).json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createCourse = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { name, duration, startDate } = req.body;
    const file = req.file ? req.file.path : null;

    const newCourse = new Course({
      employee: employeeId,
      name,
      duration,
      startDate,
      file,
      createdBy: req.user.userId,
    });

    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    await Course.findByIdAndDelete(id);
    res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
