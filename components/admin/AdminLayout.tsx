"use client"

import React, { useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminDashboard from "@/components/admin/AdminDashboard";
import OrderManagement from "@/components/admin/OrderManagement";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import AccessLogViewer from "@/components/admin/AccessLogViewer";
import BusinessSettings from "@/components/admin/BusinessSettings";
import PricingConfiguration from "@/components/admin/PricingConfiguration";
import SupportModeration from "@/components/admin/SupportModeration";

function renderSection(tab: string) {
  switch (tab) {
    case "dashboard":
      return <AdminDashboard />;
    case "orders":
      return <OrderManagement />;
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
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="ml-64 pt-20 h-[calc(100vh-80px)] overflow-y-auto p-4">
        {renderSection(activeTab)}
      </main>
    </div>
  );
}
