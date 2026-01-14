import { useOutletContext, Navigate } from "react-router-dom";
import { checkPermission } from "../utils/permissionHelper";

export default function RequirePermission({ permission, children }) {
  console.log("---------------permission");
  console.log(permission);

  const context = useOutletContext();
  const userInfo = context?.userInfo;

  if (!userInfo) {
    return (
      <div className="flex items-center justify-center h-full p-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (userInfo.role === "admin") {
    return children;
  }
  console.log(
    "============================permisions checkeing done successffully------------"
  );
  console.log(userInfo);
  console.log(checkPermission(permission, userInfo));
  if (checkPermission(permission, userInfo)) {
    return children;
  }

  return (
    <div className="flex flex-col items-center justify-center h-full py-20">
      <div className="text-6xl mb-4">🚫</div>
      <h2 className="text-2xl font-bold text-white mb-2">غير مصرح</h2>
      <p className="text-gray-600">ليس لديك صلاحية للوصول إلى هذه الصفحة</p>
    </div>
  );
}
