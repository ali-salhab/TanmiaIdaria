import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api/api";

export default function IncidentAdd() {
  const { id } = useParams(); // معرف الموظف
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(false);
  const [incident, setIncident] = useState({
    work_center: "",
    job_title: "",
    job_type: "",
    salary: "",
    category: "",
    start_date: "",
    reason: "",
    document_type: "",
    document_number: "",
    document_date: "",
    employee: id,
  });

  // حالة لفتح/إغلاق الـ Dialog
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setIncident({ ...incident, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/incidents", incident);
      // فتح الـ Dialog بعد الإضافة
      setDialogOpen(true);
    } catch (err) {
      console.error(err);
      alert("فشل في إضافة الوقوع.");
    }
  };

  const closeDialog = () => {
    setDialogOpen(false);
    navigate(`/dashboard/employees/${id}/incidents`);
  };

  return (
    <div
      className="max-w-3xl mx-auto p-6 bg-white shadow-md rounded-lg mt-6"
      dir="rtl"
    >
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
        إضافة وقوع جديد
      </h2>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* الحقول */}
        <input
          name="work_center"
          placeholder="مركز العمل"
          value={incident.work_center}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          name="job_title"
          placeholder="المسمى الوظيفي"
          value={incident.job_title}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          name="job_type"
          placeholder="نوع الوظيفة"
          value={incident.job_type}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          name="salary"
          placeholder="الأجر"
          type="number"
          value={incident.salary}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          name="category"
          placeholder="الفئة"
          value={incident.category}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          name="start_date"
          placeholder="تاريخ المباشرة"
          type="date"
          value={incident.start_date}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          name="reason"
          placeholder="السبب (ترفيع، زيادة أجر، تجديد...)"
          value={incident.reason}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          name="document_type"
          placeholder="نوع المستند"
          value={incident.document_type}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          name="document_number"
          placeholder="رقم المستند"
          value={incident.document_number}
          onChange={handleChange}
          className="border p-2 rounded"
        />
        <input
          name="document_date"
          placeholder="تاريخ المستند"
          type="date"
          value={incident.document_date}
          onChange={handleChange}
          className="border p-2 rounded"
        />

        <div className="col-span-2 text-center mt-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            حفظ الوقوع
          </button>
        </div>
      </form>

      {/* Dialog */}
      {dialogOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full text-center">
            <h3 className="text-xl font-bold mb-4">تمت إضافة الوقوع بنجاح!</h3>
            <p className="mb-4">
              المسمى الوظيفي: {incident.job_title} <br />
              مركز العمل: {incident.work_center} <br />
              السبب: {incident.reason}
            </p>
            <button
              onClick={closeDialog}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              تم
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
