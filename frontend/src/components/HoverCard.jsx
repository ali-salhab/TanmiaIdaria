import { useState } from "react";

export default function HoverCard({
  title,
  description,
  hoverContent,
  image,
  className = "",
  onClick,
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`relative group cursor-pointer overflow-hidden rounded-xl bg-gradient-to-br from-white/90 via-white/80 to-white/70 backdrop-blur-sm border border-gray-200/50 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:scale-105 ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Background Image or Gradient */}
      {image && (
        <div className="absolute inset-0 bg-cover bg-center opacity-20 group-hover:opacity-30 transition-opacity duration-500">
          <img src={image} alt={title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Main Content */}
      <div className="relative p-6 h-64 flex flex-col justify-between">
        {/* Title and Description */}
        <div className="text-center">
          <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-teal-600 transition-colors duration-300">
            {title}
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
        </div>

        {/* Hover Content Overlay */}
        <div
          className={`absolute inset-0 bg-gradient-to-br from-teal-500/95 via-blue-500/95 to-purple-500/95 backdrop-blur-sm flex items-center justify-center p-6 text-white transition-all duration-500 transform ${
            isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">
              {hoverContent.title}
            </div>
            <p className="text-sm leading-relaxed">
              {hoverContent.description}
            </p>
            {hoverContent.stats && (
              <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                {hoverContent.stats.map((stat, idx) => (
                  <div key={idx} className="text-center">
                    <div className="font-bold text-lg">{stat.value}</div>
                    <div className="text-teal-100">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
        <div className="absolute bottom-4 left-4 w-6 h-6 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-300"></div>
      </div>

      {/* Shine Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
    </div>
  );
}
