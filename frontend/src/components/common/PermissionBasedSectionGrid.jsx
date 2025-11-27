import { useMemo } from "react";
import PermissionBasedSection from "./PermissionBasedSection";
import { permissionDefinitions } from "../../utils/permissionDefinitions";

const PermissionBasedSectionGrid = ({ allowedSections, user }) => {
  // Group sections by category for better organization
  const groupedSections = useMemo(() => {
    const groups = {};
    allowedSections.forEach((section) => {
      // Get category from the first permission or use section label
      let category = "أخرى";
      if (
        section.requiredPermissions &&
        section.requiredPermissions.length > 0
      ) {
        const firstPerm = permissionDefinitions[section.requiredPermissions[0]];
        category = firstPerm?.category || section.label;
      } else {
        category = section.label;
      }

      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(section);
    });
    return groups;
  }, [allowedSections]);

  if (allowedSections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl shadow-xl border-2 border-dashed border-gray-300">
        <div className="text-7xl mb-6">🔒</div>
        <h3 className="text-2xl font-bold text-gray-800 mb-3">
          لا توجد صلاحيات متاحة
        </h3>
        <p className="text-gray-600 text-center max-w-md mb-6">
          لم يتم منحك أي صلاحيات للوصول إلى أقسام النظام. يرجى التواصل مع
          المسؤول لتفعيل الصلاحيات المناسبة.
        </p>
        <div className="flex items-center gap-2 text-emerald-600">
          <span className="text-2xl">🔒</span>
          <span className="font-medium">في انتظار تفعيل الصلاحيات</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {Object.entries(groupedSections).map(([category, sections]) => (
        <div key={category} className="">
          <div className="">
            {sections.map((section) => (
              <PermissionBasedSection
                key={section.category}
                section={section}
                user={user}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PermissionBasedSectionGrid;
