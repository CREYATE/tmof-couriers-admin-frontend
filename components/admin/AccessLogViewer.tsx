"use client";

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User } from "lucide-react";
import { useRouter } from "next/navigation";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import TmofSpinner from "@/components/ui/TmofSpinner";

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

    // Create STOMP client with SockJS
    const socket = new SockJS(`http://localhost:8080/ws?token=${encodeURIComponent(token)}`);
    const stompClient = new Client({
      webSocketFactory: () => socket,
      debug: function (str) {
        console.log("STOMP Debug:", str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    stompClient.onConnect = function (frame) {
      console.log("Connected to WebSocket: " + frame);
      stompClient.subscribe("/topic/access-logs", (message) => {
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
    };

    stompClient.onStompError = function (frame) {
      setError("Failed to connect to WebSocket");
      console.error("WebSocket connection error:", frame);
    };

    stompClient.activate();

    return () => {
      if (stompClient.active) {
        stompClient.deactivate();
      }
    };
  }, [router]);

  if (loading) return <TmofSpinner show={true} />;
  if (error) return <p className="text-tmof-red">{error}</p>;

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold mt-6 mb-2">System Login Tracker</h2>
      <div className="mt-6" />
      <Card>
        <CardHeader>
          <CardTitle>Driver Login Activity</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default AccessLogViewer;