"use client";
import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MapPin, User } from "lucide-react";

// Mock driver login data with profilePic
const mockLogins = [
	{
		id: "1",
		name: "John Doe",
		profilePic: "",
		login: "2025-09-19 08:15",
		logout: "2025-09-19 17:00",
		location: "Sandton, Johannesburg",
	},
	{
		id: "2",
		name: "Jane Smith",
		profilePic: "",
		login: "2025-09-19 09:00",
		logout: "2025-09-19 16:30",
		location: "Pretoria CBD",
	},
	{
		id: "3",
		name: "Sam Mokoena",
		profilePic: "",
		login: "2025-09-19 07:45",
		logout: "2025-09-19 15:50",
		location: "Rosebank, Johannesburg",
	},
];

const AccessLogViewer = () => {
	const [logs] = useState(mockLogins);
	return (
		<div className="space-y-8">
			<h2 className="text-2xl font-bold mt-6 mb-2">System Login Tracker</h2>
			<div className="mt-6" />
			<Card>
				<CardHeader>
					<CardTitle>Driver Login Activity</CardTitle>
				</CardHeader>
				<CardContent>
					<table className="w-full text-left">
						<thead>
							<tr className="border-b">
								<th className="py-2">Driver</th>
								<th>Login Time</th>
								<th>Logout Time</th>
								<th>Last Known Location</th>
							</tr>
						</thead>
						<tbody>
							{logs.map((log) => (
								<tr key={log.id} className="border-b">
									<td className="py-2">
										<div className="flex items-center gap-3">
											<div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
												{log.profilePic ? (
													<img
														src={log.profilePic}
														alt="Profile"
														className="object-cover w-full h-full"
													/>
												) : (
													<User className="h-6 w-6 text-gray-400" />
												)}
											</div>
											<span>{log.name}</span>
										</div>
									</td>
									<td>{log.login}</td>
									<td>{log.logout}</td>
									<td className="flex items-center gap-2 py-2">
										<MapPin className="h-4 w-4 text-tmof-yellow" />
										<span>{log.location}</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</CardContent>
			</Card>
		</div>
	);
};

export default AccessLogViewer;
