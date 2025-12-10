import { useState, useEffect } from "react";
import { X, Search, User, FileText, AlertTriangle, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

export default function GlobalSearchModal({ show, onClose }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length > 2) {
        setLoading(true);
        try {
          const res = await API.get(`/search?query=${query}`);
          setResults(res.data);
        } catch (error) {
          console.error("Search error:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setResults(null);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  if (!show) return null;

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b flex items-center gap-3">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="ابحث عن موظفين، تعاميم، مستخدمين..."
            className="flex-1 outline-none text-lg"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          {loading && (
            <div className="text-center py-4 text-gray-500">جاري البحث...</div>
          )}

          {!loading && results && (
            <div className="space-y-6">
              {/* Employees */}
              {results.employees?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                    <User className="w-4 h-4" /> الموظفين
                  </h3>
                  <div className="space-y-1">
                    {results.employees.map((emp) => (
                      <div
                        key={emp._id}
                        onClick={() =>
                          handleNavigate(`/dashboard/employees/${emp._id}`)
                        }
                        className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer flex justify-between items-center"
                      >
                        <span className="font-medium">{emp.fullName}</span>
                        <span className="text-sm text-gray-500">
                          {emp.currentJobTitle}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Circulars */}
              {results.circulars?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> التعاميم
                  </h3>
                  <div className="space-y-1">
                    {results.circulars.map((circ) => (
                      <div
                        key={circ._id}
                        onClick={() => handleNavigate(`/dashboard/circulars`)}
                        className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                      >
                        <span className="font-medium">{circ.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Users */}
              {results.users?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                    <Users className="w-4 h-4" /> المستخدمين
                  </h3>
                  <div className="space-y-1">
                    {results.users.map((user) => (
                      <div
                        key={user._id}
                        onClick={() => handleNavigate(`/dashboard/users`)}
                        className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                      >
                        <span className="font-medium">{user.username}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Incidents */}
              {results.incidents?.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> الوقوعات
                  </h3>
                  <div className="space-y-1">
                    {results.incidents.map((inc) => (
                      <div
                        key={inc._id}
                        onClick={() =>
                          handleNavigate(
                            `/dashboard/employees/${inc.employee?._id}/incidents`
                          )
                        }
                        className="p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                      >
                        <span className="font-medium">
                          {inc.reason} - {inc.document_number}
                        </span>
                        <span className="text-sm text-gray-500 block">
                          {inc.employee?.fullName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {Object.values(results).every((arr) => arr.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  لا توجد نتائج
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
