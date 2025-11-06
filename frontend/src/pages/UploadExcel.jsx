import { useState } from "react";
import API from "../api/api";

export default function UploadExcel() {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(0);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage("");
    setCount(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage("Please select an Excel file to upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      const res = await API.post("/employees/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage(res.data.message || "Upload successful!");
      setCount(res.data.count || 0);
    } catch (err) {
      console.error(err);
      setMessage(
        err.response?.data?.message ||
          "Error uploading file. Please check format or permissions."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white shadow-lg rounded-2xl p-8 mt-6 border border-gray-200">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">
        📤 Upload Excel File
      </h2>
      <p className="text-gray-500 mb-6">
        Upload your Excel file (.xlsx or .xls) to import employee records into
        the system.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col items-center border-2 border-dashed border-gray-300 rounded-xl p-8 hover:border-blue-400 transition">
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-600
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100 cursor-pointer"
          />
          {file && (
            <p className="mt-3 text-gray-600 text-sm">
              Selected: <span className="font-medium">{file.name}</span>
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-xl text-white font-semibold transition ${
            loading
              ? "bg-blue-300 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          {loading ? "Uploading..." : "Upload File"}
        </button>
      </form>

      {message && (
        <div
          className={`mt-6 text-center p-3 rounded-xl ${
            message.includes("success") || message.includes("Imported")
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {message}
          {count > 0 && (
            <p className="mt-2 text-sm text-gray-600">
              Total imported records: <b>{count}</b>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
