"use client";

import React from "react";
import { Menu } from "lucide-react";

export default function AdminHeader({ onMenuClick }: { 
  onMenuClick?: () => void;
}) {
  return (
    <header className="px-4 py-4 border-b border-[#0C0E29] bg-[#ffd215] text-black flex items-center justify-between md:px-6 fixed top-0 left-0 w-full z-[100]">
      {/* Mobile menu button */}
      <button
        className="lg:hidden p-2 rounded-md hover:bg-yellow-200 transition-colors"
        onClick={onMenuClick}
        aria-label="Toggle menu"
      >
        <Menu className="h-6 w-6 text-black" />
      </button>
      
      {/* Desktop spacer - invisible on mobile */}
      <div className="hidden lg:block"></div>
      
      {/* Logo - always on the right */}
      <img src="/tmof logo.png" alt="TMOF Couriers Logo" className="h-8 sm:h-10 w-auto" />
    </header>
  );
}
