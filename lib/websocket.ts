import { Client, IMessage } from "@stomp/stompjs";

export { Client }; // Export the Client type

let client: Client | null = null;

export const initializeWebSocket = (): Client => {
  if (client && client.connected) {
    return client;
  }

  // Dynamic secure native WS URL
  let wsUrl;
  if (typeof window !== 'undefined') {
    const isSecure = window.location.protocol === 'https:';
    const protocol = isSecure ? 'wss' : 'ws';
    const backendHost = isSecure ? 'tmof-couriers.onrender.com' : 'localhost:8080';
    wsUrl = `${protocol}://${backendHost}/ws`;
  } else {
    // SSR fallback
    wsUrl = process.env.NEXT_PUBLIC_BACKEND_WS_URL || 'ws://localhost:8080/ws';
  }
  console.log('Admin Native WebSocket URL:', wsUrl);  // Debug: Confirm wss:// in prod console

  // Native WebSocket factory (no SockJS)
  const webSocketFactory = () => new WebSocket(wsUrl);

  client = new Client({
    webSocketFactory,  // Native WS here
    connectHeaders: {
      Authorization: `Bearer ${localStorage.getItem('jwt') || ''}`,
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
    onConnect: () => {
      console.log('Admin WebSocket connected');
    },
    onDisconnect: () => {
      console.log('Admin WebSocket disconnected');
    },
    onStompError: (frame) => {
      console.error('Admin WebSocket STOMP error:', frame);
    },
    onWebSocketClose: () => {
      console.log('Admin WebSocket closed, attempting to reconnect...');
    },
    onWebSocketError: (error) => {
      console.error('Admin WebSocket error:', error);
    },
  });

  client.activate();
  return client;
};

export const subscribeToTopic = (
  client: Client,
  topic: string,
  callback: (message: IMessage) => void
) => {
  if (client.connected) {
    return client.subscribe(topic, callback, { id: topic });
  } else {
    console.warn("Admin WebSocket not connected, attempting to subscribe after connection...");
    const subscription = client.onConnect = () => {
      console.log("Admin WebSocket connected, subscribing to topic:", topic);
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
    console.log("Admin WebSocket client deactivated");
  }
};