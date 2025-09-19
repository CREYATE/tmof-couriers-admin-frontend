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
import { Package, Users, AlertTriangle, Shield, MapPin, Plus, Phone } from "lucide-react";

// Mock data
const mockDrivers = [
	{ id: "1", name: "John Doe", email: "john@example.com", phone: "+27 11 123 4567", status: "available" },
	{ id: "2", name: "Jane Smith", email: "jane@example.com", phone: "+27 11 987 6543", status: "available" }
];
const mockOrders = [
	{ id: "1", customer_name: "Alice", customer_email: "alice@email.com", customer_phone: "+27 12 345 6789", pickup_address: "123 Main St", dropoff_address: "456 Oak Ave", service_type: "standard", order_status: "created", quotation: 100, tracking_id: "TMOF-0001", created_at: new Date().toISOString() },
	{ id: "2", customer_name: "Bob", customer_email: "bob@email.com", customer_phone: "+27 98 765 4321", pickup_address: "789 Pine Rd", dropoff_address: "321 Maple Dr", service_type: "same_day", order_status: "pending", quotation: 150, tracking_id: "TMOF-0002", created_at: new Date().toISOString() }
];

const AdminDashboard = () => {
	const [activeOrders, setActiveOrders] = useState(2);
	const [availableDrivers, setAvailableDrivers] = useState(mockDrivers);
	const [pendingOrders, setPendingOrders] = useState(mockOrders);
	const [newOrderData, setNewOrderData] = useState({
		customer_name: '',
		customer_email: '',
		customer_phone: '',
		recipient_name: '',
		recipient_phone: '',
		pickup_address: '',
		dropoff_address: '',
		service_type: 'standard',
		package_details: '',
		special_instructions: ''
	});

	// Mock create order
	const createManualOrder = () => {
		setPendingOrders([
			...pendingOrders,
			{
				id: (pendingOrders.length + 1).toString(),
				customer_name: newOrderData.customer_name,
				customer_email: newOrderData.customer_email,
				customer_phone: newOrderData.customer_phone,
				pickup_address: newOrderData.pickup_address,
				dropoff_address: newOrderData.dropoff_address,
				service_type: newOrderData.service_type,
				order_status: 'created',
				quotation: 100,
				tracking_id: `TMOF-000${pendingOrders.length + 1}`,
				created_at: new Date().toISOString()
			}
		]);
		setNewOrderData({
			customer_name: '',
			customer_email: '',
			customer_phone: '',
			recipient_name: '',
			recipient_phone: '',
			pickup_address: '',
			dropoff_address: '',
			service_type: 'standard',
			package_details: '',
			special_instructions: ''
		});
	};

	// Mock assign order
	const assignOrderToDriver = (orderId: string, driverId: string) => {
		setPendingOrders(pendingOrders.map(order =>
			order.id === orderId ? { ...order, order_status: 'assigned', assigned_driver_id: driverId } : order
		));
	};

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
						<CardTitle className="text-sm font-medium">Active Orders</CardTitle>
						<Package className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{activeOrders}</div>
						<p className="text-xs text-muted-foreground">Currently processing</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Available Drivers</CardTitle>
						<Users className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{availableDrivers.length}</div>
						<p className="text-xs text-muted-foreground">Ready for assignments</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
						<AlertTriangle className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{pendingOrders.length}</div>
						<p className="text-xs text-muted-foreground">Awaiting assignment</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-sm font-medium">System Status</CardTitle>
						<Shield className="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold text-green-600">Online</div>
						<p className="text-xs text-muted-foreground">All systems operational</p>
					</CardContent>
				</Card>
			</div>
			<Tabs defaultValue="orders" className="space-y-6">
				<TabsList className="grid w-full grid-cols-4">
					<TabsTrigger value="orders" className="flex items-center gap-2">
						<Package className="h-4 w-4" />
						Order Management
					</TabsTrigger>
					<TabsTrigger value="create-order" className="flex items-center gap-2">
						<Plus className="h-4 w-4" />
						Create Order
					</TabsTrigger>
					<TabsTrigger value="assignments" className="flex items-center gap-2">
						<Users className="h-4 w-4" />
						Driver Assignment
					</TabsTrigger>
					<TabsTrigger value="tracking" className="flex items-center gap-2">
						<MapPin className="h-4 w-4" />
						Live Tracking
					</TabsTrigger>
				</TabsList>
				<TabsContent value="orders">
					<Card>
						<CardHeader>
							<CardTitle>Pending Orders</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{pendingOrders.length === 0 ? (
									<div className="text-center py-8 text-muted-foreground">
										<Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
										<p>No pending orders</p>
									</div>
								) : (
									pendingOrders.map((order) => (
										<div key={order.id} className="border rounded-lg p-4 space-y-3">
											<div className="flex justify-between items-start">
												<div>
													<h3 className="font-semibold">Order #{order.tracking_id}</h3>
													<p className="text-sm text-muted-foreground">
														Customer: {order.customer_name} ({order.customer_phone})
													</p>
												</div>
												<span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
													{order.order_status?.toUpperCase()}
												</span>
											</div>
											<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
												<div>
													<p className="font-medium">Pickup:</p>
													<p className="text-muted-foreground">{order.pickup_address}</p>
												</div>
												<div>
													<p className="font-medium">Delivery:</p>
													<p className="text-muted-foreground">{order.dropoff_address}</p>
												</div>
											</div>
											<div className="flex items-center justify-between">
												<div className="text-sm">
													<span className="font-medium">Service:</span> {order.service_type}
													<span className="ml-4 font-medium">Amount:</span> R {order.quotation}
												</div>
												<div className="flex space-x-2">
													<Select onValueChange={(driverId) => assignOrderToDriver(order.id, driverId)}>
														<SelectTrigger className="w-48">
															<SelectValue placeholder="Assign to driver" />
														</SelectTrigger>
														<SelectContent>
															{availableDrivers.map((driver) => (
																<SelectItem key={driver.id} value={driver.id}>
																	{driver.name} - {driver.phone}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												</div>
											</div>
										</div>
									))
								)}
							</div>
						</CardContent>
					</Card>
				</TabsContent>
				<TabsContent value="create-order">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Phone className="h-5 w-5" />
								Create Order (Phone/WhatsApp Request)
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								<div className="space-y-4">
									<h3 className="font-semibold">Customer Information</h3>
									<div className="space-y-2">
										<Label htmlFor="customer_name">Customer Name</Label>
										<Input
											id="customer_name"
											value={newOrderData.customer_name}
											onChange={(e) => setNewOrderData({...newOrderData, customer_name: e.target.value})}
											placeholder="Enter customer name"
											required
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="customer_phone">Customer Phone</Label>
										<Input
											id="customer_phone"
											value={newOrderData.customer_phone}
											onChange={(e) => setNewOrderData({...newOrderData, customer_phone: e.target.value})}
											placeholder="+27 12 345 6789"
											required
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="customer_email">Customer Email</Label>
										<Input
											id="customer_email"
											type="email"
											value={newOrderData.customer_email}
											onChange={(e) => setNewOrderData({...newOrderData, customer_email: e.target.value})}
											placeholder="customer@email.com"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="recipient_name">Recipient Name</Label>
										<Input
											id="recipient_name"
											value={newOrderData.recipient_name}
											onChange={(e) => setNewOrderData({...newOrderData, recipient_name: e.target.value})}
											placeholder="Enter recipient name"
											required
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="recipient_phone">Recipient Phone</Label>
										<Input
											id="recipient_phone"
											value={newOrderData.recipient_phone}
											onChange={(e) => setNewOrderData({...newOrderData, recipient_phone: e.target.value})}
											placeholder="+27 12 345 6789"
											required
										/>
									</div>
								</div>
								<div className="space-y-4">
									<h3 className="font-semibold">Delivery Information</h3>
									<div className="space-y-2">
										<Label htmlFor="pickup_address">Pickup Address</Label>
										<Textarea
											id="pickup_address"
											value={newOrderData.pickup_address}
											onChange={(e) => setNewOrderData({...newOrderData, pickup_address: e.target.value})}
											placeholder="Enter full pickup address"
											required
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="dropoff_address">Delivery Address</Label>
										<Textarea
											id="dropoff_address"
											value={newOrderData.dropoff_address}
											onChange={(e) => setNewOrderData({...newOrderData, dropoff_address: e.target.value})}
											placeholder="Enter full delivery address"
											required
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="service_type">Service Type</Label>
										<Select
											value={newOrderData.service_type}
											onValueChange={(value) => setNewOrderData({...newOrderData, service_type: value})}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="standard">Standard Delivery</SelectItem>
												<SelectItem value="same_day">Same-Day Delivery</SelectItem>
												<SelectItem value="instant">Instant Delivery</SelectItem>
												<SelectItem value="swift_errand">Swift Errand</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div className="space-y-2">
										<Label htmlFor="package_details">Package Details</Label>
										<Input
											id="package_details"
											value={newOrderData.package_details}
											onChange={(e) => setNewOrderData({...newOrderData, package_details: e.target.value})}
											placeholder="Describe the package"
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="special_instructions">Special Instructions</Label>
										<Textarea
											id="special_instructions"
											value={newOrderData.special_instructions}
											onChange={(e) => setNewOrderData({...newOrderData, special_instructions: e.target.value})}
											placeholder="Any special delivery instructions"
										/>
									</div>
								</div>
							</div>
							<div className="mt-6 flex justify-end">
								<Button onClick={createManualOrder} className="bg-blue-600 hover:bg-blue-700">
									Create Order
								</Button>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
				<TabsContent value="assignments">
					<Card>
						<CardHeader>
							<CardTitle>Available Drivers</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
								{availableDrivers.map((driver) => (
									<div key={driver.id} className="border rounded-lg p-4">
										<div className="flex items-center justify-between mb-2">
											<h3 className="font-semibold">{driver.name}</h3>
											<span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
												{driver.status.toUpperCase()}
											</span>
										</div>
										<p className="text-sm text-muted-foreground mb-1">{driver.email}</p>
										<p className="text-sm text-muted-foreground">{driver.phone}</p>
									</div>
								))}
							</div>
						</CardContent>
					</Card>
				</TabsContent>
				<TabsContent value="tracking">
					<Card>
						<CardHeader>
							<CardTitle>Live Driver Tracking</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="text-center py-8 text-muted-foreground">
								<MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
								<p>Real-time driver tracking will be displayed here</p>
								<p className="text-sm">Integration with Google Maps for live location updates</p>
							</div>
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
		</div>
	);
};

export default AdminDashboard;
