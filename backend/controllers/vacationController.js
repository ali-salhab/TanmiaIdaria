import Vacation from "../models/Vacation.js";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";
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
    const { type, days, hours, endHour, childOrder, startDate } = req.body;

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
      endHour,
      childOrder: parsedChildOrder,
      startDate,
      endDate: end,
    });

    // Deduct from administrative leave balance if applicable
    // For hourly leave, calculatedDays is already (hours / 8)
    if (
      (type === "إجازة إدارية" || type === "إجازة ساعية") &&
      calculatedDays > 0
    ) {
      await Employee.findByIdAndUpdate(req.params.id, {
        $inc: { administrativeLeaveBalance: -calculatedDays },
      });
    }

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
    const { type, days, hours, endHour, childOrder, startDate } = req.body;

    const vacation = await Vacation.findById(req.params.id);
    if (!vacation)
      return res.status(404).json({ message: "Vacation not found" });

    vacation.type = type ?? vacation.type;
    vacation.days = days ?? vacation.days;
    vacation.hours = hours ?? vacation.hours;
    vacation.endHour = endHour ?? vacation.endHour;
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

// Generate PDF for vacation
export const generateVacationPDF = async (req, res) => {
  try {
    const { vacationId } = req.params;
    const vacation = await Vacation.findById(vacationId);
    if (!vacation)
      return res.status(404).json({ message: "Vacation not found" });

    const employee = await Employee.findById(vacation.employeeId);
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    const doc = new PDFDocument({ size: "A4", margin: 50 });

    // Set headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    const encodedName = encodeURIComponent(employee.fullName);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodedName}-vacation.pdf`
    );

    doc.pipe(res);

    // Load Arabic Font
    const fontPath = path.join(__dirname, "../fonts/Amiri-Regular.ttf");
    const fontBoldPath = path.join(__dirname, "../fonts/Amiri-Bold.ttf");

    // Page Border
    doc.rect(20, 20, 555, 802).lineWidth(2).stroke();
    doc.rect(25, 25, 545, 792).lineWidth(0.5).stroke(); // Double border

    // Header Text (Right Aligned)
    doc.font(fontBoldPath).fontSize(14);
    const headerY = 40; // Moved up

    // Align to the right side
    // A4 width is ~595pt. We want to align to the right margin (approx 550).
    // We set a width and x such that x + width = right_edge.
    const rightEdge = 550;
    const textWidth = 300;
    const textX = rightEdge - textWidth;

    const headerOptions = {
      align: "right",
      features: ["rtla"],
      width: textWidth,
    };

    doc.text("الجمهورية العربية السورية", textX, headerY, headerOptions);
    doc.text(
      "وزارة الإدارة المحلية والبيئة",
      textX,
      headerY + 25,
      headerOptions
    );
    doc.text("محافظة طرطوس", textX, headerY + 50, headerOptions);
    doc.text("الأمانة العامة", textX, headerY + 75, headerOptions);

    // Logo (Try multiple options)
    const logoOptions = ["syria-logo.png", "logo.png", "eagle-logo.png"];
    let logoLoaded = false;

    for (const logoName of logoOptions) {
      if (logoLoaded) break;
      const logoPath = path.join(__dirname, "../../frontend/public", logoName);
      if (fs.existsSync(logoPath)) {
        try {
          // Position logo on the left side
          doc.image(logoPath, 60, 40, { width: 100 });
          logoLoaded = true;
        } catch (e) {
          console.error(`Failed to load logo ${logoName}:`, e.message);
        }
      }
    }

    // Title
    doc.moveDown(2);
    doc
      .font(fontBoldPath)
      .fontSize(24)
      .text("طلب إجازة", 100, 150, { align: "center", features: ["rtla"] });

    // QR Code Generation
    try {
      const qrData = `الاسم: ${employee.fullName}\nنوع الإجازة: ${
        vacation.type
      }\nتاريخ البدء: ${new Date(vacation.startDate).toLocaleDateString(
        "en-GB"
      )}\nالمدة: ${vacation.days} يوم`;
      const qrBuffer = await QRCode.toBuffer(qrData);
      doc.image(qrBuffer, 50, 650, { width: 80 }); // Bottom left
    } catch (qrError) {
      console.error("Error generating QR Code:", qrError);
    }

    // Content Box
    const startY = 240;

    // Helper for fields
    const drawField = (label, value, y, isLtr = false) => {
      // Label
      doc
        .font(fontBoldPath)
        .fontSize(14)
        .text(label, 400, y, {
          align: "right",
          width: 130,
          features: ["rtla"],
        });

      // Value
      const valueOptions = {
        align: "right",
        width: 340,
      };

      if (!isLtr) {
        valueOptions.features = ["rtla"];
      }

      doc
        .font(fontPath)
        .fontSize(14)
        .text(value || "...........................", 50, y, valueOptions);
    };

    drawField("الاسم الثلاثي:", employee.fullName, startY);
    drawField("الرقم الذاتي:", employee.selfNumber, startY + 40);
    drawField("المسمى الوظيفي:", employee.currentJobTitle, startY + 80);
    drawField(
      "المديرية / الدائرة:",
      employee.level4 || employee.level3 || employee.department,
      startY + 120
    );

    // Vacation Info Section
    const vacY = startY + 180;

    // Section Title
    doc
      .font(fontBoldPath)
      .fontSize(16)
      .text("تفاصيل الإجازة", 0, vacY, { align: "center", features: ["rtla"] });

    drawField("نوع الإجازة:", vacation.type, vacY + 50);

    if (vacation.type === "إجازة ساعية") {
      drawField("عدد الساعات:", `${vacation.hours} ساعة`, vacY + 90);
    } else {
      drawField("عدد الأيام:", `${vacation.days} يوم`, vacY + 90);
    }

    // Format dates as DD/MM/YYYY
    const formatDate = (d) => {
      const date = new Date(d);
      return `${date.getDate().toString().padStart(2, "0")}/${(
        date.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}/${date.getFullYear()}`;
    };

    const sDate = formatDate(vacation.startDate);
    const eDate = formatDate(vacation.endDate);

    drawField("تاريخ البدء:", sDate, vacY + 130, true);

    if (vacation.type !== "إجازة ساعية") {
      drawField("تاريخ الانتهاء:", eDate, vacY + 170, true);
    } else if (vacation.endHour) {
      // Optional: Show end hour if available, though prompt said "no end date"
      // The prompt said "specify end hour" (input) and "in printed file specify number of hours... and no end date".
      // It didn't explicitly say "print end hour", but usually for hourly leave you want to know when it ends.
      // I'll add it as "ساعة النهاية" just in case, or stick to strict instructions.
      // "specify number of hours not days and there should be no end date"
      // I will skip end date. I will add end hour if it exists because it's useful context.
      drawField("ساعة النهاية:", vacation.endHour, vacY + 170, true);
    }

    // Signatures
    const sigY = 700;
    doc.font(fontBoldPath).fontSize(14);

    doc.text("توقيع الموظف", 400, sigY, {
      align: "center",
      width: 100,
      features: ["rtla"],
    });
    doc.text("المدير المباشر", 225, sigY, {
      align: "center",
      width: 100,
      features: ["rtla"],
    });
    doc.text("الموافق", 50, sigY, {
      align: "center",
      width: 100,
      features: ["rtla"],
    });

    doc.end();
  } catch (err) {
    console.error("PDF Generation Error:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: err.message });
    }
  }
};

