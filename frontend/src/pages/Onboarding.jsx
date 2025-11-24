import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Users, Calendar, AlertTriangle, BarChart3, Shield, FileText, Award } from "lucide-react";
// Import decorative circle images
import bluePattern from "../assets/circles/patterns/circle-pattern-blue.svg";
import purplePattern from "../assets/circles/patterns/circle-pattern-purple.svg";
import gradientPattern1 from "../assets/circles/patterns/circle-pattern-gradient-1.svg";
import userIcon1 from "../assets/circles/icons/user-circle-1.svg";
import userIcon2 from "../assets/circles/icons/user-circle-2.svg";
import documentIcon1 from "../assets/circles/icons/document-circle-1.svg";
import documentIcon2 from "../assets/circles/icons/document-circle-2.svg";
import badgeIcon1 from "../assets/circles/icons/badge-circle-1.svg";
import badgeIcon2 from "../assets/circles/icons/badge-circle-2.svg";
import floatingOrb1 from "../assets/circles/decorative/floating-orb-1.svg";
import floatingOrb2 from "../assets/circles/decorative/floating-orb-2.svg";
import gradientSphere1 from "../assets/circles/decorative/gradient-sphere-1.svg";
import gradientSphere2 from "../assets/circles/decorative/gradient-sphere-2.svg";

