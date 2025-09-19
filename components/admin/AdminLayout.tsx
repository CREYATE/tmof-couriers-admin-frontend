"use client"

import React, { useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
// Import your admin section components here
import AdminDashboard from "@/components/admin/AdminDashboard";
// ...import other admin section components as needed

function renderSection(tab: string) {
  switch (tab) {
    case "dashboard":
      return <AdminDashboard />;
    // Add cases for other sections, e.g.:
    // case "orders":
    //   return <OrderManagement />;
    // case "analytics":
    //   return <AnalyticsDashboard />;
    // ...
    default:
      return <div className="p-8">Select a section from the sidebar.</div>;
  }
}

export default function AdminLayout({ children }: { children?: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <div className="pt-20 flex flex-row min-h-[calc(100vh-80px)]">
        <div className="hidden md:block w-64 h-full bg-gray-100 border-r border-gray-200">
          <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
        <main className="flex-1 p-4">
          {renderSection(activeTab)}
        </main>
      </div>
    </div>
  );
}
