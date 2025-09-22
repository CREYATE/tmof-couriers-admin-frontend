import { Client, IMessage } from "@stomp/stompjs";
import SockJS from "sockjs-client";

let client: Client | null = null;

export const initializeWebSocket = (): Client => {
  if (client && client.connected) {
    return client;
  }

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
  client = new Client({
    webSocketFactory: () => new SockJS(`${backendUrl}/ws`),
    connectHeaders: {
      Authorization: `Bearer ${localStorage.getItem("jwt") || ""}`,
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    onConnect: () => {
      console.log("WebSocket connected");
    },
    onDisconnect: () => {
      console.log("WebSocket disconnected");
    },
    onStompError: (frame) => {
      console.error("WebSocket error:", frame);
    },
    onWebSocketClose: () => {
      console.log("WebSocket closed, attempting to reconnect...");
    },
  });

  client.activate();
  return client;
};

export const subscribeToTopic = (client: Client, topic: string, callback: (message: IMessage) => void) => {
  if (client.connected) {
    return client.subscribe(topic, callback, { id: topic });
  } else {
    console.warn("WebSocket not connected, attempting to subscribe after connection...");
    const subscription = client.onConnect = () => {
      console.log("WebSocket connected, subscribing to topic:", topic);
      client.subscribe(topic, callback, { id: topic });
    };
    return {
      unsubscribe: () => {
        if (client.connected) {
          client.unsubscribe(topic);
        }
      },
      id: topic,
    };
  }
};

export const disconnectWebSocket = () => {
  if (client) {
    client.deactivate();
    client = null;
  }
};