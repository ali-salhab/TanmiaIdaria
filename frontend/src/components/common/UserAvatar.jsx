import { useState } from "react";

/**
 * UserAvatar Component
 * Displays user avatar with online status indicator
 * 
 * @param {Object} props
 * @param {string} props.image - User profile image URL
 * @param {string} props.username - Username for initials fallback
 * @param {boolean} props.isOnline - Whether user is online
 * @param {string} props.size - Size: 'sm', 'md', 'lg', 'xl'
 * @param {string} props.className - Additional CSS classes
 */
export default function UserAvatar({ 
  image, 
  username = "User", 
  isOnline = false, 
  size = "md",
  className = "" 
}) {
  const [imageError, setImageError] = useState(false);
  
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-12 h-12 text-base",
    xl: "w-16 h-16 text-lg",
  };

  const dotSizes = {
    sm: "w-2.5 h-2.5",
    md: "w-3 h-3",
    lg: "w-3.5 h-3.5",
    xl: "w-4 h-4",
  };

  const dotPositions = {
    sm: "bottom-0 right-0",
    md: "bottom-0 right-0",
    lg: "bottom-0.5 right-0.5",
    xl: "bottom-1 right-1",
  };

  const initials = username
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random&color=fff&size=128&bold=true`;

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 ${
        isOnline ? "border-emerald-500" : "border-gray-300"
      } bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg`}>
        {image && !imageError ? (
          <img
            src={image}
            alt={username}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <img
            src={defaultAvatar}
            alt={username}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to initials if avatar service fails
              e.target.style.display = "none";
              e.target.parentElement.innerHTML = initials;
            }}
          />
        )}
      </div>
      
      {/* Online Status Indicator */}
      {isOnline && (
        <span
          className={`absolute ${dotPositions[size]} ${dotSizes[size]} bg-emerald-500 border-2 border-white rounded-full shadow-lg animate-pulse`}
          title="متصل الآن"
        />
      )}
    </div>
  );
}

