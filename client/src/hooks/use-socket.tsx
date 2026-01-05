import { createContext, useState, useEffect, useContext, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/hooks/use-auth";

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

export const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false
});

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  // Initialize socket when user is authenticated
  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Create socket connection with fallback to polling
    const newSocket = io(window.location.origin, {
      transports: ["polling", "websocket"], // Start with polling, upgrade to websocket
      upgrade: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    setSocket(newSocket);

    // Event listeners
    const onConnect = () => {
      setIsConnected(true);
      // Authenticate socket with user ID
      newSocket.emit("authenticate", user.id);
      console.log("Socket connected via", newSocket.io.engine.transport.name);
    };

    const onDisconnect = (reason: string) => {
      setIsConnected(false);
      console.log("Socket disconnected:", reason);
    };

    const onConnectError = (error: Error) => {
      console.warn("Socket connection error (will retry):", error.message);
    };

    const onReconnect = (attemptNumber: number) => {
      console.log("Socket reconnected after", attemptNumber, "attempts");
    };

    // Register event listeners
    newSocket.on("connect", onConnect);
    newSocket.on("disconnect", onDisconnect);
    newSocket.on("connect_error", onConnectError);
    newSocket.io.on("reconnect", onReconnect);

    // Cleanup
    return () => {
      newSocket.off("connect", onConnect);
      newSocket.off("disconnect", onDisconnect);
      newSocket.off("connect_error", onConnectError);
      newSocket.io.off("reconnect", onReconnect);
      newSocket.disconnect();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}