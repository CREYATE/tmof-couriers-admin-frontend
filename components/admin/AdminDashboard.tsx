"use client";
import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Users, AlertTriangle, Truck, CheckCircle2, XCircle, MapPin } from "lucide-react";
import { initializeWebSocket, subscribeToTopic, disconnectWebSocket } from "@/lib/websocket";
import { Client } from "@stomp/stompjs";
import { Order, Driver, OrderCounts } from "@/lib/types";

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

  useEffect(() => {
    const fetchInitialData = async () => {
      await Promise.all([fetchOrders(), fetchDrivers(), fetchOrderCounts()]);
    };

    fetchInitialData();

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
              setOrders((prev) =>
                prev.some((o) => o.trackingNumber === order.trackingNumber)
                  ? prev.map((o) => (o.trackingNumber === order.trackingNumber ? { ...o, ...order } : o))
                  : [...prev, order]
              );
              fetchOrderCounts();
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
              setOrders((prev) =>
                prev.map((o) => (o.trackingNumber === order.trackingNumber ? { ...o, ...order } : o))
              );
              fetchOrderCounts();
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

  const awaitingOrders = orders.filter((o) => o.status === "PAID" || o.status === "AWAITING_COLLECTION");
  const inTransitOrders = orders.filter((o) => o.status === "IN_TRANSIT");
  const deliveredOrders = orders.filter((o) => o.status === "DELIVERED");
  const cancelledOrders = orders.filter((o) => o.status === "CANCELLED");

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">TMOF Couriers Administration Panel</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => setError("")}>
            Dismiss
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Orders Awaiting Collection</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.awaitingCollection}</div>
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

        <TabsContent value="order-management">
          <Card>
            <CardHeader>
              <CardTitle>Orders Awaiting Collection</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading orders...</div>
              ) : awaitingOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No orders awaiting collection</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {awaitingOrders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">Order #{order.trackingNumber}</h3>
                          <p className="text-sm text-muted-foreground">
                            Customer: {getCustomerFullName(order)} ({order.customerPhone})
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${getStatusBadgeColor(order.status ?? "")}`}>
                          {order.status?.replace("_", " ")}
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
                          <span className="ml-4 font-medium">Amount:</span> R {getOrderPrice(order)}
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-xs text-muted-foreground">
                          Driver: <span className="font-semibold text-black">{order.driverName || "Not assigned"}</span>
                        </div>
                        <Button size="sm" onClick={() => openAssignModal(order)}>
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg">
                <h3 className="text-lg font-bold mb-4">Assign Order #{modalOrder.trackingNumber}</h3>
                <div className="mb-4">
                  <p className="mb-2 text-sm">Select a driver to assign:</p>
                  <select
                    className="w-full p-2 border rounded"
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
                <Button onClick={closeAssignModal} variant="outline">
                  Close
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="assigned-orders">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Orders by Driver</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading drivers and orders...</div>
              ) : drivers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No drivers available</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {drivers.map((driver) => {
                    const driverOrders = orders.filter((o) => o.driverName === getDriverFullName(driver));
                    const driverStatus = getDriverStatus(driver);

                    return (
                      <div key={driver.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{getDriverFullName(driver)}</h3>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                            {driverStatus.toUpperCase()}
                          </span>
                        </div>
                        {driverOrders.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No assigned orders.</p>
                        ) : (
                          <div className="space-y-2">
                            {driverOrders.map((order) => (
                              <div key={order.id} className="border rounded p-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="font-medium">#{order.trackingNumber}</span>
                                  <span className={`px-2 py-1 text-xs rounded ${getStatusBadgeColor(order.status ?? "")}`}>
                                    {order.status?.replace("_", " ")}
                                  </span>
                                </div>
                                <p>
                                  {order.pickupAddress} → {order.deliveryAddress}
                                </p>
                                <p>Customer: {getCustomerFullName(order)}</p>
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
              <CardTitle>Live Tracking (In-Transit Orders)</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">Loading orders...</div>
              ) : inTransitOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No orders in transit</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {inTransitOrders.map((order) => (
                    <div key={order.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold">Order #{order.trackingNumber}</h3>
                          <p className="text-sm text-muted-foreground">
                            {order.pickupAddress} → {order.deliveryAddress}
                          </p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded ${getStatusBadgeColor(order.status ?? "")}`}>
                          {order.status?.replace("_", " ")}
                        </span>
                      </div>
                      <div className="mt-2 text-sm">
                        <span className="font-medium">Recipient:</span>{" "}
                        {order.recipientName || getCustomerFullName(order)} (
                        {order.recipientPhone || order.customerPhone})
                      </div>
                      <div className="mt-1 text-sm">
                        <span className="font-medium">Service:</span> {order.serviceType} |{" "}
                        <span className="font-medium">Amount:</span> R {getOrderPrice(order)}
                      </div>
                      <div className="mt-1 text-sm">
                        <span className="font-medium">Driver:</span> {order.driverName || "Not assigned"}
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">Live tracking map will be shown here.</div>
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