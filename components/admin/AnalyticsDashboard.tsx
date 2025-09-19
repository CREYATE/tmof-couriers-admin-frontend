"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, PieChart, Package, DollarSign, Truck, Users, RefreshCw, Download } from "lucide-react";

const timeRanges = [
	{ value: 'today', label: 'Today', days: 1 },
	{ value: 'week', label: 'This Week', days: 7 },
	{ value: 'month', label: 'This Month', days: 30 },
	{ value: 'quarter', label: 'This Quarter', days: 90 },
	{ value: 'year', label: 'This Year', days: 365 }
];

const mockAnalytics = {
	orders: { total: 12, today: 2, thisWeek: 5, thisMonth: 10, pending: 2, inTransit: 3, delivered: 7, failed: 0 },
	revenue: { total: 1200, today: 200, thisWeek: 500, thisMonth: 1000, average: 100 },
	drivers: { total: 5, active: 2, available: 2, onDelivery: 1, performance: 80 },
	customers: { total: 20, newThisMonth: 3, repeatCustomers: 17, satisfaction: 4.2 },
	performance: { averageDeliveryTime: 2.5, onTimeDelivery: 92, customerRating: 4.2, driverEfficiency: 87 }
};

const AnalyticsDashboard = () => {
	const [selectedTimeRange, setSelectedTimeRange] = useState('month');
	const [lastUpdated] = useState(new Date());
	const analyticsData = mockAnalytics;

	const formatCurrency = (amount: number) => `R${amount.toFixed(2)}`;

	return (
		<div className="space-y-8">
			<h2 className="text-2xl font-bold mt-6 mb-2">Analytics</h2>
			<div className="mt-6" />
			<Card>
				<CardHeader>
					<CardTitle>Analytics Overview</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-6">
						<div className="flex items-center justify-between">
							<div>
								<h1 className="text-3xl font-bold">Analytics Dashboard</h1>
								<p className="text-gray-600">Last updated: {lastUpdated.toLocaleTimeString()}</p>
							</div>
							<div className="flex items-center gap-3">
								<Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
									<SelectTrigger className="w-40">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{timeRanges.map((range) => (
											<SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
										))}
									</SelectContent>
								</Select>
								<Button variant="outline" size="sm">
									<RefreshCw className="h-4 w-4 mr-2" />
									Refresh
								</Button>
								<Button variant="outline" size="sm">
									<Download className="h-4 w-4 mr-2" />
									Export
								</Button>
							</div>
						</div>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">Total Orders</CardTitle>
									<Package className="h-4 w-4 text-muted-foreground" />
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">{analyticsData.orders.total}</div>
									<p className="text-xs text-muted-foreground">{analyticsData.orders.thisMonth} this month</p>
								</CardContent>
							</Card>
							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
									<DollarSign className="h-4 w-4 text-muted-foreground" />
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">{formatCurrency(analyticsData.revenue.total)}</div>
									<p className="text-xs text-muted-foreground">{formatCurrency(analyticsData.revenue.thisMonth)} this month</p>
								</CardContent>
							</Card>
							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
									<Truck className="h-4 w-4 text-muted-foreground" />
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">{analyticsData.drivers.active}</div>
									<p className="text-xs text-muted-foreground">{analyticsData.drivers.available} available</p>
								</CardContent>
							</Card>
							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">Total Customers</CardTitle>
									<Users className="h-4 w-4 text-muted-foreground" />
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">{analyticsData.customers.total}</div>
									<p className="text-xs text-muted-foreground">{analyticsData.customers.newThisMonth} new this month</p>
								</CardContent>
							</Card>
						</div>
						<Tabs defaultValue="overview" className="space-y-4">
							<TabsList>
								<TabsTrigger value="overview">Overview</TabsTrigger>
								<TabsTrigger value="orders">Orders</TabsTrigger>
								<TabsTrigger value="performance">Performance</TabsTrigger>
								<TabsTrigger value="revenue">Revenue</TabsTrigger>
							</TabsList>
							<TabsContent value="overview" className="space-y-4">
								<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
									<Card>
										<CardHeader>
											<CardTitle className="flex items-center gap-2">
												<BarChart3 className="h-5 w-5" />
												Order Status Distribution
											</CardTitle>
										</CardHeader>
										<CardContent className="space-y-3">
											<div className="flex items-center justify-between">
												<span>Pending</span>
												<div className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-semibold">{analyticsData.orders.pending}</div>
											</div>
											<div className="flex items-center justify-between">
												<span>In Transit</span>
												<div className="px-2 py-1 bg-primary text-primary-foreground rounded-full text-xs font-semibold">{analyticsData.orders.inTransit}</div>
											</div>
											<div className="flex items-center justify-between">
												<span>Delivered</span>
												<div className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">{analyticsData.orders.delivered}</div>
											</div>
											<div className="flex items-center justify-between">
												<span>Failed</span>
												<div className="px-2 py-1 bg-destructive text-destructive-foreground rounded-full text-xs font-semibold">{analyticsData.orders.failed}</div>
											</div>
										</CardContent>
									</Card>
									<Card>
										<CardHeader>
											<CardTitle className="flex items-center gap-2">
												<PieChart className="h-5 w-5" />
												Performance Metrics
											</CardTitle>
										</CardHeader>
										<CardContent className="space-y-3">
											<div className="flex items-center justify-between">
												<span>On-Time Delivery</span>
												<span className="font-medium">{analyticsData.performance.onTimeDelivery}%</span>
											</div>
											<div className="flex items-center justify-between">
												<span>Customer Rating</span>
												<span className="font-medium">{analyticsData.performance.customerRating}/5</span>
											</div>
											<div className="flex items-center justify-between">
												<span>Driver Efficiency</span>
												<span className="font-medium">{analyticsData.performance.driverEfficiency}%</span>
											</div>
											<div className="flex items-center justify-between">
												<span>Avg Delivery Time</span>
												<span className="font-medium">{analyticsData.performance.averageDeliveryTime}h</span>
											</div>
										</CardContent>
									</Card>
								</div>
							</TabsContent>
							<TabsContent value="orders" className="space-y-4">
								<Card>
									<CardHeader>
										<CardTitle>Order Analytics</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
											<div className="text-center">
												<div className="text-2xl font-bold text-blue-600">{analyticsData.orders.today}</div>
												<div className="text-sm text-gray-600">Today</div>
											</div>
											<div className="text-center">
												<div className="text-2xl font-bold text-green-600">{analyticsData.orders.thisWeek}</div>
												<div className="text-sm text-gray-600">This Week</div>
											</div>
											<div className="text-center">
												<div className="text-2xl font-bold text-purple-600">{analyticsData.orders.thisMonth}</div>
												<div className="text-sm text-gray-600">This Month</div>
											</div>
											<div className="text-center">
												<div className="text-2xl font-bold text-orange-600">{analyticsData.orders.total}</div>
												<div className="text-sm text-gray-600">Total</div>
											</div>
										</div>
									</CardContent>
								</Card>
							</TabsContent>
							<TabsContent value="performance" className="space-y-4">
								<Card>
									<CardHeader>
										<CardTitle>Performance Insights</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-4">
											<div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
												<span>Driver Performance</span>
												<div className="flex items-center gap-2">
													<span className="font-medium">{analyticsData.drivers.performance.toFixed(1)}%</span>
												</div>
											</div>
											<div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
												<span>Customer Satisfaction</span>
												<div className="flex items-center gap-2">
													<span className="font-medium">{analyticsData.performance.customerRating}/5</span>
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							</TabsContent>
							<TabsContent value="revenue" className="space-y-4">
								<Card>
									<CardHeader>
										<CardTitle>Revenue Analysis</CardTitle>
									</CardHeader>
									<CardContent>
										<div className="space-y-4">
											<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
												<div className="text-center">
													<div className="text-lg font-semibold">Today</div>
													<div className="text-2xl font-bold text-green-600">{formatCurrency(analyticsData.revenue.today)}</div>
												</div>
												<div className="text-center">
													<div className="text-lg font-semibold">This Week</div>
													<div className="text-2xl font-bold text-blue-600">{formatCurrency(analyticsData.revenue.thisWeek)}</div>
												</div>
												<div className="text-center">
													<div className="text-lg font-semibold">This Month</div>
													<div className="text-2xl font-bold text-purple-600">{formatCurrency(analyticsData.revenue.thisMonth)}</div>
												</div>
												<div className="text-center">
													<div className="text-lg font-semibold">Average Order</div>
													<div className="text-2xl font-bold text-orange-600">{formatCurrency(analyticsData.revenue.average)}</div>
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							</TabsContent>
						</Tabs>
					</div>
				</CardContent>
			</Card>
		</div>
	);
};

export default AnalyticsDashboard;
