"use client";
// AdminDashboard decoupled from Supabase, using mock data
// import AdminLayout from "@/components/admin/AdminLayout";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Package, Users, AlertTriangle, Shield, MapPin, Truck, CheckCircle2, XCircle } from "lucide-react";

// --- Types ---
interface Order {
	id: number;
	trackingNumber: string;
	distance: number;
	price: number;
	status: string;
	pickupAddress: string;
	deliveryAddress: string;
	recipientName: string;
	recipientPhone: string;
	recipientEmail?: string;
	deliveryNotes?: string;
	preferredTime?: string;
	serviceType: string;
	createdAt: string;
	customerName?: string;
}

const getStatusBadgeColor = (status: string) => {
	switch (status) {
		case "DELIVERED":
			return "bg-green-600 text-white";
		case "CANCELLED":
			return "bg-red-600 text-white";
		case "IN_TRANSIT":
			return "bg-orange-500 text-white";
		case "AWAITING_COLLECTION":
		case "PAID":
			return "bg-yellow-500 text-black";
		case "COLLECTED":
			return "bg-blue-500 text-white";
		default:
			return "bg-gray-200 text-gray-800";
	}
};

// --- Mock Data ---
const mockDrivers = [
	{ id: "1", name: "John Doe", email: "john@example.com", phone: "+27 11 123 4567", status: "available", lat: -26.2041, lng: 28.0473 },
	{ id: "2", name: "Jane Smith", email: "jane@example.com", phone: "+27 11 987 6543", status: "available", lat: -25.7479, lng: 28.2293 }
];
const mockOrders: Order[] = [
	{
		id: 1,
		trackingNumber: "TMOF-0001",
		distance: 0,
		price: 100,
		status: "AWAITING_COLLECTION",
		pickupAddress: "123 Main St, Sandton",
		deliveryAddress: "456 Oak Ave, Rosebank",
		recipientName: "Alice",
		recipientPhone: "+27 12 345 6789",
		serviceType: "standard",
		createdAt: new Date().toISOString(),
		customerName: "Alice"
	},
	{
		id: 2,
		trackingNumber: "TMOF-0002",
		distance: 0,
		price: 150,
		status: "AWAITING_COLLECTION",
		pickupAddress: "789 Pine Rd, Pretoria",
		deliveryAddress: "321 Maple Dr, Centurion",
		recipientName: "Bob",
		recipientPhone: "+27 98 765 4321",
		serviceType: "same_day",
		createdAt: new Date().toISOString(),
		customerName: "Bob"
	},
	{
		id: 3,
		trackingNumber: "TMOF-0003",
		distance: 0,
		price: 200,
		status: "IN_TRANSIT",
		pickupAddress: "12 Loop St, JHB CBD",
		deliveryAddress: "99 Main Rd, Midrand",
		recipientName: "Sam",
		recipientPhone: "+27 11 222 3333",
		serviceType: "instant",
		createdAt: new Date().toISOString(),
		customerName: "Sam"
	},
	{
		id: 4,
		trackingNumber: "TMOF-0004",
		distance: 0,
		price: 120,
		status: "DELIVERED",
		pickupAddress: "1 First Ave, Sandton",
		deliveryAddress: "2 Second Ave, Sandton",
		recipientName: "Lebo",
		recipientPhone: "+27 11 444 5555",
		serviceType: "standard",
		createdAt: new Date().toISOString(),
		customerName: "Lebo"
	},
	{
		id: 5,
		trackingNumber: "TMOF-0005",
		distance: 0,
		price: 90,
		status: "CANCELLED",
		pickupAddress: "5 Cancel St, JHB",
		deliveryAddress: "6 Cancel Ave, JHB",
		recipientName: "Zanele",
		recipientPhone: "+27 11 555 6666",
		serviceType: "swift_errand",
		createdAt: new Date().toISOString(),
		customerName: "Zanele"
	}
];

