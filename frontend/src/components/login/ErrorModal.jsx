import React from "react";

function ErrorModal({ handleOutsideClick, data, setShowModal }) {
  return (
    <div
      id="error-modal"
      onClick={handleOutsideClick}
      className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn"
    >
      <div className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 backdrop-blur-xl border border-red-400/50 rounded-2xl shadow-2xl shadow-red-500/20 p-6 w-80 text-center transform transition-all duration-300 animate-scaleUp">
        <h3 className="text-xl font-semibold text-red-200 mb-3 drop-shadow">
          ⚠️ خطأ
        </h3>
        <p className="text-red-100 mb-6">
          Login Failed With Error : {data.error}
        </p>
        <button
          onClick={() => setShowModal(false)}
          className="px-6 py-2 bg-red-500/40 text-white font-semibold rounded-lg hover:bg-red-500/60 transition border border-red-400/50"
        >
          إغلاق
        </button>
      </div>
    </div>
  );
}

export default ErrorModal;
