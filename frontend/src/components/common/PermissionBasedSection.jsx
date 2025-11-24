import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { permissionDefinitions } from "../../utils/permissionDefinitions";
import { checkPermission } from "../../utils/permissionHelper";

const PermissionBasedSection = ({ section, user }) => {
  const navigate = useNavigate();

  // Get all permissions that user has for this section
  const sectionPermissions = useMemo(() => {
    if (!user || !section.requiredPermissions) return [];
    
    return section.requiredPermissions.filter(permKey => 
      checkPermission(permKey, user) && permissionDefinitions[permKey]
    );
  }, [user, section]);

  const hasMultiplePerms = sectionPermissions.length > 1;

  return (
    <button
      key={section.category}
      onClick={() => navigate(section.path)}
      className={`relative group bg-white shadow-lg rounded-2xl p-5 md:p-6 cursor-pointer overflow-hidden border-2 border-transparent transition-all transform hover:-translate-y-2 hover:shadow-2xl hover:border-emerald-200 text-right w-full`}
    >
      {/* Gradient Background on Hover */}
      <div
        className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br ${section.color}`}
      ></div>

      {/* Content */}
      <div className="relative z-10">
        {/* Icon */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-5xl md:text-6xl transform group-hover:scale-110 transition-transform duration-300">
            {section.icon}
          </div>
          {hasMultiplePerms && (
            <div className="bg-emerald-100 text-emerald-700 rounded-full px-2 py-1 text-xs font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {sectionPermissions.length}
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg md:text-xl font-bold text-gray-800 group-hover:text-white transition-colors mb-2">
          {section.label}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 group-hover:text-white/90 transition-colors mb-3">
          {section.description}
        </p>

        {/* Permissions Badge */}
        {sectionPermissions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {sectionPermissions.slice(0, 2).map((permKey) => {
              const perm = permissionDefinitions[permKey];
              if (!perm) return null;
              return (
                <span
                  key={permKey}
                  className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded-lg group-hover:bg-white/20 group-hover:text-white transition-colors font-medium"
                >
                  {perm.action}
                </span>
              );
            })}
            {sectionPermissions.length > 2 && (
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-lg group-hover:bg-white/20 group-hover:text-white transition-colors font-medium">
                +{sectionPermissions.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Arrow Indicator */}
        <div className="mt-4 flex items-center text-emerald-600 group-hover:text-white transition-colors">
          <span className="text-sm font-medium">
            افتح القسم
          </span>
          <span className="mr-2 transform group-hover:translate-x-1 transition-transform">
            →
          </span>
        </div>
      </div>
    </button>
  );
};

export default PermissionBasedSection;