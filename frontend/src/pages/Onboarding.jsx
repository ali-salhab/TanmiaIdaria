import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const onboardingContent = [
  {
    title: "🎯 إدارة الموظفين",
    description: "إدارة سهلة وفعالة لبيانات جميع الموظفين والموارد البشرية",
    color: "from-blue-400 to-blue-600",
  },
  {
    title: "📊 تتبع الإجازات",
    description: "نظام متكامل لطلبات الإجازات والإجازات المرضية والموافقات",
    color: "from-green-400 to-green-600",
  },
  {
    title: "⚠️ تسجيل الحوادث",
    description: "توثيق وتتبع جميع الحوادث والإصابات في مكان العمل",
    color: "from-red-400 to-red-600",
  },
  {
    title: "📈 التقارير والإحصائيات",
    description: "تحليل شامل للبيانات وإنشاء تقارير مفصلة",
    color: "from-purple-400 to-purple-600",
  },
];

const generateRandomLogo = () => {
  const colors = [
    "from-blue-500 to-cyan-500",
    "from-purple-500 to-pink-500",
    "from-green-500 to-teal-500",
    "from-orange-500 to-red-500",
    "from-indigo-500 to-blue-500",
    "from-rose-500 to-pink-500",
  ];
  const shapes = ["circle", "square", "diamond"];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const randomShape = shapes[Math.floor(Math.random() * shapes.length)];

  return { color: randomColor, shape: randomShape };
};

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [logoStyle, setLogoStyle] = useState(generateRandomLogo());
  const [isFlipping, setIsFlipping] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % onboardingContent.length);
        setIsFlipping(false);
      }, 600);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleProceed = () => {
    const role = localStorage.getItem("role");
    if (role === "admin") {
      navigate("/dashboard");
    } else {
      navigate("/home");
    }
  };

  const currentContent = onboardingContent[currentIndex];

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-gray-900 flex items-center justify-center p-4 overflow-hidden relative"
    >
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full filter blur-3xl animate-blob"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-pink-500/20 rounded-full filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 w-full max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Logo Section */}
          <div className="flex justify-center items-center">
            <div className="relative w-64 h-64 lg:w-80 lg:h-80">
              {/* Animated border circle */}
              <div className="absolute inset-0 rounded-full border-4 border-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 p-1 animate-spin-slow opacity-60">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-900 via-indigo-900 to-gray-900"></div>
              </div>

              {/* Logo placeholder with shape */}
              <div
                className={`absolute inset-0 flex items-center justify-center transform transition-all duration-700 ${
                  isFlipping ? "scale-0 opacity-0" : "scale-100 opacity-100"
                }`}
              >
                <div
                  className={`bg-gradient-to-br ${logoStyle.color} rounded-full w-56 h-56 lg:w-72 lg:h-72 flex items-center justify-center text-white text-7xl lg:text-8xl font-bold shadow-2xl transform transition-all duration-500 hover:scale-110`}
                >
                  {logoStyle.shape === "circle" && "●"}
                  {logoStyle.shape === "square" && "■"}
                  {logoStyle.shape === "diamond" && "◆"}
                </div>
              </div>

              {/* Rotating dots */}
              <div className="absolute inset-0 rounded-full opacity-30 animate-spin-slow-reverse">
                <div className="absolute top-0 left-1/2 w-2 h-2 bg-blue-400 rounded-full transform -translate-x-1/2"></div>
                <div className="absolute bottom-0 left-1/2 w-2 h-2 bg-purple-400 rounded-full transform -translate-x-1/2"></div>
                <div className="absolute top-1/2 left-0 w-2 h-2 bg-pink-400 rounded-full transform -translate-y-1/2"></div>
                <div className="absolute top-1/2 right-0 w-2 h-2 bg-green-400 rounded-full transform -translate-y-1/2"></div>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="text-white space-y-8">
            {/* Header */}
            <div className="animate-fadeSlide">
              <h1 className="text-4xl lg:text-5xl font-bold mb-2">
                مرحباً بك! 👋
              </h1>
              <p className="text-lg text-gray-300">
                في نظام إدارة التنمية الإدارية
              </p>
            </div>

            {/* Animated Content Box */}
            <div
              className={`min-h-48 p-8 rounded-2xl backdrop-blur-xl bg-white/10 border border-white/20 transform transition-all duration-700 ${
                isFlipping ? "scale-95 opacity-0 rotate-y-90" : "scale-100 opacity-100"
              }`}
              style={{
                perspective: "1000px",
                transformStyle: "preserve-3d",
              }}
            >
              <div
                className={`space-y-4 transform transition-all duration-700 ${
                  isFlipping ? "scale-0" : "scale-100"
                }`}
              >
                <h2
                  className={`text-3xl font-bold bg-gradient-to-r ${currentContent.color} bg-clip-text text-transparent`}
                >
                  {currentContent.title}
                </h2>
                <p className="text-gray-200 text-lg leading-relaxed">
                  {currentContent.description}
                </p>
              </div>
            </div>

            {/* Progress Indicators */}
            <div className="flex gap-2 justify-center">
              {onboardingContent.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setIsFlipping(true);
                    setTimeout(() => {
                      setCurrentIndex(idx);
                      setIsFlipping(false);
                    }, 600);
                  }}
                  className={`h-3 rounded-full transition-all duration-300 ${
                    idx === currentIndex
                      ? "w-8 bg-white"
                      : "w-3 bg-white/40 hover:bg-white/60"
                  }`}
                ></button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                onClick={handleProceed}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center gap-2"
              >
                <span>دخول النظام</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom info */}
        <div className="mt-12 text-center text-gray-300 text-sm">
          <p>© 2025 مديرية التنمية الإدارية - جميع الحقوق محفوظة</p>
        </div>
      </div>

      <style>
        {`
          @keyframes blob {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
          }

          @keyframes spin-slow {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }

          @keyframes spin-slow-reverse {
            from { transform: rotate(360deg); }
            to { transform: rotate(0deg); }
          }

          @keyframes fadeSlide {
            from { 
              opacity: 0; 
              transform: translateY(20px);
            }
            to { 
              opacity: 1; 
              transform: translateY(0);
            }
          }

          .animate-blob {
            animation: blob 7s infinite;
          }

          .animation-delay-2000 {
            animation-delay: 2s;
          }

          .animation-delay-4000 {
            animation-delay: 4s;
          }

          .animate-spin-slow {
            animation: spin-slow 8s linear infinite;
          }

          .animate-spin-slow-reverse {
            animation: spin-slow-reverse 8s linear infinite;
          }

          .animate-fadeSlide {
            animation: fadeSlide 0.6s ease-out forwards;
          }

          @keyframes scaleIn3D {
            from {
              opacity: 0;
              transform: perspective(1000px) rotateX(90deg) scale(0.5);
            }
            to {
              opacity: 1;
              transform: perspective(1000px) rotateX(0deg) scale(1);
            }
          }

          .animate-scale-in-3d {
            animation: scaleIn3D 0.6s ease-out forwards;
          }
        `}
      </style>
    </div>
  );
}
