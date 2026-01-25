import React from "react";
import { X, Github, Mail, Phone, MessageCircle } from "lucide-react";

export default function Copyright({ onClose }) {
  const developers = [
    {
      name: "Ali Salhab",
      role: "Full Stack Developer",
      github: "ali-salhab",
      email: "alisalhab258@gmail.com",
      phone: "0934029909",
      avatar: "https://avatars.githubusercontent.com/u/ali-salhab"
    },
    {
      name: "Mohammad Nasif",
      role: "supervisor",
      github: "mohammad-nasif",
      email: "mohammadnasif@example.com",
      phone: "0934029909",
      avatar: "https://ui-avatars.com/api/?name=Mohammad+Nasif&background=1e293b&color=fff&size=128"
    }
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-slate-900/90 border border-slate-700/50 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-lg overflow-hidden relative animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
        dir="ltr"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-slate-800/50 hover:bg-slate-700/80 rounded-xl text-slate-400 hover:text-white transition-all duration-300"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Background Pattern */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-800 p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
          </div>

          <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2 drop-shadow-md">
            Development Team
          </h2>
          <p className="text-blue-100/80 text-sm font-medium">Empowering users with innovative solutions</p>
        </div>

        {/* Developers List */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {developers.map((dev, index) => (
            <div
              key={index}
              className="group bg-slate-800/40 border border-slate-700/30 rounded-2xl p-4 hover:border-blue-500/50 transition-all duration-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.2)] animate-slideUp"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full blur opacity-25 group-hover:opacity-75 transition duration-500"></div>
                  <img
                    src={dev.avatar}
                    alt={dev.name}
                    className="relative w-16 h-16 rounded-full border-2 border-slate-800 object-cover"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(dev.name)}&background=0D8ABC&color=fff&size=128`;
                    }}
                  />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{dev.name}</h3>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{dev.role}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                <a href={`mailto:${dev.email}`} className="flex items-center gap-3 p-2.5 bg-slate-900/50 rounded-xl border border-slate-800 hover:bg-slate-800 transition-all group/link">
                  <Mail className="w-4 h-4 text-blue-500 group-hover/link:scale-110 transition-transform" />
                  <span className="text-[10px] text-slate-300 truncate">{dev.email}</span>
                </a>
                <a href={`https://github.com/${dev.github}`} target="_blank" className="flex items-center gap-3 p-2.5 bg-slate-900/50 rounded-xl border border-slate-800 hover:bg-slate-800 transition-all group/link">
                  <Github className="w-4 h-4 text-slate-400 group-hover/link:scale-110 transition-transform" />
                  <span className="text-[10px] text-slate-300 truncate">{dev.github}</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Global Footer */}
        <div className="p-4 bg-slate-950/50 border-t border-slate-800/50 text-center">
          <div className="flex justify-center gap-4 mb-3">
            <a href="https://wa.me/963934029909" target="_blank" className="p-2 bg-green-500/10 text-green-500 rounded-full hover:bg-green-500 hover:text-white transition-all duration-300 transform hover:scale-110">
              <MessageCircle className="w-5 h-5" />
            </a>
            <a href="https://t.me/+963934029909" target="_blank" className="p-2 bg-blue-500/10 text-blue-500 rounded-full hover:bg-blue-500 hover:text-white transition-all duration-300 transform hover:scale-110">
              <MessageCircle className="w-5 h-5 text-blue-400" />
            </a>
          </div>
          <p className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-black">
            © {new Date().getFullYear()} TANMIA IDARIA • DESIGNED BY ALI & MOHAMMAD
          </p>
        </div>
      </div>
    </div>
  );
}
