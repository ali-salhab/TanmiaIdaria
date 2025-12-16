import React from "react";
import { AlertTriangle, XCircle } from "lucide-react";

function ErrorModal({ handleOutsideClick, data, setShowModal }) {
  // Handle both string errors (legacy) and object errors (new)
  const errorData =
    typeof data.error === "string"
      ? { code: "Error", title: "Login Failed", message: data.error }
      : data.error;

  return (
    <div
      id="error-modal"
      onClick={handleOutsideClick}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all duration-300 animate-scaleUp border border-red-100">
        <div className="bg-red-50 p-6 flex flex-col items-center text-center border-b border-red-100">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">
            {errorData.title || "خطأ في تسجيل الدخول"}
          </h3>
          <p className="text-red-500 font-mono text-sm bg-red-50 px-3 py-1 rounded-full border border-red-200 mt-2">
            Code: {errorData.code || "Unknown"}
          </p>
        </div>

        <div className="p-6 text-center">
          <p className="text-gray-600 text-lg mb-6 leading-relaxed">
            {errorData.message}
          </p>

          <button
            onClick={() => setShowModal(false)}
            className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
          >
            <XCircle className="w-5 h-5" />
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}

export default ErrorModal;
