"use client";

import React from "react";
import {
	LogOut,
	LayoutDashboard,
	Car,
	BarChart2,
	BookOpen,
	Settings,
	DollarSign,
	Headphones,
	X,
} from "lucide-react";

const menuItems = [
	{ label: "Dashboard", tab: "dashboard", icon: LayoutDashboard },
	{ label: "Drivers", tab: "drivers", icon: Car },
	{ label: "Analytics", tab: "analytics", icon: BarChart2 },
	{ label: "Access Logs", tab: "access-logs", icon: BookOpen },
	// { label: "Pricing", tab: "pricing", icon: DollarSign },
	// { label: "Support", tab: "support", icon: Headphones },
	// { label: "Settings", tab: "settings", icon: Settings },
];

export default function AdminSidebar({
	activeTab,
	setActiveTab,
	isOpen,
	onClose,
}: {
	activeTab: string;
	setActiveTab: (tab: string) => void;
	isOpen: boolean;
	onClose: () => void;
}) {
	const handleTabChange = (tab: string) => {
		setActiveTab(tab);
		onClose(); // Close sidebar on mobile after selection
	};

	return (
		<>
			{/* Desktop Sidebar */}
			<aside className="hidden lg:block fixed top-20 left-0 z-[90] w-64 h-[calc(100vh-80px)] bg-gray-100 border-r border-gray-200 flex flex-col justify-between">
				<nav className="flex flex-col gap-3 py-6 px-3 flex-1">
					{menuItems.map((item) => {
						const Icon = item.icon;
						return (
							<button
								key={item.tab}
								type="button"
								tabIndex={0}
								onClick={() => setActiveTab(item.tab)}
								className={`flex items-center gap-3 w-full text-left font-medium rounded-lg px-5 py-2.5 text-base transition-all text-[#0C0E29] hover:text-[#ffd215] hover:bg-[#0C0E29]/10 focus:outline-none focus:ring-2 focus:ring-[#ffd215] ${
									activeTab === item.tab ? "bg-[#ffd215] text-black" : ""
								}`}
							>
								<Icon className="h-5 w-5" />
								<span>{item.label}</span>
							</button>
						);
					})}
					<div className="flex-1" />
				</nav>
				<div className="px-5 pb-6">
					<button
						className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg mt-2"
						onClick={() => (window.location.href = "/")}
					>
						<LogOut className="h-5 w-5" />
						Log out
					</button>
				</div>
			</aside>

			{/* Mobile Sidebar */}
			<aside className={`lg:hidden fixed top-0 left-0 z-50 w-80 h-full bg-white shadow-2xl transform transition-transform duration-300 ease-in-out ${
				isOpen ? 'translate-x-0' : '-translate-x-full'
			}`}>
				{/* Mobile header */}
				<div className="flex items-center justify-between p-4 border-b bg-[#ffd215]">
					<img src="/tmof logo.png" alt="TMOF Couriers Logo" className="h-8 w-auto" />
					<button
						onClick={onClose}
						className="p-2 rounded-md hover:bg-yellow-200 transition-colors"
						aria-label="Close menu"
					>
						<X className="h-6 w-6 text-black" />
					</button>
				</div>

				{/* Mobile navigation */}
				<nav className="flex flex-col py-6 px-4 flex-1 overflow-y-auto">
					{menuItems.map((item) => {
						const Icon = item.icon;
						return (
							<button
								key={item.tab}
								type="button"
								tabIndex={0}
								onClick={() => handleTabChange(item.tab)}
								className={`flex items-center gap-4 w-full text-left font-medium rounded-lg px-4 py-3 text-base transition-all mb-2 ${
									activeTab === item.tab 
										? "bg-[#ffd215] text-black" 
										: "text-[#0C0E29] hover:bg-[#ffd215]/20 hover:text-[#0C0E29]"
								}`}
							>
								<Icon className="h-6 w-6" />
								<span className="text-lg">{item.label}</span>
							</button>
						);
					})}
				</nav>

				{/* Mobile logout button */}
				<div className="p-4 border-t">
					<button
						className="w-full flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-3 rounded-lg text-lg"
						onClick={() => (window.location.href = "/")}
					>
						<LogOut className="h-6 w-6" />
						Log out
					</button>
				</div>
			</aside>
		</>
	);
}
