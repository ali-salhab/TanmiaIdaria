import React from "react";
import { X, Github, Mail, Phone, MessageCircle } from "lucide-react";

export default function Copyright({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
      dir="rtl"
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-1 bg-white/20 hover:bg-white/30 rounded-full text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-24 h-24 bg-white rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg border-4 border-white/30">
            <img
              src="https://avatars.githubusercontent.com/u/ali-salhab" // Placeholder or actual if available
              alt="Ali Salhab"
              className="w-full h-full rounded-full object-cover"
              onError={(e) => {
                e.target.src =
                  "https://ui-avatars.com/api/?name=Ali+Salhab&background=0D8ABC&color=fff&size=128";
              }}
            />
          </div>
          <h2 className="text-2xl font-bold text-white">
            المهندس علي ابراهيم سلهب
          </h2>
          <p className="text-blue-100 mt-1">Full Stack Developer</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
              <Mail className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500">البريد الإلكتروني</p>
              <a
                href="mailto:alisalhab258@gmail.com"
                className="text-sm font-medium text-gray-800 hover:text-blue-600"
              >
                alisalhab258@gmail.com
              </a>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
            <div className="p-2 bg-gray-800 text-white rounded-lg">
              <Github className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500">GitHub</p>
              <a
                href="https://github.com/ali-salhab"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-gray-800 hover:text-blue-600"
              >
                ali-salhab
              </a>
            </div>
          </div>

          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
            <div className="p-2 bg-green-100 text-green-600 rounded-lg">
              <Phone className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-500">
                رقم الهاتف (واتساب / تلغرام)
              </p>
              <a
                href="tel:+963934029909"
                className="text-sm font-medium text-gray-800 hover:text-blue-600"
              >
                0934029909
              </a>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <a
              href="https://wa.me/963934029909"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 bg-green-500 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-green-600 transition"
            >
              <MessageCircle className="w-4 h-4" /> واتساب
            </a>
            <a
              href="https://t.me/+963934029909"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2 bg-blue-500 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-blue-600 transition"
            >
              <MessageCircle className="w-4 h-4" /> تلغرام
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} جميع الحقوق محفوظة للمطور
          </p>
        </div>
      </div>
    </div>
  );
}
