"use client";
import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Users, AlertTriangle, Truck, CheckCircle2, XCircle, MapPin } from "lucide-react";
import { initializeWebSocket, subscribeToTopic, disconnectWebSocket } from "@/lib/websocket";
import { Client } from "@stomp/stompjs";
import { Order, Driver, OrderCounts } from "@/lib/types";
import TmofSpinner from "@/components/ui/TmofSpinner";

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

const getDriverStatus = (driver: Driver): string => {
  return driver.availability || driver.status || (driver.online ? "online" : "offline") || "unknown";
};

const getDriverFullName = (driver: Driver): string => {
  return driver.name + (driver.surname ? ` ${driver.surname}` : "");
};

const getCustomerFullName = (order: Order): string => {
  return order.customerName + (order.customerSurname ? ` ${order.customerSurname}` : "");
};

const getOrderPrice = (order: Order): string => {
  return order.price || "0";
};

const AdminDashboard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [activeTab, setActiveTab] = useState("order-management");
  const [modalOrder, setModalOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<OrderCounts>({
    awaitingCollection: 0,
    inTransit: 0,
    delivered: 0,
    cancelled: 0,
  });
  const wsClientRef = useRef<Client | null>(null);
  // Add: Track subscriptions for cleanup
  const subscriptionsRef = useRef<any[]>([]);

  useEffect(() => {
    const fetchInitialData = async () => {
      await Promise.all([fetchOrders(), fetchDrivers(), fetchOrderCounts()]);
    };

    fetchInitialData();

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

  // Subscribe after orders load
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
        setOrders((prev) =>
          prev.some((o) => o.trackingNumber === order.trackingNumber)
            ? prev.map((o) => (o.trackingNumber === order.trackingNumber ? { ...o, ...order } : o))
            : [...prev, order]
        );
        fetchOrderCounts();
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
        setOrders((prev) =>
          prev.map((o) => (o.trackingNumber === order.trackingNumber ? { ...o, ...order } : o))
        );
        fetchOrderCounts();
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

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("jwt");
      if (!token) {
        setError("Authentication required");
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        "/api/orders/status?statuses=PAID,AWAITING_COLLECTION,IN_TRANSIT,DELIVERED,CANCELLED",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
          setError(errorData.error || `HTTP error! status: ${response.status}`);
        } catch (jsonError) {
          setError(`HTTP error! status: ${response.status}`);
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        setError("Invalid response format from server");
        throw new Error("Response is not JSON");
      }

      const data = await response.json();
      console.log("Orders data from backend:", data);
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load orders: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDrivers = async () => {
    try {
      const token = localStorage.getItem("jwt");
      if (!token) {
        setError("Authentication required");
        return;
      }

      const response = await fetch("/api/admin/drivers/available", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Response is not JSON");
      }

      const data = await response.json();
      console.log("Drivers data from backend:", data);
      setDrivers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching drivers:", err);
      setError("Failed to load drivers: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const fetchOrderCounts = async () => {
    try {
      const token = localStorage.getItem("jwt");
      if (!token) {
        return;
      }

      const response = await fetch("/api/orders/counts", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Response is not JSON");
      }

      const data = await response.json();
      console.log("Order counts data from backend:", data);
      setStats({
        awaitingCollection: data.awaitingCollection || 0,
        inTransit: data.inTransit || 0,
        delivered: data.delivered || 0,
        cancelled: typeof data.cancelled === "number" ? data.cancelled : 0,
      });
    } catch (err) {
      console.error("Error fetching order counts:", err);
    }
  };

  const handleAssignDriver = async (trackingNumber: string, driverId: string) => {
    try {
      const token = localStorage.getItem("jwt");
      if (!token) {
        setError("Authentication required");
        return;
      }

      const response = await fetch("/api/orders/assign-driver", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ trackingNumber, driverId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      await response.json();
      setModalOrder(null);
      await fetchOrders();
    } catch (err) {
      console.error("Error assigning driver:", err);
      setError("An error occurred while assigning driver: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const openAssignModal = (order: Order) => setModalOrder(order);
  const closeAssignModal = () => setModalOrder(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const awaitingOrders = orders.filter((o) => o.status === "PAID" || o.status === "AWAITING_COLLECTION");
  const inTransitOrders = orders.filter((o) => o.status === "IN_TRANSIT");
  const deliveredOrders = orders.filter((o) => o.status === "DELIVERED");
  const cancelledOrders = orders.filter((o) => o.status === "CANCELLED");

  return (
    <div className="space-y-6 sm:space-y-8">
      <TmofSpinner show={isLoading} />
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Operations Dashboard</h1>
          <p className="text-gray-600 text-sm sm:text-base mt-1">Last updated: {lastUpdated.toLocaleTimeString()}</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          <p>{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => setError("")}>
            Dismiss
          </Button>
        </div>
      )}

      {/* Mobile-optimized stats cards with hidden horizontal scrollbar */}
      <div className="w-full overflow-x-auto stats-scroll pb-4">
        <div className="flex gap-6 min-w-fit lg:grid lg:grid-cols-4 lg:gap-8 px-1">
          <Card className="min-w-[300px] sm:min-w-[320px] lg:min-w-0 flex-shrink-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">Orders Awaiting Collection</CardTitle>
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold mb-1">{stats.awaitingCollection}</div>
              <p className="text-xs text-muted-foreground">Ready for pickup</p>
            </CardContent>
          </Card>
          <Card className="min-w-[300px] sm:min-w-[320px] lg:min-w-0 flex-shrink-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">Orders In-transit</CardTitle>
              <Truck className="h-5 w-5 text-orange-500" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold mb-1">{stats.inTransit}</div>
              <p className="text-xs text-muted-foreground">On the road</p>
            </CardContent>
          </Card>
          <Card className="min-w-[300px] sm:min-w-[320px] lg:min-w-0 flex-shrink-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">Orders Delivered</CardTitle>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold mb-1">{stats.delivered}</div>
              <p className="text-xs text-muted-foreground">Delivered successfully</p>
            </CardContent>
          </Card>
          <Card className="min-w-[300px] sm:min-w-[320px] lg:min-w-0 flex-shrink-0 shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-medium">Orders Cancelled</CardTitle>
              <XCircle className="h-5 w-5 text-red-600" />
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold mb-1">{stats.cancelled}</div>
              <p className="text-xs text-muted-foreground">Order cancelled</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
        <div className="w-full overflow-x-auto">
          <TabsList className="grid w-full grid-cols-3 min-w-fit h-auto p-1">
            <TabsTrigger 
              value="order-management" 
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap"
            >
              <Package className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Order Management</span>
              <span className="sm:hidden">Orders</span>
            </TabsTrigger>
            <TabsTrigger 
              value="assigned-orders" 
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap"
            >
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Assigned Orders</span>
              <span className="sm:hidden">Assigned</span>
            </TabsTrigger>
            <TabsTrigger 
              value="live-tracking" 
              className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3 whitespace-nowrap"
            >
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Live Tracking</span>
              <span className="sm:hidden">Tracking</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="order-management">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Orders Awaiting Collection</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              {isLoading ? (
                <div className="text-center py-8">Loading orders...</div>
              ) : awaitingOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No orders awaiting collection</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {awaitingOrders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-3 sm:p-4 space-y-2 sm:space-y-3">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm sm:text-base">Order #{order.trackingNumber}</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            Customer: {getCustomerFullName(order)} ({order.customerPhone})
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded self-start ${getStatusBadgeColor(order.status ?? "")}`}>
                          {order.status?.replace("_", " ")}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-3 text-xs sm:text-sm">
                        <div>
                          <p className="font-medium">Pickup:</p>
                          <p className="text-muted-foreground break-words">{order.pickupAddress}</p>
                        </div>
                        <div>
                          <p className="font-medium">Delivery:</p>
                          <p className="text-muted-foreground break-words">{order.deliveryAddress}</p>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="text-xs sm:text-sm">
                          <span className="font-medium">Service:</span> {order.serviceType}
                          <span className="block sm:inline sm:ml-4">
                            <span className="font-medium">Amount:</span> R {getOrderPrice(order)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t">
                        <div className="text-xs text-muted-foreground">
                          Driver: <span className="font-semibold text-black">{order.driverName || "Not assigned"}</span>
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => openAssignModal(order)}
                          className="w-full sm:w-auto text-xs sm:text-sm"
                        >
                          Assign to driver
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {modalOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
              <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 lg:p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-bold mb-4">Assign Order #{modalOrder.trackingNumber}</h3>
                <div className="mb-4">
                  <p className="mb-2 text-sm">Select a driver to assign:</p>
                  <select
                    className="w-full p-3 border rounded-lg text-sm sm:text-base"
                    onChange={(e) => handleAssignDriver(modalOrder.trackingNumber!, e.target.value)}
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select driver
                    </option>
                    {drivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {getDriverFullName(driver)} - {driver.vehicle_type || "No vehicle"}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                  <Button 
                    onClick={closeAssignModal} 
                    variant="outline"
                    className="w-full sm:w-auto order-2 sm:order-1"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="assigned-orders">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Assigned Orders by Driver</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              {isLoading ? (
                <div className="text-center py-8">Loading drivers and orders...</div>
              ) : drivers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No drivers available</p>
                </div>
              ) : (
                <div className="space-y-4 sm:space-y-6">
                  {drivers.map((driver) => {
                    const driverOrders = orders.filter((o) => o.driverName === getDriverFullName(driver));
                    const driverStatus = getDriverStatus(driver);

                    return (
                      <div key={driver.id} className="border rounded-lg p-3 sm:p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                          <h3 className="font-semibold text-sm sm:text-base">{getDriverFullName(driver)}</h3>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded self-start">
                            {driverStatus.toUpperCase()}
                          </span>
                        </div>
                        {driverOrders.length === 0 ? (
                          <p className="text-xs sm:text-sm text-muted-foreground">No assigned orders.</p>
                        ) : (
                          <div className="space-y-2">
                            {driverOrders.map((order) => (
                              <div key={order.id} className="border rounded p-2 sm:p-3 text-xs sm:text-sm">
                                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                                  <span className="font-medium">#{order.trackingNumber}</span>
                                  <span className={`px-2 py-1 text-xs rounded self-start ${getStatusBadgeColor(order.status ?? "")}`}>
                                    {order.status?.replace("_", " ")}
                                  </span>
                                </div>
                                <p className="break-words text-muted-foreground mt-1">
                                  {order.pickupAddress} → {order.deliveryAddress}
                                </p>
                                <p className="mt-1">Customer: {getCustomerFullName(order)}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="live-tracking">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Live Tracking (In-Transit Orders)</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-6">
              {isLoading ? (
                <div className="text-center py-8">Loading orders...</div>
              ) : inTransitOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No orders in transit</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {inTransitOrders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm sm:text-base">Order #{order.trackingNumber}</h3>
                          <p className="text-xs sm:text-sm text-muted-foreground break-words">
                            {order.pickupAddress} → {order.deliveryAddress}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded self-start ${getStatusBadgeColor(order.status ?? "")}`}>
                          {order.status?.replace("_", " ")}
                        </span>
                      </div>
                      <div className="mt-2 text-xs sm:text-sm space-y-1">
                        <div>
                          <span className="font-medium">Recipient:</span>{" "}
                          {order.recipientName || getCustomerFullName(order)} (
                          {order.recipientPhone || order.customerPhone})
                        </div>
                        <div>
                          <span className="font-medium">Service:</span> {order.serviceType} |{" "}
                          <span className="font-medium">Amount:</span> R {getOrderPrice(order)}
                        </div>
                        <div>
                          <span className="font-medium">Driver:</span> {order.driverName || "Not assigned"}
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-gray-50 rounded text-xs text-muted-foreground">
                        Live tracking map will be shown here.
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;