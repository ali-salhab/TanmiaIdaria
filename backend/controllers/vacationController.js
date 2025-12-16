import Vacation from "../models/Vacation.js";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  Header,
  HeadingLevel,
  Footer,
  VerticalAlign,
  ImageRun,
} from "docx";
import fs from "fs";
import path from "path";

import { fileURLToPath } from "url";
import Employee from "../models/Employee.js";
import { notifyAdmin } from "../services/notificationService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all vacations for one employee
export const getVacationsByEmployee = async (req, res) => {
  try {
    const vacations = await Vacation.find({ employeeId: req.params.id });
    console.log("Vacations fetched:", vacations);
    res.json(vacations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Placeholder for Word export with proper route name; old copy removed to avoid duplicate identifier

// Generate Word document for vacations
// export const generateVacationDocument = async (req, res) => {
//   try {
//     const { id } = req.params;

//     const vacations = await Vacation.find({ employeeId: id });
//     const employee = await Employee.findById(id);

//     if (!employee) {
//       return res.status(404).json({ message: "Employee not found" });
//     }

//     const tableRows = [
//       new TableRow({
//         cells: [
//           new TableCell({
//             children: [
//               new Paragraph({
//                 text: "الترتيب",
//                 bold: true,
//                 alignment: AlignmentType.CENTER,
//               }),
//             ],
//             shading: { fill: "D3D3D3" },
//             verticalAlign: VerticalAlign.CENTER,
//           }),
//           new TableCell({
//             children: [
//               new Paragraph({
//                 text: "نوع الإجازة",
//                 bold: true,
//                 alignment: AlignmentType.CENTER,
//               }),
//             ],
//             shading: { fill: "D3D3D3" },
//             verticalAlign: VerticalAlign.CENTER,
//           }),
//           new TableCell({
//             children: [
//               new Paragraph({
//                 text: "عدد الأيام",
//                 bold: true,
//                 alignment: AlignmentType.CENTER,
//               }),
//             ],
//             shading: { fill: "D3D3D3" },
//             verticalAlign: VerticalAlign.CENTER,
//           }),
//           new TableCell({
//             children: [
//               new Paragraph({
//                 text: "تاريخ البداية",
//                 bold: true,
//                 alignment: AlignmentType.CENTER,
//               }),
//             ],
//             shading: { fill: "D3D3D3" },
//             verticalAlign: VerticalAlign.CENTER,
//           }),
//         ],
//         height: { value: 400, rule: "atLeast" },
//       }),
//     ];

//     vacations.forEach((vacation, index) => {
//       tableRows.push(
//         new TableRow({
//           cells: [
//             new TableCell({
//               children: [
//                 new Paragraph({
//                   text: String(index + 1),
//                   alignment: AlignmentType.CENTER,
//                 }),
//               ],
//             }),
//             new TableCell({
//               children: [
//                 new Paragraph({
//                   text: vacation.type || "",
//                   alignment: AlignmentType.CENTER,
//                 }),
//               ],
//             }),
//             new TableCell({
//               children: [
//                 new Paragraph({
//                   text: String(vacation.days || 0),
//                   alignment: AlignmentType.CENTER,
//                 }),
//               ],
//             }),
//             new TableCell({
//               children: [
//                 new Paragraph({
//                   text: vacation.startDate?.split("T")[0] || "",
//                   alignment: AlignmentType.CENTER,
//                 }),
//               ],
//             }),
//           ],
//         })
//       );
//     });

//     const doc = new Document({
//       sections: [
//         {
//           children: [
//             new Paragraph({
//               text: "إجازات الموظف",
//               bold: true,
//               size: 32,
//               alignment: AlignmentType.CENTER,
//               spacing: { after: 200 },
//             }),
//             new Paragraph({
//               text: `الموظف: ${employee.fullName}`,
//               size: 24,
//               alignment: AlignmentType.RIGHT,
//               spacing: { after: 100 },
//             }),
//             new Paragraph({
//               text: `رقم الموظف: ${employee._id}`,
//               size: 24,
//               alignment: AlignmentType.RIGHT,
//               spacing: { after: 300 },
//             }),
//             new Table({
//               width: { size: 100, type: WidthType.PERCENTAGE },
//               rows: tableRows,
//             }),
//           ],
//         },
//       ],
//     });

//     const safeName = employee.fullName.replace(/[<>:"/\\|?*]+/g, "_");
//     const outputPath = path.join(__dirname, `إجازات_${safeName}.docx`);

//     const buffer = await Packer.toBuffer(doc);
//     fs.writeFileSync(outputPath, buffer);

//     res.download(outputPath, (err) => {
//       if (err) console.error("Download error:", err);
//       fs.unlinkSync(outputPath);
//     });
//   } catch (error) {
//     console.error("Error generating vacation document:", error);
//     res.status(500).json({ message: "Server error while generating document" });
//   }
// };

// Add a new vacation
export const addVacation = async (req, res) => {
  try {
    const { type, days, hours, childOrder, startDate } = req.body;

    // Normalize numeric inputs to avoid cast errors on empty strings
    const parsedHours =
      hours === "" || hours === null ? undefined : Number(hours);
    const parsedDays = days === "" || days === null ? undefined : Number(days);
    const parsedChildOrder =
      childOrder === "" || childOrder === null || childOrder === undefined
        ? undefined
        : Number(childOrder);

    // Logic for automatic limits (optional business rules)
    let calculatedDays = parsedDays;

    if (type === "إجازة أمومة") {
      if (parsedChildOrder === 1) calculatedDays = 120;
      else if (parsedChildOrder === 2) calculatedDays = 90;
      else if (parsedChildOrder === 3) calculatedDays = 75;
    }

    if (type === "إجازة ساعية" && parsedHours) {
      calculatedDays = parsedHours / 8; // 8 hours = 1 day
    }

    // Calculate endDate
    const start = new Date(startDate);
    let end = new Date(startDate);

    if (type === "إجازة ساعية") {
      // For hourly vacation, end date is same as start date
      end = new Date(start);
    } else {
      const daysToAdd = Math.max(1, Math.ceil(calculatedDays || 0));
      end.setDate(start.getDate() + daysToAdd - 1);
    }

    const vacation = await Vacation.create({
      employeeId: req.params.id,
      type,
      days: calculatedDays,
      hours: parsedHours,
      childOrder: parsedChildOrder,
      startDate,
      endDate: end,
    });

    // Notify admin if action is performed by non-admin user
    if (req.user && req.user.role !== "admin") {
      // Get employee info for better notification context
      const employee = await Employee.findById(req.params.id);
      await notifyAdmin({
        actionBy: req.user._id,
        section: "vacations",
        action: "create",
        title: "تم إنشاء إجازة جديدة",
        message: `تم إنشاء إجازة جديدة للموظف: ${
          employee?.fullName || "غير محدد"
        }`,
        employeeName: employee?.fullName,
        department: employee?.level4 || employee?.currentJobTitle || null,
        io: req.io,
      });
    }

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

    // Notify admin if action is performed by non-admin user
    if (req.user && req.user.role !== "admin") {
      // Get employee info for better notification context
      const employee = await Employee.findById(vacation.employeeId);
      await notifyAdmin({
        actionBy: req.user._id,
        section: "vacations",
        action: "update",
        title: "تم تحديث بيانات إجازة",
        message: `تم تحديث بيانات الإجازة للموظف: ${
          employee?.fullName || "غير محدد"
        }`,
        employeeName: employee?.fullName,
        department: employee?.level4 || employee?.currentJobTitle || null,
        io: req.io,
      });
    }

    res.json(vacation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Log print action
export const logPrintAction = async (req, res) => {
  try {
    const { id } = req.params;
    const vacation = await Vacation.findById(id);

    if (!vacation) {
      return res.status(404).json({ message: "Vacation not found" });
    }

    // Notify admin if action is performed by non-admin user
    if (req.user && req.user.role !== "admin") {
      const employee = await Employee.findById(vacation.employeeId);
      await notifyAdmin({
        actionBy: req.user._id,
        section: "vacations",
        action: "print",
        title: "تم طباعة إجازة",
        message: `تم طباعة إجازة للموظف: ${employee?.fullName || "غير محدد"}`,
        employeeName: employee?.fullName,
        department: employee?.level4 || employee?.currentJobTitle || null,
        io: req.io,
      });
    }

    res.json({ message: "Print action logged" });
  } catch (err) {
    console.error("Error logging print action:", err);
    res.status(500).json({ message: err.message });
  }
};

export const generateSingleVacationTemplate = async (req, res) => {
  console.log("Generating single vacation template...");
  try {
    const { vacationId } = req.params;
    console.log("Vacation ID:", vacationId);

    const vacation = await Vacation.findById(vacationId);
    if (!vacation) {
      return res.status(404).json({ message: "الإجازة غير موجودة" });
    }

    const employee = await Employee.findById(vacation.employeeId);
    if (!employee) {
      return res.status(404).json({ message: "الموظف غير موجود" });
    }

    const startDate = new Date(vacation.startDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (vacation.days || 0));

    const formattedStartDate = startDate.toLocaleDateString("ar-EG");
    const formattedEndDate = endDate.toLocaleDateString("ar-EG");
    const currentDate = new Date().toLocaleDateString("ar-EG");

    const doc = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              text: "استمارة الإجازة السنوية",
              bold: true,
              size: 36,
              alignment: AlignmentType.CENTER,
              spacing: { after: 300 },
            }),

            new Paragraph({
              text: "─".repeat(80),
              alignment: AlignmentType.CENTER,
              spacing: { after: 300 },
            }),

            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  cells: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          text: "بيانات الموظف",
                          bold: true,
                          alignment: AlignmentType.CENTER,
                        }),
                      ],
                      shading: { fill: "4472C4" },
                      columnSpan: 2,
                    }),
                  ],
                }),
                new TableRow({
                  cells: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          text: "الاسم الكامل",
                          bold: true,
                          alignment: AlignmentType.RIGHT,
                        }),
                      ],
                      shading: { fill: "E7E6E6" },
                      width: { size: 30, type: WidthType.PERCENTAGE },
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          text: employee.fullName || "---",
                          alignment: AlignmentType.RIGHT,
                        }),
                      ],
                      width: { size: 70, type: WidthType.PERCENTAGE },
                    }),
                  ],
                }),
                new TableRow({
                  cells: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          text: "رقم الموظف",
                          bold: true,
                          alignment: AlignmentType.RIGHT,
                        }),
                      ],
                      shading: { fill: "E7E6E6" },
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          text: employee._id.toString().slice(-6) || "---",
                          alignment: AlignmentType.RIGHT,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableRow({
                  cells: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          text: "المسمى الوظيفي",
                          bold: true,
                          alignment: AlignmentType.RIGHT,
                        }),
                      ],
                      shading: { fill: "E7E6E6" },
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          text: employee.jobTitle || "---",
                          alignment: AlignmentType.RIGHT,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableRow({
                  cells: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          text: "القسم",
                          bold: true,
                          alignment: AlignmentType.RIGHT,
                        }),
                      ],
                      shading: { fill: "E7E6E6" },
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          text: employee.department || "---",
                          alignment: AlignmentType.RIGHT,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),

            new Paragraph({ text: "", spacing: { after: 300 } }),

            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  cells: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          text: "بيانات الإجازة",
                          bold: true,
                          alignment: AlignmentType.CENTER,
                        }),
                      ],
                      shading: { fill: "4472C4" },
                      columnSpan: 2,
                    }),
                  ],
                }),
                new TableRow({
                  cells: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          text: "نوع الإجازة",
                          bold: true,
                          alignment: AlignmentType.RIGHT,
                        }),
                      ],
                      shading: { fill: "E7E6E6" },
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          text: vacation.type || "---",
                          alignment: AlignmentType.RIGHT,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableRow({
                  cells: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          text: "تاريخ البداية",
                          bold: true,
                          alignment: AlignmentType.RIGHT,
                        }),
                      ],
                      shading: { fill: "E7E6E6" },
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          text: formattedStartDate,
                          alignment: AlignmentType.RIGHT,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableRow({
                  cells: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          text: "تاريخ النهاية",
                          bold: true,
                          alignment: AlignmentType.RIGHT,
                        }),
                      ],
                      shading: { fill: "E7E6E6" },
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          text: formattedEndDate,
                          alignment: AlignmentType.RIGHT,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableRow({
                  cells: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          text: "عدد الأيام",
                          bold: true,
                          alignment: AlignmentType.RIGHT,
                        }),
                      ],
                      shading: { fill: "E7E6E6" },
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          text: `${vacation.days || 0} أيام`,
                          alignment: AlignmentType.RIGHT,
                        }),
                      ],
                    }),
                  ],
                }),
                new TableRow({
                  cells: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          text: "الحالة",
                          bold: true,
                          alignment: AlignmentType.RIGHT,
                        }),
                      ],
                      shading: { fill: "E7E6E6" },
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          text: vacation.status || "معلقة",
                          alignment: AlignmentType.RIGHT,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),

            new Paragraph({ text: "", spacing: { after: 400 } }),

            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                new TableRow({
                  cells: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          text: "التوقيعات والموافقات",
                          bold: true,
                          alignment: AlignmentType.CENTER,
                        }),
                      ],
                      shading: { fill: "4472C4" },
                      columnSpan: 3,
                    }),
                  ],
                }),
                new TableRow({
                  cells: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          text: "المدير المباشر",
                          bold: true,
                          alignment: AlignmentType.CENTER,
                        }),
                      ],
                      shading: { fill: "E7E6E6" },
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          text: "مدير الموارد البشرية",
                          bold: true,
                          alignment: AlignmentType.CENTER,
                        }),
                      ],
                      shading: { fill: "E7E6E6" },
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          text: "الموظف",
                          bold: true,
                          alignment: AlignmentType.CENTER,
                        }),
                      ],
                      shading: { fill: "E7E6E6" },
                    }),
                  ],
                }),
                new TableRow({
                  height: { value: 1000, rule: "atLeast" },
                  cells: [
                    new TableCell({
                      children: [new Paragraph({ text: "" })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ text: "" })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ text: "" })],
                    }),
                  ],
                }),
                new TableRow({
                  cells: [
                    new TableCell({
                      children: [
                        new Paragraph({
                          text: "التاريخ: _________",
                          alignment: AlignmentType.CENTER,
                          size: 20,
                        }),
                      ],
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          text: "التاريخ: _________",
                          alignment: AlignmentType.CENTER,
                          size: 20,
                        }),
                      ],
                    }),
                    new TableCell({
                      children: [
                        new Paragraph({
                          text: "التاريخ: _________",
                          alignment: AlignmentType.CENTER,
                          size: 20,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),

            new Paragraph({ text: "", spacing: { after: 400 } }),

            new Paragraph({
              text: `تم إصدار هذه الاستمارة بتاريخ: ${currentDate}`,
              alignment: AlignmentType.CENTER,
              italics: true,
              size: 20,
              spacing: { after: 100 },
            }),

            new Paragraph({
              text: "───────────────────────────────────────",
              alignment: AlignmentType.CENTER,
              spacing: { after: 200 },
            }),
          ],
        },
      ],
    });

    const safeName = employee.fullName.replace(/[<>:"/\\|?*]+/g, "_");
    const outputPath = path.join(
      __dirname,
      `إجازة_${safeName}_${new Date().getTime()}.docx`
    );

    const buffer = await Packer.toBuffer(doc);
    fs.writeFileSync(outputPath, buffer);

    res.download(outputPath, (err) => {
      if (err) console.error("Download error:", err);
      fs.unlinkSync(outputPath);
    });
  } catch (error) {
    console.error("Error generating vacation template:", error);
    res
      .status(500)
      .json({ message: "خطأ في إنشاء استمارة الإجازة", error: error.message });
  }
};

// Delete vacation
export const deleteVacation = async (req, res) => {
  try {
    const vacation = await Vacation.findById(req.params.id);
    if (!vacation)
      return res.status(404).json({ message: "Vacation not found" });

    // Notify admin if action is performed by non-admin user
    if (req.user && req.user.role !== "admin") {
      // Get employee info for better notification context
      const employee = await Employee.findById(vacation.employeeId);
      await notifyAdmin({
        actionBy: req.user._id,
        section: "vacations",
        action: "delete",
        title: "تم حذف إجازة",
        message: `تم حذف الإجازة للموظف: ${employee?.fullName || "غير محدد"}`,
        employeeName: employee?.fullName,
        department: employee?.level4 || employee?.currentJobTitle || null,
        io: req.io,
      });
    }

    await Vacation.findByIdAndDelete(req.params.id);
    res.json({ message: "Vacation deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
