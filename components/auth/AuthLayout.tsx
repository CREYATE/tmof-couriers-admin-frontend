import React from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-8 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
