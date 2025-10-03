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
    previousMonth: number;
    average: number;
    dailyData: { day: number; current: number; previous: number }[];
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
  // Add: Track subscriptions for cleanup
  const subscriptionsRef = useRef<any[]>([]);

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
      const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

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
        previousMonth: 0,
        average: 0,
        dailyData: [] as { day: number; current: number; previous: number }[]
      };

      // Create daily data structure for chart
      const daysInCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const daysInPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
      const maxDays = Math.max(daysInCurrentMonth, daysInPreviousMonth);
      
      // Initialize daily data array
      for (let i = 1; i <= maxDays; i++) {
        revenueCalc.dailyData.push({ day: i, current: 0, previous: 0 });
      }

      transactions.forEach((t: Transaction) => {
        if (t.status !== 'success' || t.currency !== 'ZAR') return;
        const amt: number = t.amount / 100;
        const created: Date = new Date(t.created_at);
        
        revenueCalc.total += amt;
        
        if (created >= startOfToday) revenueCalc.today += amt;
        if (created >= startOfWeek) revenueCalc.thisWeek += amt;
        
        // Current month revenue and daily breakdown
        if (created >= startOfMonth) {
          revenueCalc.thisMonth += amt;
          const dayOfMonth = created.getDate();
          if (dayOfMonth <= maxDays) {
            revenueCalc.dailyData[dayOfMonth - 1].current += amt;
          }
        }
        
        // Previous month revenue and daily breakdown
        if (created >= startOfPreviousMonth && created <= endOfPreviousMonth) {
          revenueCalc.previousMonth += amt;
          const dayOfMonth = created.getDate();
          if (dayOfMonth <= maxDays) {
            revenueCalc.dailyData[dayOfMonth - 1].previous += amt;
          }
        }
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
        revenue: { total: 0, today: 0, thisWeek: 0, thisMonth: 0, previousMonth: 0, average: 0, dailyData: [] },
        drivers: { total: 0, active: 0, available: 0, onDelivery: 0, performance: 80 },
        customers: { total: 0, newThisMonth: 0, repeatCustomers: 0, satisfaction: 4.2 },
        performance: { averageDeliveryTime: 2.5, onTimeDelivery: 92, customerRating: 4.2, driverEfficiency: 87 },
      });
    }
  };

  useEffect(() => {
    fetchData();

    // Initialize WS once
    wsClientRef.current = initializeWebSocket();

    // Cleanup
    return () => {
      subscriptionsRef.current.forEach((sub) => sub.unsubscribe());
      subscriptionsRef.current = [];
      disconnectWebSocket();
      wsClientRef.current = null;
    };
  }, []);

  // Subscribe after data loads
  useEffect(() => {
    if (!wsClientRef.current || orders.length === 0) return;

    const wsClient = wsClientRef.current;

    // Clear old subs
    subscriptionsRef.current.forEach((sub) => sub.unsubscribe());
    subscriptionsRef.current = [];

    // Subscribe to orders
    const orderSub = subscribeToTopic(wsClient, "/topic/orders", (message) => {
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
    });
    subscriptionsRef.current.push(orderSub);

    // Subscribe to driver assignments
    const assignmentSub = subscribeToTopic(wsClient, "/topic/driver-assignments", (message) => {
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
    });
    subscriptionsRef.current.push(assignmentSub);

    // Cleanup on unmount
    return () => {
      subscriptionsRef.current.forEach((sub) => sub.unsubscribe());
      subscriptionsRef.current = [];
    };
  }, [orders.length]);

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
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
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

          <div className="space-y-4 sm:space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Analytics Dashboard</h1>
                <p className="text-gray-600 text-sm sm:text-base">Last updated: {lastUpdated.toLocaleTimeString()}</p>
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
            {/* Mobile-optimized stats cards with horizontal scroll */}
            <div className="w-full overflow-x-auto pb-2">
              <div className="flex gap-4 min-w-fit lg:grid lg:grid-cols-4 lg:gap-6">
                <Card className="min-w-[280px] sm:min-w-[300px] lg:min-w-0 flex-shrink-0">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analyticsData.orders.total}</div>
                    <p className="text-xs text-muted-foreground">{analyticsData.orders.thisMonth} this month</p>
                  </CardContent>
                </Card>
                <Card className="min-w-[280px] sm:min-w-[300px] lg:min-w-0 flex-shrink-0">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(analyticsData.revenue.total)}</div>
                    <p className="text-xs text-muted-foreground">{formatCurrency(analyticsData.revenue.thisMonth)} this month</p>
                  </CardContent>
                </Card>
                <Card className="min-w-[280px] sm:min-w-[300px] lg:min-w-0 flex-shrink-0">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
                    <Truck className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{analyticsData.drivers.active}</div>
                    <p className="text-xs text-muted-foreground">{analyticsData.drivers.available} available</p>
                  </CardContent>
                </Card>
                <Card className="min-w-[280px] sm:min-w-[300px] lg:min-w-0 flex-shrink-0">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">Total Customers</CardTitle>
                    <Users className="h-4 w-4 text-gray-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-400">Feature will be available when customer wallet has been built</div>
                  </CardContent>
                </Card>
              </div>
            </div>
            <Tabs defaultValue="overview" className="space-y-4">
              <div className="w-full overflow-x-auto">
                <TabsList className="grid w-full grid-cols-4 min-w-fit h-auto p-1">
                  <TabsTrigger 
                    value="overview" 
                    className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap"
                  >
                    <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Overview</span>
                    <span className="sm:hidden">Overview</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="orders" 
                    className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap"
                  >
                    <Package className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Orders</span>
                    <span className="sm:hidden">Orders</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="performance" 
                    className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap"
                  >
                    <Truck className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Performance</span>
                    <span className="sm:hidden">Perf</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="revenue" 
                    className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap"
                  >
                    <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Revenue</span>
                    <span className="sm:hidden">Revenue</span>
                  </TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                        <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                        Order Status Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 p-3 sm:p-6">
                      <div className="flex items-center justify-between">
                        <span className="text-sm sm:text-base">Pending</span>
                        <div className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-xs font-semibold">{analyticsData.orders.pending}</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm sm:text-base">In Transit</span>
                        <div className="px-2 py-1 bg-primary text-primary-foreground rounded-full text-xs font-semibold">{analyticsData.orders.inTransit}</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm sm:text-base">Delivered</span>
                        <div className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">{analyticsData.orders.delivered}</div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm sm:text-base">Failed</span>
                        <div className="px-2 py-1 bg-destructive text-destructive-foreground rounded-full text-xs font-semibold">{analyticsData.orders.failed}</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
                        <PieChart className="h-4 w-4 sm:h-5 sm:w-5" />
                        Performance Metrics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex items-center justify-center h-32 p-3 sm:p-6">
                      <div className="text-sm text-gray-400 text-center">Feature under construction</div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
              <TabsContent value="orders" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm sm:text-base lg:text-lg">Order Analytics</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                      <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-blue-600">{analyticsData.orders.today}</div>
                        <div className="text-xs sm:text-sm text-gray-600">Today</div>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-green-600">{analyticsData.orders.thisWeek}</div>
                        <div className="text-xs sm:text-sm text-gray-600">This Week</div>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-purple-50 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-purple-600">{analyticsData.orders.thisMonth}</div>
                        <div className="text-xs sm:text-sm text-gray-600">This Month</div>
                      </div>
                      <div className="text-center p-3 sm:p-4 bg-orange-50 rounded-lg">
                        <div className="text-xl sm:text-2xl font-bold text-orange-600">{analyticsData.orders.total}</div>
                        <div className="text-xs sm:text-sm text-gray-600">Total</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="performance" className="space-y-4">
                <Card className="opacity-50">
                  <CardHeader>
                    <CardTitle className="text-gray-400">Performance Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg opacity-60">
                        <span className="text-gray-400">Driver Performance</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-400">{analyticsData.drivers.performance.toFixed(1)}%</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg opacity-60">
                        <span className="text-gray-400">Customer Satisfaction</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-400">{analyticsData.performance.customerRating}/5</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-center mt-6">
                        <div className="text-sm text-gray-400 text-center">Feature under construction</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="revenue" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Revenue Analysis - Daily Comparison Chart</span>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-0.5 bg-blue-500 rounded"></div>
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          </div>
                          <span>Current Month ({formatCurrency(analyticsData.revenue.thisMonth)})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-0.5 bg-gray-400 rounded border-dashed border-t"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                          </div>
                          <span>Previous Month ({formatCurrency(analyticsData.revenue.previousMonth)})</span>
                        </div>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Chart Container */}
                      <div className="w-full h-96 bg-gray-50 rounded-lg p-4">
                        <div className="h-full relative">
                          {/* Y-axis label - moved further left */}
                          <div className="absolute -left-11 top-1/2 -rotate-90 transform -translate-y-1/2 text-sm font-medium text-gray-600">
                            Revenue (R)
                          </div>
                          
                          {/* Chart area */}
                          <div className="ml-16 h-full flex flex-col">
                            {/* Y-axis values */}
                            <div className="flex-1 relative">
                              {/* Get max value for scaling */}
                              {(() => {
                                const maxValue = Math.max(
                                  ...analyticsData.revenue.dailyData.map(d => Math.max(d.current, d.previous)),
                                  1 // Minimum of 1 to avoid division by zero
                                );
                                const yAxisSteps = 5;
                                const stepValue = maxValue / yAxisSteps;
                                
                                return (
                                  <>
                                    {/* Y-axis grid lines and labels */}
                                    {Array.from({ length: yAxisSteps + 1 }, (_, i) => (
                                      <div
                                        key={i}
                                        className="absolute w-full border-t border-gray-200"
                                        style={{ bottom: `${(i / yAxisSteps) * 100}%` }}
                                      >
                                        <span className="absolute -left-12 -mt-2 text-xs text-gray-500">
                                          {formatCurrency(stepValue * i)}
                                        </span>
                                      </div>
                                    ))}
                                    
                                    {/* Line chart with plot points */}
                                    <div className="absolute bottom-0 w-full h-full">
                                      {/* Current month line */}
                                      <svg className="w-full h-full absolute top-0 left-0" viewBox="0 0 100 100" preserveAspectRatio="none">
                                        {/* Current month line path */}
                                        <polyline
                                          fill="none"
                                          stroke="#3B82F6"
                                          strokeWidth="0.3"
                                          points={analyticsData.revenue.dailyData
                                            .slice(0, Math.min(31, analyticsData.revenue.dailyData.length))
                                            .map((dayData, index) => {
                                              const x = (index / (Math.min(31, analyticsData.revenue.dailyData.length) - 1)) * 100;
                                              const y = 100 - (maxValue > 0 ? (dayData.current / maxValue) * 100 : 0);
                                              return `${x},${y}`;
                                            })
                                            .join(' ')}
                                        />
                                        
                                        {/* Previous month line path */}
                                        <polyline
                                          fill="none"
                                          stroke="#9CA3AF"
                                          strokeWidth="0.3"
                                          strokeDasharray="1,1"
                                          points={analyticsData.revenue.dailyData
                                            .slice(0, Math.min(31, analyticsData.revenue.dailyData.length))
                                            .map((dayData, index) => {
                                              const x = (index / (Math.min(31, analyticsData.revenue.dailyData.length) - 1)) * 100;
                                              const y = 100 - (maxValue > 0 ? (dayData.previous / maxValue) * 100 : 0);
                                              return `${x},${y}`;
                                            })
                                            .join(' ')}
                                        />
                                      </svg>
                                      
                                      {/* Plot points overlay */}
                                      <div className="absolute bottom-0 w-full h-full flex items-end justify-between px-2">
                                        {analyticsData.revenue.dailyData.slice(0, Math.min(31, analyticsData.revenue.dailyData.length)).map((dayData, index) => (
                                          <div key={dayData.day} className="flex flex-col items-center flex-1 min-w-0 relative group">
                                            {/* Enhanced tooltip on hover */}
                                            <div className="absolute bottom-full mb-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-20 shadow-lg">
                                              <div className="font-semibold">Day {dayData.day}</div>
                                              <div className="text-blue-300">Current: {formatCurrency(dayData.current)}</div>
                                              <div className="text-gray-300">Previous: {formatCurrency(dayData.previous)}</div>
                                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
                                            </div>
                                            
                                            {/* Plot points container */}
                                            <div className="relative w-full h-full flex flex-col justify-end items-center">
                                              {/* Current month plot point */}
                                              <div
                                                className="absolute w-2 h-2 bg-blue-500 rounded-full border-2 border-white shadow-lg hover:scale-150 transition-transform duration-200 z-10"
                                                style={{
                                                  bottom: `${maxValue > 0 ? (dayData.current / maxValue) * 100 : 0}%`,
                                                  transform: 'translateY(50%)'
                                                }}
                                              />
                                              
                                              {/* Previous month plot point */}
                                              <div
                                                className="absolute w-2 h-2 bg-gray-400 rounded-full border-2 border-white shadow-lg hover:scale-150 transition-transform duration-200 z-10"
                                                style={{
                                                  bottom: `${maxValue > 0 ? (dayData.previous / maxValue) * 100 : 0}%`,
                                                  transform: 'translateY(50%)'
                                                }}
                                              />
                                              
                                              {/* Invisible hover area */}
                                              <div className="absolute inset-0 cursor-pointer"></div>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                            
                            {/* X-axis */}
                            <div className="h-8 border-t border-gray-300 flex items-center justify-between px-2 mt-2">
                              {/* X-axis labels - show every 5th day */}
                              {analyticsData.revenue.dailyData.slice(0, Math.min(31, analyticsData.revenue.dailyData.length)).map((dayData, index) => (
                                <div key={dayData.day} className="flex-1 text-center">
                                  {index % 5 === 0 || index === analyticsData.revenue.dailyData.length - 1 ? (
                                    <span className="text-xs text-gray-500">{dayData.day}</span>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                            
                            {/* X-axis label */}
                            <div className="text-center text-sm font-medium text-gray-600 mt-2">
                              Day of Month
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Summary Statistics */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <h4 className="text-lg font-semibold text-blue-700">Current Month</h4>
                          <div className="text-2xl font-bold text-blue-600">{formatCurrency(analyticsData.revenue.thisMonth)}</div>
                          <div className="text-sm text-blue-600">
                            {analyticsData.revenue.previousMonth > 0 ? (
                              <span>
                                {analyticsData.revenue.thisMonth > analyticsData.revenue.previousMonth ? '↗️' : '↘️'}
                                {' '}
                                {(((analyticsData.revenue.thisMonth - analyticsData.revenue.previousMonth) / analyticsData.revenue.previousMonth) * 100).toFixed(1)}%
                                {' vs previous month'}
                              </span>
                            ) : (
                              'No previous month data'
                            )}
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <h4 className="text-lg font-semibold text-gray-700">Previous Month</h4>
                          <div className="text-2xl font-bold text-gray-600">{formatCurrency(analyticsData.revenue.previousMonth)}</div>
                          <div className="text-sm text-gray-600">
                            {analyticsData.revenue.previousMonth > 0 ? 'Complete month' : 'No data available'}
                          </div>
                        </div>
                        
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                          <h4 className="text-lg font-semibold text-green-700">Difference</h4>
                          <div className="text-2xl font-bold text-green-600">
                            {formatCurrency(Math.abs(analyticsData.revenue.thisMonth - analyticsData.revenue.previousMonth))}
                          </div>
                          <div className="text-sm text-green-600">
                            {analyticsData.revenue.thisMonth > analyticsData.revenue.previousMonth ? 'Higher' : 'Lower'}
                            {' than previous month'}
                          </div>
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