"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle, CheckCircle, Eye } from "lucide-react";

const mockAccessLogs = [
  { id: "1", order_id: "ORD-1234", user_id: "USR-5678", access_type: "view", success: true, created_at: new Date().toISOString() },
  { id: "2", order_id: "ORD-4321", user_id: "USR-8765", access_type: "edit", success: false, created_at: new Date().toISOString() }
];

const AccessLogViewer = () => {
  const userRole = "admin";
  const accessLogs = mockAccessLogs;
  const isLoading = false;

  if (userRole !== 'admin') {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-gray-600">Only administrators can view access logs.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <div>Loading access logs...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          Order Access Logs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {accessLogs?.map((log) => (
            <div key={log.id} className="border rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {log.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  )}
                  <Eye className="h-4 w-4 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Order: {log.order_id?.slice(0, 8)}</p>
                  <p className="text-xs text-gray-500">User: {log.user_id?.slice(0, 8)} | Type: {log.access_type}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={log.success ? "default" : "destructive"}>
                  {log.success ? "Success" : "Denied"}
                </Badge>
                <p className="text-xs text-gray-500 mt-1">{new Date(log.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AccessLogViewer;
