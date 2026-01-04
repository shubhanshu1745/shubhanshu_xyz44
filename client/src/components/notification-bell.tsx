import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getQueryFn } from "@/lib/queryClient";
import { Notifications } from "./notifications";
import { useToast } from "@/hooks/use-toast";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const eventSourceRef = useRef<EventSource | null>(null);

  // Fetch unread count
  const { data: unreadData } = useQuery<{ count: number }>({
    queryKey: ["/api/notifications/unread-count"],
    queryFn: getQueryFn(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Set up SSE for real-time notification count updates
  useEffect(() => {
    // Clean up any existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource("/api/notifications/stream", {
      withCredentials: true,
    });

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === "notification") {
          // Invalidate queries to refresh notification count
          queryClient.invalidateQueries({ queryKey: ["/api/notifications/unread-count"] });
          queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
          queryClient.invalidateQueries({ queryKey: ["/api/follow-requests"] });
          
          // Show toast for new notification if popover is closed
          if (!isOpen) {
            toast({
              title: data.notification.title,
              description: data.notification.message,
            });
          }
        }
      } catch (error) {
        console.error("Error parsing SSE data:", error);
      }
    };

    es.onerror = () => {
      // Silently handle errors - will reconnect automatically
    };

    eventSourceRef.current = es;

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [queryClient, toast, isOpen]);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-white hover:text-[#FFC107]">
          <Bell className="h-5 w-5" />
          {unreadData && unreadData.count > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadData.count > 99 ? "99+" : unreadData.count}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <Notifications />
      </PopoverContent>
    </Popover>
  );
}