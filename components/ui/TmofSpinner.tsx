import React from "react";

export default function TmofSpinner({ show = false }: { show?: boolean }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-sm">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-20 w-20 border-t-8 border-b-8 border-[#ffd215] border-l-8 border-[#0C0E29] border-r-8 border-[#0C0E29]" />
        <span className="mt-4 text-xl font-bold text-[#0C0E29]">Loading...</span>
      </div>
    </div>
  );
}
