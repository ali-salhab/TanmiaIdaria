import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DropdownWithSettings from "../components/DropdownWithSettings";
import API from "../api/api";
import toast from "react-hot-toast";
import { Download, Printer } from "lucide-react";

export default function EmployeeVacations() {
  const { id } = useParams();
  const [vacations, setVacations] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedVacation, setSelectedVacation] = useState(null);

  const [formData, setFormData] = useState({
    type: "",
    days: "",
    hours: "",
    childOrder: "",
    startDate: "",
  });

  const vacationTypes = [
    "إجازة صحية",
    "إجازة أمومة",
    "إجازة ساعية",
    "إجازة إدارية",
    "إجازة خاصة بلا أجر",
    "إجازة زواج",
    "إجازة حج",
  ];

  useEffect(() => {
    setVacations([
      { id: 1, type: "إجازة صحية", days: 10, startDate: "2025-11-01" },
      { id: 2, type: "إجازة إدارية", days: 5, startDate: "2025-09-10" },
    ]);
  }, [id]);

  const handleAdd = () => {
    setSelectedVacation(null);
    setFormData({
      type: "",
      days: "",
      hours: "",
      childOrder: "",
      startDate: "",
    });
    setModalOpen(true);
  };

  const handleEdit = (v) => {
    setSelectedVacation(v);
    setFormData({
      type: v.type,
      days: v.days,
      hours: "",
      childOrder: "",
      startDate: v.startDate,
    });
    setModalOpen(true);
  };

  // 🧩 حساب الأيام حسب نوع الإجازة
  const calculateDays = (type, childOrder, hours) => {
    switch (type) {
      case "إجازة صحية":
        return formData.days > 180 ? 180 : formData.days;
      case "إجازة أمومة":
        if (childOrder === "1") return 120;
        if (childOrder === "2") return 90;
        if (childOrder === "3") return 75;
        return "";
      case "إجازة ساعية": {
        const totalHours = parseFloat(hours || 0);
        return (totalHours / 8).toFixed(2);
      }
      default:
        return formData.days;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newData = { ...formData, [name]: value };

    // حساب الأيام عند تغيير القيم
    if (
      name === "type" ||
      name === "childOrder" ||
      name === "hours" ||
      name === "days"
    ) {
      newData.days = calculateDays(
        newData.type,
        newData.childOrder,
        newData.hours
      );
    }

    setFormData(newData);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (selectedVacation) {
      // تعديل
      setVacations(
        vacations.map((v) =>
          v.id === selectedVacation.id ? { ...v, ...formData } : v
        )
      );
    } else {
      // إضافة جديدة
      const newVac = {
        id: Date.now(),
        type: formData.type,
        days: formData.days,
        startDate: formData.startDate,
      };
      setVacations([...vacations, newVac]);
    }

    setModalOpen(false);
  };

  const handleExportWord = async () => {
    try {
      const response = await API.get(`/employees/${id}/vacations/export/word`, {
        responseType: "blob",
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `إجازات_الموظف.docx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("تم تحميل المستند بنجاح");
    } catch (error) {
      console.error(error);
      toast.error("فشل تحميل المستند");
    }
  };

  const handleDownloadTemplate = async (vacationId) => {
    try {
      const response = await API.get(`/vacations/${vacationId}/template`, {
        responseType: "blob",
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `استمارة_الإجازة_${vacationId}.docx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("تم تحميل استمارة الإجازة بنجاح");
    } catch (error) {
      console.error(error);
      toast.error("فشل تحميل الاستمارة");
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "", "width=800,height=600");
    const htmlContent = `
      <html dir="rtl">
        <head>
          <title>إجازات الموظف</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; margin-bottom: 20px; }
            .employee-info { text-align: right; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #000; padding: 10px; text-align: center; }
            th { background-color: #f0f0f0; font-weight: bold; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <h1>إجازات الموظف</h1>
          <div class="employee-info">
            <p><strong>رقم الموظف:</strong> ${id}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>الترتيب</th>
                <th>نوع الإجازة</th>
                <th>عدد الأيام</th>
                <th>تاريخ البداية</th>
              </tr>
            </thead>
            <tbody>
              ${vacations.map((v, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${v.type}</td>
                  <td>${v.days}</td>
                  <td>${v.startDate}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="p-6 font-custom text-right" dir="rtl">
      <h2 className="text-2xl font-bold mb-4">إجازات الموظف</h2>

      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <p>إدارة الإجازات الخاصة بالموظف رقم: {id}</p>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Printer size={18} />
            طباعة
          </button>
          <button
            onClick={handleExportWord}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition flex items-center gap-2"
          >
            <Download size={18} />
            تحميل Word
          </button>
          <button
            onClick={handleAdd}
            className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            + إضافة إجازة جديدة
          </button>
        </div>
      </div>

      {/* جدول الإجازات */}
      <table className="min-w-full bg-white border rounded">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2 border">النوع</th>
            <th className="p-2 border">عدد الأيام</th>
            <th className="p-2 border">تاريخ البداية</th>
            <th className="p-2 border">إجراءات</th>
          </tr>
        </thead>
        <tbody>
          {vacations.map((v) => (
            <tr key={v.id} className="border-t">
              <td className="p-2 border">{v.type}</td>
              <td className="p-2 border">{v.days}</td>
              <td className="p-2 border">{v.startDate}</td>
              <td className="p-2 border">
                <button
                  onClick={() => handleDownloadTemplate(v.id)}
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 ml-2 transition flex items-center gap-1 text-sm"
                  title="تحميل استمارة الإجازة"
                >
                  <Download size={14} />
                  استمارة
                </button>
                <button
                  onClick={() => handleEdit(v)}
                  className="bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-700 ml-2 transition"
                >
                  تعديل
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* مودال */}
      {modalOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div className="bg-white rounded-lg p-6 w-full max-w-md animate-fadeInUp">
            <h3 className="text-xl font-bold mb-4 text-center">
              {selectedVacation ? "تعديل الإجازة" : "إضافة إجازة جديدة"}
            </h3>

            <form onSubmit={handleSubmit} className="grid gap-3">
              {/* نوع الإجازة */}
              <DropdownWithSettings
                id="vacation_type"
                value={formData.type}
                onChange={(e) => handleChange({ target: { name: "type", value: e.target.value } })}
                options={[{ value: "", label: "اختر النوع" }, ...vacationTypes.map((t) => ({ value: t, label: t }))]}
                label="نوع الإجازة"
                placeholder="اختر النوع"
                className="border p-2 w-full rounded"
              />

              {/* إجازة أمومة → رقم الطفل */}
              {formData.type === "إجازة أمومة" && (
                <DropdownWithSettings
                  id="child_order"
                  value={formData.childOrder}
                  onChange={(e) => handleChange({ target: { name: "childOrder", value: e.target.value } })}
                  options={[
                    { value: "", label: "اختر" },
                    { value: "1", label: "الولد الأول (120 يوم)" },
                    { value: "2", label: "الولد الثاني (90 يوم)" },
                    { value: "3", label: "الولد الثالث (75 يوم)" },
                  ]}
                  label="ترتيب الطفل"
                  placeholder="اختر"
                  className="border p-2 w-full rounded"
                />
              )}

              {/* إجازة ساعية → عدد الساعات */}
              {formData.type === "إجازة ساعية" && (
                <div>
                  <label className="block mb-1 font-medium">عدد الساعات</label>
                  <input
                    type="number"
                    name="hours"
                    value={formData.hours}
                    onChange={handleChange}
                    className="border p-2 w-full rounded"
                    placeholder="أدخل عدد الساعات"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    كل 8 ساعات = يوم واحد
                  </p>
                </div>
              )}

              {/* عدد الأيام */}
              <div>
                <label className="block mb-1 font-medium">عدد الأيام</label>
                <input
                  type="number"
                  name="days"
                  value={formData.days}
                  onChange={handleChange}
                  className="border p-2 w-full rounded"
                  readOnly={
                    formData.type === "إجازة أمومة" ||
                    formData.type === "إجازة ساعية"
                  }
                />
              </div>

              {/* تاريخ البداية */}
              <div>
                <label className="block mb-1 font-medium">تاريخ البداية</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="border p-2 w-full rounded"
                />
              </div>

              <div className="flex justify-between mt-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800 transition"
                >
                  حفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
