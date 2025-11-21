// src/components/Modal.jsx
import React from "react";
import { X } from "lucide-react";

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  width = "max-w-lg",
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Box */}
      <div
        className={`relative bg-white rounded-xl shadow-xl p-6 w-full ${width} animate-fadeIn scale-95`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 left-3 text-gray-500 hover:text-gray-800"
        >
          <X size={22} />
        </button>

        {/* Title */}
        {title && (
          <h2 className="text-xl font-semibold mb-4 text-gray-800">{title}</h2>
        )}

        {/* Content */}
        <div className="text-gray-700">{children}</div>
      </div>

      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          .animate-fadeIn {
            animation: fadeIn 0.25s ease-out forwards;
          }
        `}
      </style>
    </div>
  );
}
