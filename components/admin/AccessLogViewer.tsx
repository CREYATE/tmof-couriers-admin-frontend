"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";
import { useRouter } from "next/navigation";
// Remove: import { Client } from "@stomp/stompjs";
// Remove: import SockJS from "sockjs-client";
import TmofSpinner from "@/components/ui/TmofSpinner";
// Add: Import your WS helpers
import { initializeWebSocket, subscribeToTopic, disconnectWebSocket } from "@/lib/websocket";

type AccessLog = {
  id: string;
  name: string;
  profilePic?: string;
  login: string;
  logout: string;
};

const isValidJwt = (token: string | null): boolean => {
  if (!token) return false;
  // Check for three parts (header.payload.signature)
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  try {
    // Basic validation to ensure token can be decoded
    const payload = JSON.parse(atob(parts[1]));
    return payload.sub && payload.role && payload.exp > Math.floor(Date.now() / 1000);
  } catch (err) {
    console.error("Invalid JWT payload:", err);
    return false;
  }
};

const AccessLogViewer = () => {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  // Add: Ref for subscription
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("jwt");
    if (!token || !isValidJwt(token)) {
      setError("Invalid or missing authentication token. Please log in.");
      setLoading(false);
      localStorage.removeItem("jwt");
      localStorage.removeItem("driver_jwt");
      localStorage.removeItem("admin_jwt");
      localStorage.removeItem("authToken");
      router.push("/admin/login");
      return;
    }

    const fetchLogs = async () => {
      try {
        const response = await fetch("/api/admin/access-logs", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.status === 403) {
          setError("Access denied. Admin privileges required.");
          setLoading(false);
          localStorage.removeItem("jwt");
          router.push("/admin/login");
          return;
        }
        const data = await response.json();
        if (response.ok) {
          setLogs(data);
        } else {
          setError(data.error || "Failed to load logs");
        }
      } catch (err) {
        setError("An error occurred while fetching logs");
        console.error("Fetch error:", err);
      }
      setLoading(false);
    };

    fetchLogs();

    // Initialize WS client
    const stompClient = initializeWebSocket();

    // Subscribe to topic (handles connection if needed)
    subscriptionRef.current = subscribeToTopic(stompClient, "/topic/access-logs", (message) => {
      try {
        const newLog = JSON.parse(message.body);
        setLogs((prevLogs) => {
          const existingLogIndex = prevLogs.findIndex((log) => log.id === newLog.id);
          if (existingLogIndex !== -1) {
            const updatedLogs = [...prevLogs];
            updatedLogs[existingLogIndex] = newLog;
            return updatedLogs;
          } else {
            return [...prevLogs, newLog];
          }
        });
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    });

    // Cleanup
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      disconnectWebSocket();
    };
  }, [router]);

  if (loading) return <TmofSpinner show={true} />;
  if (error) return <p className="text-red-600 p-4">{error}</p>;

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      <h2 className="text-xl sm:text-2xl font-bold">System Login Tracker</h2>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Driver Login Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          {/* Desktop Table View */}
          <div className="hidden lg:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-2">Driver</th>
                  <th>Login Time</th>
                  <th>Logout Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log: any) => (
                  <tr key={log.id} className="border-b">
                    <td className="py-2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {log.profilePic ? (
                            <img
                              src={`data:image/jpeg;base64,${log.profilePic}`}
                              alt="Profile"
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <User className="h-6 w-6 text-gray-400" />
                          )}
                        </div>
                        <span>{log.name}</span>
                      </div>
                    </td>
                    <td>{log.login}</td>
                    <td>{log.logout}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No access logs available</p>
              </div>
            ) : (
              logs.map((log: any) => (
                <div key={log.id} className="border rounded-lg p-3 sm:p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {log.profilePic ? (
                        <img
                          src={`data:image/jpeg;base64,${log.profilePic}`}
                          alt="Profile"
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <User className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base truncate">{log.name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">Driver</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                    <div className="p-2 bg-green-50 rounded">
                      <span className="font-medium text-green-800">Login:</span>
                      <p className="text-green-700 mt-1">{log.login}</p>
                    </div>
                    <div className="p-2 bg-orange-50 rounded">
                      <span className="font-medium text-orange-800">Logout:</span>
                      <p className="text-orange-700 mt-1">{log.logout || "Still active"}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessLogViewer;