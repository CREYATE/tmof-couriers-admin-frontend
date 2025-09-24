"use client";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, PieChart, Package, DollarSign, Truck, Users, RefreshCw, Download, MapPin } from "lucide-react";
import TmofSpinner from "@/components/ui/TmofSpinner";
import { initializeWebSocket, subscribeToTopic, disconnectWebSocket, Client } from "@/lib/websocket";
import { Order, Driver, OrderCounts } from "@/lib/types";

const timeRanges = [
  { value: 'today', label: 'Today', days: 1 },
  { value: 'week', label: 'This Week', days: 7 },
  { value: 'month', label: 'This Month', days: 30 },
  { value: 'quarter', label: 'This Quarter', days: 90 },
  { value: 'year', label: 'This Year', days: 365 }
];

type AnalyticsData = {
  orders: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    pending: number;
    inTransit: number;
    delivered: number;
    failed: number;
  };
  revenue: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    average: number;
  };
  drivers: {
    total: number;
    active: number;
    available: number;
    onDelivery: number;
    performance: number;
  };
  customers: {
    total: number;
    newThisMonth: number;
    repeatCustomers: number;
    satisfaction: number;
  };
  performance: {
    averageDeliveryTime: number;
    onTimeDelivery: number;
    customerRating: number;
    driverEfficiency: number;
  };
};

interface Transaction {
  status: string;
  currency: string;
  amount: number;
  created_at: string;
}

interface AvailableDriver {
  id: string;
}