const onboardingContent = [
  {
    title: "🎯 إدارة الموظفين",
    description: "إدارة سهلة وفعالة لبيانات جميع الموظفين والموارد البشرية",
    color: "from-blue-400 to-blue-600",
    icon: <Users size={40} />,
    image: userIcon1
  },
  {
    title: "📊 تتبع الإجازات",
    description: "نظام متكامل لطلبات الإجازات والإجازات المرضية والموافقات",
    color: "from-green-400 to-green-600",
    icon: <Calendar size={40} />,
    image: badgeIcon1
  },
  {
    title: "⚠️ تسجيل الحوادث",
    description: "توثيق وتتبع جميع الحوادث والإصابات في مكان العمل",
    color: "from-red-400 to-red-600",
    icon: <AlertTriangle size={40} />,
    image: badgeIcon2
  },
  {
    title: "📈 التقارير والإحصائيات",
    description: "تحليل شامل للبيانات وإنشاء تقارير مفصلة",
    color: "from-purple-400 to-purple-600",
    icon: <BarChart3 size={40} />,
    image: documentIcon1
  },
  {
    title: "🛡️ إدارة الصلاحيات",
    description: "نظام صلاحيات متقدم للتحكم في الوصول إلى الميزات",
    color: "from-indigo-400 to-indigo-600",
    icon: <Shield size={40} />,
    image: documentIcon2
  },
  {
    title: "📄 إدارة الوثائق",
    description: "أرشفة وتنظيم جميع المستندات والملفات المهمة",
    color: "from-amber-400 to-amber-600",
    icon: <FileText size={40} />,
    image: userIcon2
  },
  {
    title: "🏆 المكافآت والإنجازات",
    description: "تتبع وتوثيق المكافآت والإنجازات للموظفين",
    color: "from-emerald-400 to-emerald-600",
    icon: <Award size={40} />,
    image: badgeIcon1
  }
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [direction, setDirection] = useState(1); // 1 for forward, -1 for backward

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setIsFlipping(true);
      setDirection(1);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % onboardingContent.length);
        setIsFlipping(false);
      }, 600);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handleProceed = () => {
    const role = localStorage.getItem("role");
    if (role === "admin") {
      navigate("/dashboard");
    } else {
      navigate("/home");
    }
  };

  const goToSlide = (index) => {
    if (index === currentIndex) return;
    
    setIsFlipping(true);
    setDirection(index > currentIndex ? 1 : -1);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsFlipping(false);
    }, 600);
    
    // Pause autoplay when user interacts
    setIsAutoPlaying(false);
  };

  const nextSlide = () => {
    setIsFlipping(true);
    setDirection(1);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % onboardingContent.length);
      setIsFlipping(false);
    }, 600);
    setIsAutoPlaying(false);
  };

  const prevSlide = () => {
    setIsFlipping(true);
    setDirection(-1);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + onboardingContent.length) % onboardingContent.length);
      setIsFlipping(false);
    }, 600);
    setIsAutoPlaying(false);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  const currentContent = onboardingContent[currentIndex];

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 overflow-hidden relative"
    >
      {/* Enhanced animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating orbs */}
        <div className="absolute top-10 left-10 w-64 h-64 opacity-20 animate-float">
          <img src={floatingOrb1} alt="" className="w-full h-full object-contain" />
        </div>
        <div className="absolute bottom-10 right-10 w-64 h-64 opacity-20 animate-floatRandom">
          <img src={floatingOrb2} alt="" className="w-full h-full object-contain" />
        </div>
        <div className="absolute top-1/3 right-1/4 w-48 h-48 opacity-15 animate-float">
          <img src={gradientSphere1} alt="" className="w-full h-full object-contain" />
        </div>
        <div className="absolute bottom-1/4 left-1/3 w-56 h-56 opacity-15 animate-floatRandom">
          <img src={gradientSphere2} alt="" className="w-full h-full object-contain" />
        </div>
        
        {/* Decorative patterns */}
        <div className="absolute top-0 left-1/4 w-96 h-96 opacity-10">
          <img src={bluePattern} alt="" className="w-full h-full object-contain animate-pulseGentle" />
        </div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 opacity-10">
          <img src={purplePattern} alt="" className="w-full h-full object-contain animate-pulseGentle" />
        </div>
        <div className="absolute top-1/2 right-0 w-96 h-96 opacity-10">
          <img src={gradientPattern1} alt="" className="w-full h-full object-contain animate-pulseGentle" />
        </div>
      </div>

      <div className="relative z-10 w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Enhanced Logo Section */}
          <div className="flex justify-center items-center">
            <div className="relative w-72 h-72 lg:w-80 lg:h-80">
              {/* Multiple animated border circles */}
              <div className="absolute inset-0 rounded-full border-4 border-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 p-1 animate-spin-slow opacity-60"></div>
              <div className="absolute inset-4 rounded-full border-4 border-transparent bg-gradient-to-r from-emerald-400 via-blue-400 to-cyan-400 p-1 animate-spin-slow opacity-40 animation-delay-1000"></div>
              <div className="absolute inset-8 rounded-full border-4 border-transparent bg-gradient-to-r from-amber-400 via-orange-400 to-red-400 p-1 animate-spin-slow-reverse opacity-30 animation-delay-2000"></div>
              
              {/* Decorative background circle */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 shadow-2xl"></div>
              
              {/* Enhanced logo with decorative image */}
              <div
                className={`absolute inset-0 flex items-center justify-center transform transition-all duration-700 ${
                  isFlipping ? "scale-0 opacity-0 rotate-180" : "scale-100 opacity-100"
                }`}
              >
                <div className="relative">
                  <div className="w-56 h-56 lg:w-64 lg:h-64 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm flex items-center justify-center shadow-2xl border border-white/10">
                    <div className="w-48 h-48 lg:w-56 lg:h-56 rounded-full bg-gradient-to-br from-blue-600/30 to-indigo-600/30 flex items-center justify-center">
                      <img 
                        src={currentContent.image} 
                        alt={currentContent.title} 
                        className="w-32 h-32 lg:w-40 lg:h-40 object-contain filter drop-shadow-lg"
                      />
                    </div>
                  </div>
                  
                  {/* Decorative corner elements */}
                  <div className="absolute -top-4 -left-4 w-16 h-16 opacity-30">
                    <img src={badgeIcon1} alt="" className="w-full h-full object-contain" />
                  </div>
                  <div className="absolute -bottom-4 -right-4 w-16 h-16 opacity-30">
                    <img src={userIcon2} alt="" className="w-full h-full object-contain" />
                  </div>
                </div>
              </div>
              
              {/* Rotating decorative elements */}
              <div className="absolute inset-0 rounded-full opacity-40 animate-spin-slow-reverse">
                <div className="absolute top-0 left-1/2 w-3 h-3 bg-blue-400 rounded-full transform -translate-x-1/2"></div>
                <div className="absolute bottom-0 left-1/2 w-3 h-3 bg-purple-400 rounded-full transform -translate-x-1/2"></div>
                <div className="absolute top-1/2 left-0 w-3 h-3 bg-pink-400 rounded-full transform -translate-y-1/2"></div>
                <div className="absolute top-1/2 right-0 w-3 h-3 bg-green-400 rounded-full transform -translate-y-1/2"></div>
              </div>
            </div>
          </div>

          {/* Enhanced Info Section */}
          <div className="text-white space-y-8">
            {/* Header with enhanced animation */}
            <div className="animate-fadeInUp">
              <h1 className="text-4xl lg:text-5xl font-bold mb-3 bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent">
                مرحباً بك! 👋
              </h1>
              <p className="text-xl text-gray-200">
                في نظام إدارة التنمية الإدارية
              </p>
            </div>

            {/* Enhanced Content Box with 3D flip effect */}
            <div
              className={`min-h-60 p-8 rounded-3xl backdrop-blur-xl bg-white/10 border border-white/20 transform transition-all duration-700 shadow-2xl ${
                isFlipping 
                  ? (direction > 0 
                      ? "scale-95 opacity-0 rotate-y-90" 
                      : "scale-95 opacity-0 -rotate-y-90")
                  : "scale-100 opacity-100"
              }`}
              style={{
                perspective: "1000px",
                transformStyle: "preserve-3d",
              }}
            >
              <div
                className={`space-y-5 transform transition-all duration-700 ${
                  isFlipping ? "scale-0" : "scale-100"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl bg-gradient-to-br ${currentContent.color} shadow-lg`}>
                    {currentContent.icon}
                  </div>
                  <h2
                    className={`text-3xl font-bold bg-gradient-to-r ${currentContent.color} bg-clip-text text-transparent`}
                  >
                    {currentContent.title}
                  </h2>
                </div>
                <p className="text-gray-200 text-lg leading-relaxed pr-2">
                  {currentContent.description}
                </p>
                
                {/* Feature highlights */}
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-200 rounded-full text-sm">سهل الاستخدام</span>
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-200 rounded-full text-sm">آمن وموثوق</span>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-200 rounded-full text-sm">حديث وسريع</span>
                </div>
              </div>
            </div>

            {/* Enhanced Progress Indicators */}
            <div className="flex gap-3 justify-center flex-wrap">
              {onboardingContent.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => goToSlide(idx)}
                  className={`h-3 rounded-full transition-all duration-500 transform hover:scale-125 ${
                    idx === currentIndex
                      ? `w-10 bg-gradient-to-r ${currentContent.color} shadow-lg`
                      : "w-3 bg-white/30 hover:bg-white/50"
                  }`}
                  aria-label={`الشريحة ${idx + 1}`}
                ></button>
              ))}
            </div>

            {/* Enhanced Navigation Controls */}
            <div className="flex items-center justify-between pt-4">
              <button
                onClick={prevSlide}
                className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all backdrop-blur-sm border border-white/20"
              >
                <ArrowRight className="w-5 h-5 rotate-180" />
                <span>السابق</span>
              </button>
              
              <button
                onClick={toggleAutoPlay}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all backdrop-blur-sm border border-white/20 text-sm"
              >
                {isAutoPlaying ? "⏸️ إيقاف" : "▶️ تشغيل"}
              </button>
              
              <button
                onClick={nextSlide}
                className="flex items-center gap-2 px-5 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all backdrop-blur-sm border border-white/20"
              >
                <span>التالي</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Enhanced Action Button */}
            <div className="pt-4">
              <button
                onClick={handleProceed}
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-2xl transition-all transform hover:scale-105 shadow-2xl flex items-center justify-center gap-3 text-lg"
              >
                <span>بدء استخدام النظام</span>
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Bottom info */}
        <div className="mt-16 text-center text-gray-300">
          <p className="text-lg">© {new Date().getFullYear()} مديرية التنمية الإدارية - جميع الحقوق محفوظة</p>
          <p className="text-sm mt-2 opacity-70">نظام متطور لإدارة الموارد البشرية والوثائق</p>
        </div>
      </div>

      {/* Enhanced custom animations */}
      <style jsx>{`
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

        @keyframes fadeInUp {
          from { 
            opacity: 0; 
            transform: translateY(30px);
          }
          to { 
            opacity: 1; 
            transform: translateY(0);
          }
        }

        @keyframes rotate-y-90 {
          from { 
            opacity: 1; 
            transform: perspective(1000px) rotateY(0deg);
          }
          to { 
            opacity: 0; 
            transform: perspective(1000px) rotateY(90deg);
          }
        }

        @keyframes rotate-y--90 {
          from { 
            opacity: 1; 
            transform: perspective(1000px) rotateY(0deg);
          }
          to { 
            opacity: 0; 
            transform: perspective(1000px) rotateY(-90deg);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-1000 {
          animation-delay: 1s;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animate-spin-slow {
          animation: spin-slow 12s linear infinite;
        }

        .animate-spin-slow-reverse {
          animation: spin-slow-reverse 15s linear infinite;
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .rotate-y-90 {
          animation: rotate-y-90 0.6s ease-in-out forwards;
        }

        .-rotate-y-90 {
          animation: rotate-y--90 0.6s ease-in-out forwards;
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}