const AdminDashboard = () => {
  const [orders, setOrders] = useState<Order[]>(mockOrders);
  const [drivers, setDrivers] = useState(mockDrivers);
  const [activeTab, setActiveTab] = useState("order-management");
  const [assignModal, setAssignModal] = useState<{ open: boolean; order: Order | null }>({ open: false, order: null });

  // --- Statistics ---
  const stats = {
    awaiting: orders.filter(o => o.status === "AWAITING_COLLECTION").length,
    inTransit: orders.filter(o => o.status === "IN_TRANSIT").length,
    delivered: orders.filter(o => o.status === "DELIVERED").length,
    cancelled: orders.filter(o => o.status === "CANCELLED").length,
  };


	// --- Find Closest Driver (mock: random for now) ---
	function getClosestDriver(order: Order) {
		// In real use, calculate distance from order.pickupAddress to driver lat/lng
		// For now, just return the first driver
		return drivers[0];
	}

	// Show modal with sorted drivers (mock: all drivers)
	const [modalOrder, setModalOrder] = useState<Order | null>(null);
	const openAssignModal = (order: Order) => setModalOrder(order);
	const closeAssignModal = () => setModalOrder(null);

  return (
		<div className="p-6 space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Admin Dashboard</h1>
					<p className="text-gray-500 mt-1">TMOF Couriers Administration Panel</p>
				</div>
			</div>
			{/* Statistics Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Orders Awaiting Collection</CardTitle>
						<AlertTriangle className="h-4 w-4 text-yellow-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.awaiting}</div>
						<p className="text-xs text-muted-foreground">Ready for pickup</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Orders In-transit</CardTitle>
						<Truck className="h-4 w-4 text-orange-500" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.inTransit}</div>
						<p className="text-xs text-muted-foreground">On the road</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Orders Delivered</CardTitle>
						<CheckCircle2 className="h-4 w-4 text-green-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.delivered}</div>
						<p className="text-xs text-muted-foreground">Delivered successfully</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Orders Cancelled</CardTitle>
						<XCircle className="h-4 w-4 text-red-600" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.cancelled}</div>
						<p className="text-xs text-muted-foreground">Order cancelled</p>
					</CardContent>
				</Card>
			</div>
			<Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="order-management" className="flex items-center gap-2">
						<Package className="h-4 w-4" />
						Order Management
					</TabsTrigger>
					<TabsTrigger value="assigned-orders" className="flex items-center gap-2">
						<Users className="h-4 w-4" />
						Assigned Orders
					</TabsTrigger>
					<TabsTrigger value="live-tracking" className="flex items-center gap-2">
						<MapPin className="h-4 w-4" />
						Live Tracking
					</TabsTrigger>
				</TabsList>
				{/* Order Management Tab */}
					<TabsContent value="order-management">
						<Card>
							<CardHeader>
								<CardTitle>Orders Awaiting Collection</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{orders.filter(o => o.status === "AWAITING_COLLECTION").length === 0 ? (
										<div className="text-center py-8 text-muted-foreground">
											<Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
											<p>No orders awaiting collection</p>
										</div>
									) : (
										orders.filter(o => o.status === "AWAITING_COLLECTION").map(order => {
											const closestDriver = getClosestDriver(order);
											return (
												<div key={order.id} className="border rounded-lg p-4 space-y-3">
													<div className="flex justify-between items-start">
														<div>
															<h3 className="font-semibold">Order #{order.trackingNumber}</h3>
															<p className="text-sm text-muted-foreground">
																Customer: {order.customerName} ({order.recipientPhone})
															</p>
														</div>
														<span className={`px-2 py-1 text-xs rounded ${getStatusBadgeColor(order.status)}`}>
															{order.status}
														</span>
													</div>
													<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
														<div>
															<p className="font-medium">Pickup:</p>
															<p className="text-muted-foreground">{order.pickupAddress}</p>
														</div>
														<div>
															<p className="font-medium">Delivery:</p>
															<p className="text-muted-foreground">{order.deliveryAddress}</p>
														</div>
													</div>
													<div className="flex items-center justify-between">
														<div className="text-sm">
															<span className="font-medium">Service:</span> {order.serviceType}
															<span className="ml-4 font-medium">Amount:</span> R {order.price}
														</div>
													</div>
													<div className="flex items-center justify-between mt-2">
														<div className="text-xs text-muted-foreground">
															Closest driver: <span className="font-semibold text-black">{closestDriver?.name}</span>
														</div>
														<Button size="sm" onClick={() => openAssignModal(order)}>
															Assign to driver
														</Button>
													</div>
												</div>
											);
										})
									)}
								</div>
							</CardContent>
						</Card>
						{/* Assignment Modal */}
						{modalOrder && (
							<div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
								<div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg">
									<h3 className="text-lg font-bold mb-4">Assign Order #{modalOrder.trackingNumber}</h3>
									<div className="mb-4">
										<p className="mb-2 text-sm">Select a driver to assign (sorted by proximity):</p>
										<ul className="divide-y">
											{drivers.map(driver => (
												<li key={driver.id} className="py-2 flex items-center justify-between">
													<span>{driver.name} <span className="ml-2 text-xs text-muted-foreground">({driver.phone})</span></span>
													<Button size="sm" variant="outline" disabled>Assign</Button>
												</li>
											))}
										</ul>
									</div>
									<Button onClick={closeAssignModal} variant="outline">Close</Button>
								</div>
							</div>
						)}
					</TabsContent>
				{/* Assigned Orders Tab */}
				<TabsContent value="assigned-orders">
					<Card>
						<CardHeader>
							<CardTitle>Assigned Orders by Driver</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-6">
								{/* For now, just show drivers and stubbed assigned orders */}
								{drivers.map(driver => (
									<div key={driver.id} className="border rounded-lg p-4">
										<div className="flex items-center justify-between mb-2">
											<h3 className="font-semibold">{driver.name}</h3>
											<span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
												{driver.status.toUpperCase()}
											</span>
										</div>
										<div className="space-y-2">
											{/* Show assigned orders for this driver (stub) */}
											<p className="text-sm text-muted-foreground">No assigned orders yet.</p>
										</div>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>
				{/* Live Tracking Tab */}
				<TabsContent value="live-tracking">
					<Card>
						<CardHeader>
							<CardTitle>Live Tracking (In-Transit Orders)</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{orders.filter(o => o.status === "IN_TRANSIT").length === 0 ? (
									<div className="text-center py-8 text-muted-foreground">
										<MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
										<p>No orders in transit</p>
									</div>
								) : (
									orders.filter(o => o.status === "IN_TRANSIT").map(order => (
										<div key={order.id} className="border rounded-lg p-4">
											<div className="flex justify-between items-center">
												<div>
													<h3 className="font-semibold">Order #{order.trackingNumber}</h3>
													<p className="text-sm text-muted-foreground">{order.pickupAddress} → {order.deliveryAddress}</p>
												</div>
												<span className={`px-2 py-1 text-xs rounded ${getStatusBadgeColor(order.status)}`}>
													{order.status}
												</span>
											</div>
											<div className="mt-2 text-sm">
												<span className="font-medium">Recipient:</span> {order.recipientName} ({order.recipientPhone})
											</div>
											<div className="mt-1 text-sm">
												<span className="font-medium">Service:</span> {order.serviceType} | <span className="font-medium">Amount:</span> R {order.price}
											</div>
											<div className="mt-2 text-xs text-muted-foreground">Live tracking map will be shown here.</div>
										</div>
									))
								)}
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
};

export default AdminDashboard;
