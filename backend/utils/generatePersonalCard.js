import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  AlignmentType,
  WidthType,
  BorderStyle,
} from "docx";
import fs from "fs";
import path from "path";

export async function generatePersonalCard(employee, incidents) {
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        children: [
          // العنوان
          new Paragraph({
            children: [
              new TextRun({
                text: "البطاقة الذاتية",
                bold: true,
                size: 36,
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),

          new Paragraph({ text: "" }),

          // جدول البيانات الشخصية
          createPersonalTable(employee),

          new Paragraph({
            children: [
              new TextRun({
                text: "الوضع الوظيفي",
                bold: true,
                size: 30,
              }),
            ],
            alignment: AlignmentType.CENTER,
          }),

          // جدول الوقوعات
          createIncidentsTable(incidents),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join("exports", `بطاقة_${employee.first_name}.docx`);
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
}

// جدول المعلومات الشخصية
function createPersonalTable(e) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          cell("الاسم والنسبة", e.full_name),
          cell("اسم الأب", e.father_name),
          cell("اسم الأم", e.mother_name),
        ],
      }),
      new TableRow({
        children: [
          cell("مكان وتاريخ الولادة", e.birth_place + " - " + e.birth_date),
          cell("محل ورقم القيد", e.registry_number),
          cell("الجنس", e.gender),
        ],
      }),
      new TableRow({
        children: [
          cell("الجنسية", e.nationality),
          cell("المؤهل العلمي", e.qualification),
          cell("مكان الإقامة الحالي", e.address),
        ],
      }),
    ],
  });
}

// جدول الوقوعات
function createIncidentsTable(incidents) {
  const headerRow = new TableRow({
    children: [
      cell("مركز العمل", true),
      cell("المسمى الوظيفي", true),
      cell("نوع الوظيفة", true),
      cell("الأجر", true),
      cell("الفئة", true),
      cell("المباشرة", true),
      cell("التبدلات الطارئة", true),
      cell("نوع المستند", true),
      cell("رقم المستند", true),
      cell("تاريخ المستند", true),
    ],
  });

  const rows = incidents.map(
    (i) =>
      new TableRow({
        children: [
          cell(i.work_center),
          cell(i.job_title),
          cell(i.job_type),
          cell(i.salary.toString()),
          cell(i.category),
          cell(formatDate(i.start_date)),
          cell(i.reason),
          cell(i.document_type),
          cell(i.document_number),
          cell(formatDate(i.document_date)),
        ],
      })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1 },
      bottom: { style: BorderStyle.SINGLE, size: 1 },
      left: { style: BorderStyle.SINGLE, size: 1 },
      right: { style: BorderStyle.SINGLE, size: 1 },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
      insideVertical: { style: BorderStyle.SINGLE, size: 1 },
    },
    rows: [headerRow, ...rows],
  });
}

// خلية جدول
function cell(label, value = "", isHeader = false) {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({
            text: `${isHeader ? label : `${label}: ${value || ""}`}`,
            bold: isHeader,
            size: 22,
          }),
        ],
        alignment: AlignmentType.RIGHT,
      }),
    ],
  });
}

function formatDate(date) {
  return date ? new Date(date).toLocaleDateString("ar-SY") : "";
}
