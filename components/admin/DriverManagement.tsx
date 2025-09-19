"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, User, Mail, Phone, Home, Car, Image as ImageIcon, Edit, Ban, Pencil } from "lucide-react";

// Mock driver data with profilePic
const mockDrivers = [
	{ id: "1", name: "John Doe", email: "john@example.com", phone: "+27 11 123 4567", status: "active", profilePic: "" },
	{ id: "2", name: "Jane Smith", email: "jane@example.com", phone: "+27 11 987 6543", status: "active", profilePic: "" }
];

export default function DriverManagement() {
	const [drivers, setDrivers] = useState(mockDrivers);
	const [showOnboard, setShowOnboard] = useState(false);
	const [onboardData, setOnboardData] = useState({
		name: "",
		email: "",
		phone: "",
		address: "",
		carModel: "",
		regNumber: "",
		profilePic: "",
		idCopy: null as File | null,
		clearance: null as File | null,
		license: null as File | null,
	});
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleDisable = (id: string) => {
		setDrivers(drivers.map(d => d.id === id ? { ...d, status: "disabled" } : d));
	};
	const handleEdit = (id: string) => {
		// Implement edit logic
		alert("Edit driver " + id);
	};
	const handleOnboard = (e: React.FormEvent) => {
		e.preventDefault();
		setDrivers([
			...drivers,
			{ id: (drivers.length + 1).toString(), name: onboardData.name, email: onboardData.email, phone: onboardData.phone, status: "active", profilePic: onboardData.profilePic }
		]);
		setShowOnboard(false);
		setOnboardData({ name: "", email: "", phone: "", address: "", carModel: "", regNumber: "", profilePic: "", idCopy: null, clearance: null, license: null });
	};
	const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = ev => {
				setOnboardData(data => ({ ...data, profilePic: ev.target?.result as string }));
			};
			reader.readAsDataURL(file);
		}
	};

	return (
		<div className="space-y-8">
			<div className="flex justify-between items-center mt-6 mb-2">
				<h2 className="text-2xl font-bold">Driver Management & Onboarding</h2>
				<Button onClick={() => setShowOnboard(true)} className="bg-tmof-yellow text-black flex items-center gap-2 mt-2"><Plus />Onboard Driver</Button>
			</div>
			<div className="mt-6" />
			{/* Driver List */}
			<Card>
				<CardHeader>
					<CardTitle>Drivers</CardTitle>
				</CardHeader>
				<CardContent>
					<table className="w-full text-left">
						<thead>
							<tr className="border-b">
								<th className="py-2">Profile</th>
								<th>Name</th>
								<th>Email</th>
								<th>Phone</th>
								<th>Status</th>
								<th className="text-center">Actions</th>
							</tr>
						</thead>
						<tbody>
							{drivers.map(driver => (
								<tr key={driver.id} className="border-b">
									<td className="py-2">
										<div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
											{driver.profilePic ? (
												<img src={driver.profilePic} alt="Profile" className="object-cover w-full h-full" />
											) : (
												<User className="h-6 w-6 text-gray-400" />
											)}
										</div>
									</td>
									<td>{driver.name}</td>
									<td>{driver.email}</td>
									<td>{driver.phone}</td>
									<td>{driver.status}</td>
									<td className="flex gap-2 justify-center items-center py-2">
										<Button size="sm" variant="outline" onClick={() => handleEdit(driver.id)}><Edit className="h-4 w-4" /></Button>
										<Button size="sm" variant="destructive" onClick={() => handleDisable(driver.id)}><Ban className="h-4 w-4" /></Button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</CardContent>
			</Card>
			{/* Onboarding Modal */}
			{showOnboard && (
				<div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
					<form onSubmit={handleOnboard} className="bg-white rounded-lg shadow-lg p-8 w-full max-w-3xl relative">
						<button type="button" className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" onClick={() => setShowOnboard(false)}>&times;</button>
						<div className="flex justify-end mb-4">
							<div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden relative">
								{onboardData.profilePic ? (
									<img src={onboardData.profilePic} alt="Profile" className="object-cover w-full h-full" />
								) : (
									<ImageIcon className="h-12 w-12 text-gray-400" />
								)}
								<button
									type="button"
									className="absolute bottom-2 right-2 bg-white rounded-full p-1 shadow hover:bg-gray-100"
									onClick={() => fileInputRef.current?.click()}
									tabIndex={-1}
								>
									<Pencil className="h-4 w-4 text-gray-600" />
								</button>
								<input
									ref={fileInputRef}
									type="file"
									accept="image/*"
									className="hidden"
									onChange={handleProfilePicChange}
								/>
							</div>
						</div>
						<div className="grid grid-cols-2 gap-6 mb-4">
							<div className="space-y-4">
								<Label>Personal Details</Label>
								<Input placeholder="Full Name" value={onboardData.name} onChange={e => setOnboardData({ ...onboardData, name: e.target.value })} required />
							</div>
							<div className="space-y-4">
								<Label>Contact Details</Label>
								<Input placeholder="Email" value={onboardData.email} onChange={e => setOnboardData({ ...onboardData, email: e.target.value })} required />
								<Input placeholder="Phone" value={onboardData.phone} onChange={e => setOnboardData({ ...onboardData, phone: e.target.value })} required />
							</div>
							<div className="space-y-4">
								<Label>Address Details</Label>
								<Input placeholder="Address" value={onboardData.address} onChange={e => setOnboardData({ ...onboardData, address: e.target.value })} required />
							</div>
							<div className="space-y-4">
								<Label>Vehicle Details</Label>
								<Input placeholder="Car Model" value={onboardData.carModel} onChange={e => setOnboardData({ ...onboardData, carModel: e.target.value })} required />
								<Input placeholder="Registration Number" value={onboardData.regNumber} onChange={e => setOnboardData({ ...onboardData, regNumber: e.target.value })} required />
							</div>
							<div className="space-y-4 col-span-2">
								<Label>Attachments</Label>
								<div className="flex flex-col md:flex-row gap-4">
									<div className="flex-1">
										<Input type="file" accept="application/pdf,image/*" onChange={e => setOnboardData({ ...onboardData, idCopy: e.target.files?.[0] || null })} />
										<span className="text-xs text-gray-500">Certified ID Copy</span>
									</div>
									<div className="flex-1">
										<Input type="file" accept="application/pdf,image/*" onChange={e => setOnboardData({ ...onboardData, clearance: e.target.files?.[0] || null })} />
										<span className="text-xs text-gray-500">Criminal Clearance Certificate</span>
									</div>
									<div className="flex-1">
										<Input type="file" accept="application/pdf,image/*" onChange={e => setOnboardData({ ...onboardData, license: e.target.files?.[0] || null })} />
										<span className="text-xs text-gray-500">Driver's License</span>
									</div>
								</div>
							</div>
						</div>
						<div className="mt-6 flex justify-end">
							<Button type="submit" className="bg-tmof-yellow text-black">Onboard Driver</Button>
						</div>
					</form>
				</div>
			)}
		</div>
	);
}
