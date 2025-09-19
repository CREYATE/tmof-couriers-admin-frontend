"use client";

import React from "react";
import { LogOut } from "lucide-react";

const menuItems = [
	{ label: "Dashboard", tab: "dashboard" },
	{ label: "Orders", tab: "orders" },
	{ label: "Analytics", tab: "analytics" },
	{ label: "Access Logs", tab: "access-logs" },
	{ label: "Settings", tab: "settings" },
	{ label: "Pricing", tab: "pricing" },
	{ label: "Support", tab: "support" },
];

export default function AdminSidebar({
	activeTab,
	setActiveTab,
}: {
	activeTab: string;
	setActiveTab: (tab: string) => void;
}) {
	return (
		<aside className="w-full h-full bg-gray-100 border-r border-gray-200 flex flex-col justify-between min-h-[300px]">
			<nav className="flex flex-col gap-2 py-8 px-6 flex-1">
				{menuItems.map((item) => (
					<button
						key={item.tab}
						type="button"
						tabIndex={0}
						onClick={() => setActiveTab(item.tab)}
						className={`block w-full text-left font-medium rounded-lg px-6 py-3 text-lg transition-all text-[#0C0E29] hover:text-[#ffd215] hover:bg-[#0C0E29]/10 focus:outline-none focus:ring-2 focus:ring-[#ffd215] ${
							activeTab === item.tab ? "bg-[#ffd215] text-black" : ""
						}`}
					>
						{item.label}
					</button>
				))}
			</nav>
			<div className="px-6 pb-6">
				<button
					className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg"
					onClick={() => (window.location.href = "/")}
				>
					<LogOut className="h-5 w-5" />
					Log out
				</button>
			</div>
		</aside>
	);
}
