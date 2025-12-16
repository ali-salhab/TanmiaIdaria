import React from "react";

const WelcomeMessage = () => {
  const role = localStorage.getItem("role");
  const username = localStorage.getItem("username");

  if (role === "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-10">
        <div className="text-6xl mb-4">👋</div>
        <h2 className="text-2xl font-bold mb-2">مرحباً بك في لوحة التحكم</h2>
        <p>يرجى اختيار قسم من القائمة الجانبية للبدء</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-500 p-10">
      <div className="text-6xl mb-4">🌟</div>
      <h2 className="text-2xl font-bold mb-2">
        أهلاً بك {username || "عزيزي الموظف"}
      </h2>
      <p>نتمنى لك يوماً سعيداً ومليئاً بالإنجازات</p>
    </div>
  );
};

export default WelcomeMessage;
