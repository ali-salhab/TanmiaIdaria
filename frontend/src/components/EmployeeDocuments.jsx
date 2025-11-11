import { useState, useEffect } from "react";
import API from "../api/api";
import { PlusCircle } from "lucide-react";

export default function EmployeeDocuments({ employeeId }) {
  console.log(import.meta.env.VITE_API_URL);

  const [docs, setDocs] = useState([]);
  const [newFiles, setNewFiles] = useState([]);

  // Load existing documents from server
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const res = await API.get(`/employees/${employeeId}`);
        if (res.data.documents) {
          setDocs(res.data.documents);
          console.log(
            "Doc URL:",
            `${import.meta.env.VITE_API_URL}${res.data.documents[0]?.path}`
          );
        }
      } catch (err) {
        console.error("Failed to load documents:", err);
      }
    };
    fetchDocs();
  }, [employeeId]);

  // Select new files
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).map((file) => ({
      file,
      description: "",
    }));
    setNewFiles((prev) => [...prev, ...files]);
  };

  // Update description for a new file
  const handleDescriptionChange = (index, value) => {
    const updated = [...newFiles];
    updated[index].description = value;
    setNewFiles(updated);
  };

  // Upload new files
  const uploadFiles = async () => {
    if (!newFiles.length) return alert("No files selected!");

    const formData = new FormData();
    newFiles.forEach((item) => formData.append("files", item.file));
    const descriptions = newFiles.map((item) => item.description);
    formData.append("descriptions", JSON.stringify(descriptions));

    try {
      const res = await API.post(`/employees/${employeeId}/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setDocs(res.data.documents);
      setNewFiles([]);
      alert("Documents uploaded successfully!");
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    }
  };

  return (
    <div className="p-4 border rounded mt-4 bg-white shadow-sm">
      <h2 className="font-semibold text-lg mb-3 items-center">وثائق الموظف</h2>

      {/* Existing documents */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {docs.length ? (
          docs.map((doc, i) => (
            <div
              key={i}
              className="relative group bg-white rounded-xl shadow-md overflow-hidden border"
            >
              <img
                src={`http://localhost:5001${doc.path}`}
                alt={doc.description}
                className="w-full h-48 object-cover group-hover:opacity-90 transition"
              />
              <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/60 to-transparent p-3 text-white">
                <p className="text-sm">{doc.description || "بدون وصف"}</p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() =>
                      window.open(`http://localhost:5001${doc.path}`)
                    }
                    className="bg-green-600 px-2 py-1 rounded text-xs hover:bg-green-700"
                  >
                    تنزيل
                  </button>
                  <button
                    onClick={() => setEditImage(doc.path)}
                    className="bg-blue-600 px-2 py-1 rounded text-xs hover:bg-blue-700"
                  >
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDocDelete(doc.path)}
                    className="bg-red-600 px-2 py-1 rounded text-xs hover:bg-red-700"
                  >
                    حذف
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="col-span-full text-gray-500 text-center">
            No documents uploaded yet.
          </p>
        )}
      </div>

      {/* New files upload */}
      {newFiles.length > 0 && (
        <div className="mt-6 border-t pt-4">
          <h3 className="font-medium mb-2">New Documents</h3>
          {newFiles.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-3 mb-2 border p-2 rounded"
            >
              <span className="text-gray-700 text-sm flex-1 truncate">
                {item.file.name}
              </span>
              <input
                type="text"
                placeholder="Add description..."
                value={item.description}
                onChange={(e) => handleDescriptionChange(index, e.target.value)}
                className="border p-1 rounded text-sm flex-1"
              />
            </div>
          ))}
          <button
            onClick={uploadFiles}
            className="bg-green-600 text-white px-4 py-2 rounded mt-2"
          >
            Upload Documents
          </button>
        </div>
      )}

      {/* Add more files */}
      <div className="mt-4 flex justify-center">
        <label className="flex flex-col items-center cursor-pointer">
          <PlusCircle className="text-blue-600 w-8 h-8 mb-1" />
          <span className="text-sm text-blue-600">Add More Documents</span>
          <input
            type="file"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      </div>
    </div>
  );
}