const AnalyticsDashboard = () => {
  const [selectedTimeRange, setSelectedTimeRange] = useState('month');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [error, setError] = useState("");
  const wsClientRef = useRef<Client | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<AvailableDriver[]>([]);

  const formatCurrency = (amount: number) => `R${amount.toFixed(2)}`;

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("jwt");
      if (!token) {
        setError("Authentication required. Please log in.");
        window.location.href = '/';
        return;
      }

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      };

      // Fetch orders
      const ordersResponse = await fetch('/api/orders/status?statuses=AWAITING_COLLECTION,COLLECTED,IN_TRANSIT,DELIVERED', { headers });
      if (ordersResponse.status === 401 || ordersResponse.status === 403) {
        localStorage.removeItem("jwt");
        setError("Session expired. Please log in again.");
        window.location.href = '/';
        return;
      }
      if (!ordersResponse.ok) throw new Error(`Failed to fetch orders: ${ordersResponse.status}`);
      const ordersData = await ordersResponse.json();
      setOrders(Array.isArray(ordersData) ? ordersData : []);

      // Fetch drivers
      const driversResponse = await fetch('/api/admin/drivers/available', { headers });
      if (driversResponse.status === 401 || driversResponse.status === 403) {
        localStorage.removeItem("jwt");
        setError("Session expired. Please log in again.");
        window.location.href = '/';
        return;
      }
      if (!driversResponse.ok) throw new Error(`Failed to fetch drivers: ${driversResponse.status}`);
      const driversData = await driversResponse.json();
      setDrivers(Array.isArray(driversData) ? driversData : []);

      // Fetch available drivers
      const availableResponse = await fetch('/api/admin/drivers/available', { headers });
      if (availableResponse.status === 401 || availableResponse.status === 403) {
        localStorage.removeItem("jwt");
        setError("Session expired. Please log in again.");
        window.location.href = '/';
        return;
      }
      if (!availableResponse.ok) throw new Error(`Failed to fetch available drivers: ${availableResponse.status}`);
      const availableData = await availableResponse.json();
      setAvailableDrivers(Array.isArray(availableData) ? availableData : []);

      // Fetch transactions from Paystack
      let transactions: Transaction[] = [];
      try {
        const transactionsResponse = await fetch('/api/paystack/transactions');
        if (transactionsResponse.ok) {
          transactions = await transactionsResponse.json();
          if (!Array.isArray(transactions)) {
            console.warn("Paystack proxy - Unexpected response format:", transactions);
            transactions = [];
          }
        } else {
          console.warn(`Paystack proxy - Failed to fetch transactions: ${transactionsResponse.status}`);
          setError("Unable to fetch payment data from Paystack. Displaying order and driver data only.");
        }
      } catch (paystackError) {
        console.error("Paystack proxy - Fetch error:", paystackError);
        setError("Unable to fetch payment data from Paystack. Displaying order and driver data only.");
      }

      // Calculate dates
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(now);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Calculate orders data
      const ordersCalc = {
        total: ordersData.length,
        today: ordersData.filter((o: Order) => o.createdAt && new Date(o.createdAt) >= startOfToday).length,
        thisWeek: ordersData.filter((o: Order) => o.createdAt && new Date(o.createdAt) >= startOfWeek).length,
        thisMonth: ordersData.filter((o: Order) => o.createdAt && new Date(o.createdAt) >= startOfMonth).length,
        pending: ordersData.filter((o: Order) => o.status && ['AWAITING_COLLECTION', 'COLLECTED'].includes(o.status)).length,
        inTransit: ordersData.filter((o: Order) => o.status === 'IN_TRANSIT').length,
        delivered: ordersData.filter((o: Order) => o.status === 'DELIVERED').length,
        failed: 0
      };

      // Calculate revenue data from Paystack
      const revenueCalc = {
        total: 0,
        today: 0,
        thisWeek: 0,
        thisMonth: 0,
        average: 0
      };

      transactions.forEach((t: Transaction) => {
        if (t.status !== 'success' || t.currency !== 'ZAR') return;
        const amt: number = t.amount / 100;
        revenueCalc.total += amt;
        const created: Date = new Date(t.created_at);
        if (created >= startOfToday) revenueCalc.today += amt;
        if (created >= startOfWeek) revenueCalc.thisWeek += amt;
        if (created >= startOfMonth) revenueCalc.thisMonth += amt;
      });

      if (ordersCalc.total > 0) {
        revenueCalc.average = revenueCalc.total / ordersCalc.total;
      }

      // Calculate drivers data
      const driversCalc = {
        total: driversData.length,
        active: driversData.filter((d: Driver) => d.status === 'active').length,
        available: availableData.length,
        onDelivery: new Set(
          ordersData
            .filter((o: Order) => o.status === 'IN_TRANSIT' && o.driverName)
            .map((o: Order) => o.driverName)
        ).size,
        performance: 80 // Static as per instructions
      };

      // Customers (static message, handled in UI)
      const customersCalc = {
        total: 0,
        newThisMonth: 0,
        repeatCustomers: 0,
        satisfaction: 4.2
      };

      // Performance (static as per instructions)
      const performanceCalc = {
        averageDeliveryTime: 2.5,
        onTimeDelivery: 92,
        customerRating: 4.2,
        driverEfficiency: 87
      };

      setAnalyticsData({
        orders: ordersCalc,
        revenue: revenueCalc,
        drivers: driversCalc,
        customers: customersCalc,
        performance: performanceCalc
      });

      setLastUpdated(new Date());
      if (!error) setError(""); // Clear error if no Paystack-specific error was set
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      setError("Failed to load some analytics data. Displaying available data.");
      setAnalyticsData({
        orders: { total: 0, today: 0, thisWeek: 0, thisMonth: 0, pending: 0, inTransit: 0, delivered: 0, failed: 0 },
        revenue: { total: 0, today: 0, thisWeek: 0, thisMonth: 0, average: 0 },
        drivers: { total: 0, active: 0, available: 0, onDelivery: 0, performance: 80 },
        customers: { total: 0, newThisMonth: 0, repeatCustomers: 0, satisfaction: 4.2 },
        performance: { averageDeliveryTime: 2.5, onTimeDelivery: 92, customerRating: 4.2, driverEfficiency: 87 },
      });
    }
  };

  useEffect(() => {
    fetchData();

    const wsClient = initializeWebSocket();
    wsClientRef.current = wsClient;

    const subscriptions: { unsubscribe: () => void; id: string }[] = [];

    const checkConnection = setInterval(() => {
      if (wsClient.connected) {
        clearInterval(checkConnection);

        subscriptions.push(
          subscribeToTopic(wsClient, "/topic/orders", (message) => {
            try {
              const order: Order = JSON.parse(message.body);
              console.log("WebSocket order update:", order);
              if (order.trackingNumber) {
                setOrders((prev) =>
                  prev.some((o) => o.trackingNumber === order.trackingNumber)
                    ? prev.map((o) => (o.trackingNumber === order.trackingNumber ? { ...o, ...order } : o))
                    : [...prev, order]
                );
                fetchData(); // Refresh analytics data on order update
              }
            } catch (err) {
              console.error("Error parsing WebSocket order message:", err);
            }
          })
        );

        subscriptions.push(
          subscribeToTopic(wsClient, "/topic/driver-assignments", (message) => {
            try {
              const order: Order = JSON.parse(message.body);
              console.log("WebSocket driver assignment update:", order);
              if (order.trackingNumber) {
                setOrders((prev) =>
                  prev.map((o) => (o.trackingNumber === order.trackingNumber ? { ...o, ...order } : o))
                );
                fetchData(); // Refresh analytics data on driver assignment update
              }
            } catch (err) {
              console.error("Error parsing WebSocket driver assignment message:", err);
            }
          })
        );
      }
    }, 100);

    return () => {
      clearInterval(checkConnection);
      subscriptions.forEach((sub) => sub.unsubscribe());
      disconnectWebSocket();
    };
  }, []);

  if (!analyticsData) {
    return (
      <>
        <TmofSpinner show={true} />
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded fixed top-4 right-4 z-50">
            <p>{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setError("")}>
              Dismiss
            </Button>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* <h2 className="text-2xl font-bold mt-6 mb-2">Analytics</h2> */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => setError("")}>
            Dismiss
          </Button>
        </div>
      )}
      
        {/* <CardHeader>
          <CardTitle>Analytics Overview</CardTitle>
        </CardHeader> */}

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
                <p className="text-gray-600">Last updated: {lastUpdated.toLocaleTimeString()}</p>
              </div>
              {/* <div className="flex items-center gap-3">
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
                <Button variant="outline" size="sm" onClick={fetchData}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div> */}
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
                  <CardTitle className="text-sm font-medium text-gray-400">Total Customers</CardTitle>
                  <Users className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-400">Feature will be available when customer wallet has been built</div>
                </CardContent>
              </Card>
            </div>
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="orders" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Orders
                </TabsTrigger>
                <TabsTrigger value="performance" className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Performance
                </TabsTrigger>
                <TabsTrigger value="revenue" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Revenue
                </TabsTrigger>
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
                    <CardContent className="flex items-center justify-center h-32">
                      <div className="text-sm text-gray-400 text-center">Feature under construction</div>
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
        
      
    </div>
  );
};

export default AnalyticsDashboard;