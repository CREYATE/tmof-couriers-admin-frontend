"use client"

import React, { useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminDashboard from "@/components/admin/AdminDashboard";
import DriverManagement from "@/components/admin/DriverManagement";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import AccessLogViewer from "@/components/admin/AccessLogViewer";
import BusinessSettings from "@/components/admin/BusinessSettings";
import PricingConfiguration from "@/components/admin/PricingConfiguration";
import SupportModeration from "@/components/admin/SupportModeration";

function renderSection(tab: string) {
  switch (tab) {
    case "dashboard":
      return <AdminDashboard />;
    case "drivers":
      return <DriverManagement />;
    case "analytics":
      return <AnalyticsDashboard />;
    case "access-logs":
      return <AccessLogViewer />;
    case "settings":
      return <BusinessSettings />;
    case "pricing":
      return <PricingConfiguration />;
    case "support":
      return <SupportModeration />;
    default:
      return <div className="p-8">Select a section from the sidebar.</div>;
  }
}

export default function AdminLayout({ children }: { children?: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader onMenuClick={toggleSidebar} />
      <AdminSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
      />
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}
      <main className="lg:ml-64 pt-20 min-h-[calc(100vh-80px)] overflow-y-auto p-2 sm:p-4 lg:p-6">
        {renderSection(activeTab)}
      </main>
    </div>
  );
}
