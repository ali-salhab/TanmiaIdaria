import mongoose from "mongoose";

const incidentSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
    },
    // 🧾 البيانات الأساسية
    work_center: { type: String, required: true }, // مركز العمل
    job_title: { type: String, required: true }, // المسمى الوظيفي
    job_type: { type: String, required: true }, // نوع الوظيفة (مهنية، إدارية...)
    salary: { type: Number, required: true }, // الأجر
    category: { type: String, required: true }, // الفئة (خامسة، رابعة...)
    start_date: { type: Date, required: true }, // تاريخ المباشرة

    // 🧾 التبدلات الطارئة
    change_date: { type: Date }, // تاريخ التبدل
    reason: { type: String }, // السبب (ترفيع، زيادة أجر...)
    document_type: { type: String }, // نوع المستند (قرار، م.ت...)
    document_number: { type: String }, // رقم المستند
    document_date: { type: Date }, // تاريخ المستند

    // 🧾 بيانات التسجيل
    registrar_name: { type: String }, // اسم المسجل
    registrar_signature: { type: String }, // توقيع المسجل (اختياري - نص أو صورة)

    isInternal: { type: Boolean, default: false }, // وقوع داخلي
    incidentType: { type: String, default: "external" }, // internal, external
    directorate: { type: String }, // المديرية
    department: { type: String }, // الدائرة
    divisionName: { type: String }, // الشعبة
  },
  { timestamps: true }
);

export default mongoose.model("Incident", incidentSchema);
