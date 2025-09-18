"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Edit, MapPin, QrCode } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const mockOrders = [
  {
    id: "1",
    tracking_id: "TMOF-0001",
    customer_name: "Alice",
    customer_phone: "+27 12 345 6789",
    service_type: "standard",
    order_status: "created",
    pickup_address: "123 Main St",
    pickup_city: "Cape Town",
    dropoff_address: "456 Oak Ave",
    dropoff_city: "Cape Town",
    quotation: 100,
    created_at: new Date().toISOString(),
    assigned_driver_id: "1",
    special_instructions: "Leave at the door",
    drivers: { id: "1", name: "John Doe", phone: "+27 11 123 4567", vehicle_type: "car" }
  }
];
const mockDrivers = [
  { id: "1", name: "John Doe", vehicle_type: "car" },
  { id: "2", name: "Jane Smith", vehicle_type: "van" }
];

const OrderManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [orders, setOrders] = useState(mockOrders);
  const drivers = mockDrivers;

  const filteredOrders = orders.filter(order =>
    order.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customer_phone.includes(searchTerm) ||
    (order.tracking_id && order.tracking_id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

interface Driver {
    id: string;
    name: string;
    vehicle_type: string;
    phone?: string;
}

interface Order {
    id: string;
    tracking_id?: string;
    customer_name: string;
    customer_phone: string;
    service_type: string;
    order_status?: string;
    pickup_address: string;
    pickup_city: string;
    dropoff_address: string;
    dropoff_city: string;
    quotation: number;
    created_at: string;
    assigned_driver_id?: string;
    special_instructions?: string;
    drivers?: Driver;
}

const getStatusColor = (status: string): string => {
    switch (status) {
        case 'created': return 'bg-blue-100 text-blue-800';
        case 'assigned': return 'bg-yellow-100 text-yellow-800';
        case 'picked_up': return 'bg-orange-100 text-orange-800';
        case 'in_transit': return 'bg-purple-100 text-purple-800';
        case 'delivered': return 'bg-green-100 text-green-800';
        case 'cancelled': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
    }
};

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Management</CardTitle>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <Input className="pl-10" placeholder="Search orders..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{order.customer_name}</h3>
                  <p className="text-sm text-gray-500">Tracking: {order.tracking_id || `TMOF-${order.id.slice(0, 8)}`}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(order.order_status || 'created')}>
                    {order.order_status || 'created'}
                  </Badge>
                  {!order.tracking_id && (
                    <Button variant="outline" size="sm">
                      <QrCode className="h-4 w-4 mr-1" />
                      Generate ID
                    </Button>
                  )}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Edit Order #{order.id.slice(0, 8)}</DialogTitle>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Tracking ID</Label>
                          <Input value={order.tracking_id || 'Not generated'} readOnly className="bg-gray-50" />
                        </div>
                        <div>
                          <Label>Customer Name</Label>
                          <Input value={order.customer_name} readOnly />
                        </div>
                        <div>
                          <Label>Service Type</Label>
                          <Input value={order.service_type} readOnly />
                        </div>
                        <div>
                          <Label>Status</Label>
                          <Select value={order.order_status || 'created'}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="created">Created</SelectItem>
                              <SelectItem value="assigned">Assigned</SelectItem>
                              <SelectItem value="picked_up">Picked Up</SelectItem>
                              <SelectItem value="in_transit">In Transit</SelectItem>
                              <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                              <SelectItem value="delivered">Delivered</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Assign Driver</Label>
                          <Select value={order.assigned_driver_id || ''}>
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
                          <Textarea placeholder="Add special instructions..." defaultValue={order.special_instructions || ''} />
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
                    {order.pickup_address}, {order.pickup_city}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Dropoff:</p>
                  <p className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {order.dropoff_address}, {order.dropoff_city}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Amount: <strong>R{order.quotation}</strong></span>
                <span>Created: {new Date(order.created_at).toLocaleDateString()}</span>
                {order.drivers && (
                  <span>Driver: <strong>{order.drivers.name}</strong></span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderManagement;
