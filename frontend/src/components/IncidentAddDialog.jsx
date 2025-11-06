import { useState } from "react";
import API from "../api/api";

export default function IncidentAddDialog({ onClose, onSuccess }) {
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
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setIncident({ ...incident, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/incidents", incident);
      onSuccess(res.data); // add new incident to the list dynamically
      onClose(); // close dialog
    } catch (err) {
      console.error(err);
      alert("فشل في إضافة الوقوع.");
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full text-center">
        <h3 className="text-xl font-bold mb-4">إضافة وقوع جديد</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mt-2"
          >
            حفظ
          </button>
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 mt-2"
          >
            إلغاء
          </button>
        </form>
      </div>
    </div>
  );
}