// Generate Vacation Statement PDF (Statement of Status)
export const generateVacationStatementPDF = async (req, res) => {
  try {
    const { id } = req.params; // Employee ID
    const employee = await Employee.findById(id);
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    const vacations = await Vacation.find({ employeeId: id }).sort({
      startDate: 1,
    });

    // Calculate Balances
    const getServiceYears = () => {
      if (!employee.hiringDate) return 0;
      const hireDate = new Date(employee.hiringDate);
      const today = new Date();
      const diffTime = Math.abs(today - hireDate);
      return Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));
    };

    const years = getServiceYears();
    let entitlement = 15;
    if (years >= 20) entitlement = 30;
    else if (years >= 10) entitlement = 26;
    else if (years >= 5) entitlement = 21;

    const adminTotal = vacations
      .filter((v) => v.type === "إجازة إدارية")
      .reduce((acc, curr) => acc + (curr.days || 0), 0);

    const hourlyTotal = vacations
      .filter((v) => v.type === "إجازة ساعية")
      .reduce((acc, curr) => acc + (curr.hours || 0), 0);

    const hourlyDays = Math.floor(hourlyTotal / 8);
    const totalAdminUsed = adminTotal + hourlyDays;
    const remainingAdmin = Math.max(0, entitlement - totalAdminUsed);

    const healthTotal = vacations
      .filter((v) => v.type === "إجازة صحية")
      .reduce((acc, curr) => acc + (curr.days || 0), 0);
    const remainingHealth = Math.max(0, 180 - healthTotal);

    // Create PDF
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    res.setHeader("Content-Type", "application/pdf");
    const encodedName = encodeURIComponent(employee.fullName);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodedName}-statement.pdf`
    );
    doc.pipe(res);

    const fontPath = path.join(__dirname, "../fonts/Amiri-Regular.ttf");
    const fontBoldPath = path.join(__dirname, "../fonts/Amiri-Bold.ttf");

    // Header (Same as generateVacationPDF)
    doc.font(fontBoldPath).fontSize(14);
    const headerY = 40;
    const rightEdge = 550;
    const textWidth = 300;
    const textX = rightEdge - textWidth;
    const headerOptions = {
      align: "right",
      features: ["rtla"],
      width: textWidth,
    };

    doc.text("الجمهورية العربية السورية", textX, headerY, headerOptions);
    doc.text(
      "وزارة الإدارة المحلية والبيئة",
      textX,
      headerY + 25,
      headerOptions
    );
    doc.text("محافظة طرطوس", textX, headerY + 50, headerOptions);
    doc.text("الأمانة العامة", textX, headerY + 75, headerOptions);

    // Logo
    const logoOptions = ["syria-logo.png", "logo.png", "eagle-logo.png"];
    let logoLoaded = false;
    for (const logoName of logoOptions) {
      if (logoLoaded) break;
      const logoPath = path.join(__dirname, "../../frontend/public", logoName);
      if (fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, 60, 40, { width: 100 });
          logoLoaded = true;
        } catch (e) {}
      }
    }

    // Title
    // doc.moveDown(;
    doc
      .font(fontBoldPath)
      .fontSize(24)
      .text("بيان وضع إجازات", 10, 160, {
        align: "center",
        features: ["rtla"],
      });

    // Info Box
    const boxY = 200;
    // doc.rect(50, boxY, 495, 100).stroke();

    doc.fontSize(14);

    doc.text(`اسم الموظف: ${employee.fullName}`, 50, boxY + 20, {
      align: "right",
      width: 470,
      features: ["rtla"],
    });
    doc.text(`الرصيد الإداري المتبقي: ${remainingAdmin} يوم`, 50, boxY + 50, {
      align: "right",
      width: 470,
      features: ["rtla"],
    });
    doc.text(`الرصيد الصحي المتبقي: ${remainingHealth} يوم`, 50, boxY + 80, {
      align: "right",
      width: 470,
      features: ["rtla"],
    });

    // Table
    const tableY = 355;
    const rowHeight = 40; // Increased height for better padding

    // Header Row
    doc.font(fontBoldPath).fontSize(12);
    doc.rect(50, tableY, 495, rowHeight).fill("#f0f0f0").stroke();
    doc.fillColor("black");

    const drawCell = (text, x, y, w, align = "center") => {
      doc.text(text, x, y + 12, { width: w, align: align, features: ["rtla"] }); // Adjusted Y padding
    };

    drawCell("نوع الإجازة", 400, tableY, 145);
    drawCell("المدة", 300, tableY, 100);
    drawCell("تاريخ البدء", 200, tableY, 100);
    drawCell("ملاحظات", 50, tableY, 150);

    // Data Rows
    let currentY = tableY + rowHeight;
    doc.font(fontPath);

    // Date formatter
    const formatDate = (d) => {
      const date = new Date(d);
      return `${date.getDate().toString().padStart(2, "0")}/${(
        date.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}/${date.getFullYear()}`;
    };

    vacations.forEach((v) => {
      doc.rect(50, currentY, 495, rowHeight).stroke();

      drawCell(v.type, 400, currentY, 145);
      drawCell(
        v.days ? v.days.toString() : v.hours ? `${v.hours} ساعة` : "-",
        300,
        currentY,
        100
      );

      const dateStr = formatDate(v.startDate);
      doc.text(dateStr, 200, currentY + 12, { width: 100, align: "center" });

      drawCell(v.notes || "-", 50, currentY, 150);

      currentY += rowHeight;

      // Page break check
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }
    });

    // Signatures
    let sigY = currentY + 50;
    if (sigY > 700) {
      doc.addPage();
      sigY = 50;
    }

    doc.font(fontBoldPath).fontSize(14);
    doc.text("توقيع الموظف المختص", 50, sigY, {
      align: "left",
      features: ["rtla"],
    });
    doc.text("توقيع المدير المباشر", 400, sigY, {
      align: "right",
      features: ["rtla"],
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
