"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Edit, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { initializeWebSocket, subscribeToTopic, disconnectWebSocket } from "@/lib/websocket";
import { Client } from "@stomp/stompjs";

interface Driver {
  id: string;
  name: string;
  vehicle_type: string;
  phone?: string;
}

interface Order {
  id: string;
  trackingNumber: string;
  customerName: string;
  customerPhone: string;
  serviceType: string;
  status: string;
  pickupAddress: string;
  deliveryAddress: string;
  quotation: number;
  createdAt: string;
  driverName?: string;
  deliveryNotes?: string;
}

const OrderManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const wsClientRef = useRef<Client | null>(null);
  // Add: Track subscriptions for cleanup
  const subscriptionsRef = useRef<any[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch("/api/orders/status?statuses=PAID,AWAITING_COLLECTION", {
          headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
        });
        const data = await response.json();
        if (response.ok) {
          setOrders(data);
        } else {
          setError(data.error || "Failed to fetch orders");
        }
      } catch (err) {
        setError("An error occurred while fetching orders");
        console.error(err);
      }
      setIsLoading(false);
    };

    const fetchDrivers = async () => {
      try {
        const response = await fetch("/api/admin/drivers/available", {
          headers: { Authorization: `Bearer ${localStorage.getItem("jwt")}` },
        });
        const data = await response.json();
        if (response.ok) {
          setDrivers(data);
        } else {
          setError(data.error || "Failed to fetch drivers");
        }
      } catch (err) {
        setError("An error occurred while fetching drivers");
        console.error(err);
      }
    };

    fetchOrders();
    fetchDrivers();

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

    const client = wsClientRef.current;

    // Clear old subs
    subscriptionsRef.current.forEach((sub) => sub.unsubscribe());
    subscriptionsRef.current = [];

    // Subscribe to orders
    const orderSub = subscribeToTopic(client, "/topic/orders", (message) => {
      const order = JSON.parse(message.body);
      setOrders((prev) =>
        prev.some((o) => o.trackingNumber === order.trackingNumber)
          ? prev.map((o) => (o.trackingNumber === order.trackingNumber ? order : o))
          : [...prev, order]
      );
    });
    subscriptionsRef.current.push(orderSub);

    // Subscribe to driver assignments
    const assignmentSub = subscribeToTopic(client, "/topic/driver-assignments", (message) => {
      const order = JSON.parse(message.body);
      setOrders((prev) =>
        prev.map((o) => (o.trackingNumber === order.trackingNumber ? order : o))
      );
    });
    subscriptionsRef.current.push(assignmentSub);

    // Cleanup on unmount
    return () => {
      subscriptionsRef.current.forEach((sub) => sub.unsubscribe());
      subscriptionsRef.current = [];
    };
  }, [orders.length]);

  const handleAssignDriver = async (trackingNumber: string, driverId: string) => {
    try {
      const response = await fetch("/api/orders/assign-driver", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
        body: JSON.stringify({ trackingNumber, driverId }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Failed to assign driver");
      }
    } catch (err) {
      setError("An error occurred while assigning driver");
      console.error(err);
    }
  };

  const filteredOrders = orders.filter(
    (order) =>
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.trackingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone.includes(searchTerm)
  );

  const getStatusColor = (status: string): string => {
    switch (status) {
      case "PAID":
      case "AWAITING_COLLECTION":
        return "bg-blue-100 text-blue-800";
      case "COLLECTED":
        return "bg-yellow-100 text-yellow-800";
      case "IN_TRANSIT":
        return "bg-purple-100 text-purple-800";
      case "DELIVERED":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Management</CardTitle>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input
              className="pl-10"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && <p className="text-red-500 text-center">{error}</p>}
        {isLoading ? (
          <p className="text-center">Loading...</p>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{order.customerName}</h3>
                    <p className="text-sm text-gray-500">Tracking: {order.trackingNumber}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(order.status)}>{order.status.replace("_", " ")}</Badge>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Edit Order #{order.trackingNumber}</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Tracking ID</Label>
                            <Input value={order.trackingNumber} readOnly className="bg-gray-50" />
                          </div>
                          <div>
                            <Label>Customer Name</Label>
                            <Input value={order.customerName} readOnly />
                          </div>
                          <div>
                            <Label>Service Type</Label>
                            <Input value={order.serviceType} readOnly />
                          </div>
                          <div>
                            <Label>Status</Label>
                            <Input value={order.status.replace("_", " ")} readOnly />
                          </div>
                          <div>
                            <Label>Assign Driver</Label>
                            <Select
                              onValueChange={(driverId) => handleAssignDriver(order.trackingNumber, driverId)}
                              defaultValue={order.driverName ? drivers.find((d) => d.name === order.driverName)?.id : ""}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select driver" />
                              </SelectTrigger>
                              <SelectContent>
                                {drivers.map((driver) => (
                                  <SelectItem key={driver.id} value={driver.id}>
                                    {driver.name} - {driver.vehicle_type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-2">
                            <Label>Special Instructions</Label>
                            <Textarea
                              placeholder="Add special instructions..."
                              defaultValue={order.deliveryNotes || ""}
                              readOnly
                            />
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Pickup:</p>
                    <p className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {order.pickupAddress}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Dropoff:</p>
                    <p className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {order.deliveryAddress}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Amount: <strong>R{order.quotation}</strong></span>
                  <span>Created: {new Date(order.createdAt).toLocaleDateString()}</span>
                  <span>
                    Driver: <strong>{order.driverName || "Will be determined once drivers are available"}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderManagement;