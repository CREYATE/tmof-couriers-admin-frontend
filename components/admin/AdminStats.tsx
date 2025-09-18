"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Users, Truck, DollarSign, AlertCircle, CheckCircle } from "lucide-react";

// Mock stats
const stats = {
  totalOrders: 12,
  activeOrders: 3,
  completedOrders: 8,
  totalDrivers: 5,
  activeDrivers: 2,
  totalRevenue: 1200.5
};

const statCards = [
  {
    title: "Total Orders",
    value: stats.totalOrders,
    icon: Package,
    color: "text-blue-600"
  },
  {
    title: "Active Orders",
    value: stats.activeOrders,
    icon: AlertCircle,
    color: "text-orange-600"
  },
  {
    title: "Completed Orders",
    value: stats.completedOrders,
    icon: CheckCircle,
    color: "text-green-600"
  },
  {
    title: "Total Drivers",
    value: stats.totalDrivers,
    icon: Users,
    color: "text-purple-600"
  },
  {
    title: "Active Drivers",
    value: stats.activeDrivers,
    icon: Truck,
    color: "text-indigo-600"
  },
  {
    title: "Total Revenue",
    value: `R${stats.totalRevenue.toFixed(2)}`,
    icon: DollarSign,
    color: "text-green-600"
  }
];

const AdminStats = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
    {statCards.map((stat, index) => (
      <Card key={index}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
          <stat.icon className={`h-4 w-4 ${stat.color}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stat.value}</div>
        </CardContent>
      </Card>
    ))}
  </div>
);

export default AdminStats;
