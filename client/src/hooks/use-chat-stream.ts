import { useEffect, useRef, useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./use-auth";

export interface ChatEvent {
  type: "message" | "typing" | "seen" | "online" | "reaction" | "deleted" | "edited" | "connected";
  data: any;
}

export interface UseChatStreamOptions {
  onMessage?: (data: any) => void;
  onTyping?: (data: any) => void;
  onSeen?: (data: any) => void;
  onOnline?: (data: any) => void;
  onReaction?: (data: any) => void;
  onDeleted?: (data: any) => void;
  onEdited?: (data: any) => void;
}

export function useChatStream(options: UseChatStreamOptions = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const connect = useCallback(() => {
    if (!user || eventSourceRef.current) return;

    try {
      const eventSource = new EventSource("/api/chat/stream", {
        withCredentials: true
      });

      eventSource.onopen = () => {
        console.log("Chat SSE connected");
        setIsConnected(true);
        setConnectionError(null);
      };

      eventSource.onerror = (error) => {
        console.error("Chat SSE error:", error);
        setIsConnected(false);
        setConnectionError("Connection lost");
        
        // Close and attempt reconnect
        eventSource.close();
        eventSourceRef.current = null;
        
        // Reconnect after 3 seconds
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      // Handle connected event
      eventSource.addEventListener("connected", (event) => {
        console.log("Chat stream connected:", event.data);
        setIsConnected(true);
      });

      // Handle new message
      eventSource.addEventListener("message", (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("New message received:", data);
          
          // Invalidate conversations query to update list
          queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
          
          // Invalidate specific conversation messages
          if (data.conversationId) {
            queryClient.invalidateQueries({ 
              queryKey: [`/api/chat/conversations/${data.conversationId}/messages`] 
            });
          }
          
          options.onMessage?.(data);
        } catch (e) {
          console.error("Error parsing message event:", e);
        }
      });

      // Handle typing indicator
      eventSource.addEventListener("typing", (event) => {
        try {
          const data = JSON.parse(event.data);
          options.onTyping?.(data);
        } catch (e) {
          console.error("Error parsing typing event:", e);
        }
      });

      // Handle seen status
      eventSource.addEventListener("seen", (event) => {
        try {
          const data = JSON.parse(event.data);
          options.onSeen?.(data);
        } catch (e) {
          console.error("Error parsing seen event:", e);
        }
      });

      // Handle online status
      eventSource.addEventListener("online", (event) => {
        try {
          const data = JSON.parse(event.data);
          options.onOnline?.(data);
        } catch (e) {
          console.error("Error parsing online event:", e);
        }
      });

      // Handle reaction
      eventSource.addEventListener("reaction", (event) => {
        try {
          const data = JSON.parse(event.data);
          options.onReaction?.(data);
        } catch (e) {
          console.error("Error parsing reaction event:", e);
        }
      });

      // Handle deleted
      eventSource.addEventListener("deleted", (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Invalidate messages query
          if (data.conversationId) {
            queryClient.invalidateQueries({ 
              queryKey: [`/api/chat/conversations/${data.conversationId}/messages`] 
            });
          }
          
          options.onDeleted?.(data);
        } catch (e) {
          console.error("Error parsing deleted event:", e);
        }
      });

      // Handle edited
      eventSource.addEventListener("edited", (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Invalidate messages query
          if (data.conversationId) {
            queryClient.invalidateQueries({ 
              queryKey: [`/api/chat/conversations/${data.conversationId}/messages`] 
            });
          }
          
          options.onEdited?.(data);
        } catch (e) {
          console.error("Error parsing edited event:", e);
        }
      });

      eventSourceRef.current = eventSource;
    } catch (error) {
      console.error("Failed to create EventSource:", error);
      setConnectionError("Failed to connect");
    }
  }, [user, queryClient, options]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (user) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [user, connect, disconnect]);

  return {
    isConnected,
    connectionError,
    reconnect: connect,
    disconnect
  };
}
