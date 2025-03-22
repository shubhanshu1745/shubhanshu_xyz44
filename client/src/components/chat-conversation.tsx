import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { io, Socket } from "socket.io-client";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { User, Conversation, Message } from "@shared/schema";

type MessageWithSender = Message & {
  sender: Omit<User, "password">;
};

type ConversationData = {
  conversation: Conversation;
  otherUser: Omit<User, "password">;
  messages: MessageWithSender[];
};

interface ChatConversationProps {
  conversationId: number;
  onBack: () => void;
}

export function ChatConversation({ conversationId, onBack }: ChatConversationProps) {
  const { user } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();
  
  // Use React Query to fetch initial messages, but don't poll
  const { data, isLoading, error } = useQuery<ConversationData>({
    queryKey: [`/api/conversations/${conversationId}`],
    enabled: !!conversationId && !!user
  });
  
  // Initialize Socket.IO connection and handle events
  useEffect(() => {
    if (!user || !conversationId) return;
    
    // Connect to socket server
    socketRef.current = io(window.location.origin, {
      transports: ["websocket", "polling"]
    });
    
    const socket = socketRef.current;
    
    // Authenticate socket with user ID
    socket.emit("authenticate", user.id);
    
    // Listen for new messages
    socket.on("receive_message", (message: MessageWithSender) => {
      // If message is for this conversation, update the query cache
      if (message.conversationId === conversationId) {
        queryClient.setQueryData<ConversationData>(
          [`/api/conversations/${conversationId}`],
          (oldData) => {
            if (!oldData) return oldData;
            
            // Check if message already exists in the list to avoid duplicates
            const messageExists = oldData.messages.some(m => m.id === message.id);
            if (messageExists) return oldData;
            
            return {
              ...oldData,
              messages: [...oldData.messages, message]
            };
          }
        );
        
        // If the message is from the other user, mark it as read
        if (message.senderId !== user.id) {
          socket.emit("mark_read", { conversationId, userId: user.id });
        }
        
        // Reset typing indicator when message is received
        setOtherUserTyping(false);
      }
      
      // Update the conversations list to show latest message
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    });
    
    // Listen for typing indicators
    socket.on("user_typing", (data: { conversationId: number, userId: number }) => {
      if (data.conversationId === conversationId && data.userId !== user.id) {
        setOtherUserTyping(true);
        
        // Clear typing indicator after 3 seconds of no updates
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        typingTimeoutRef.current = setTimeout(() => {
          setOtherUserTyping(false);
        }, 3000);
      }
    });
    
    // Listen for read receipts
    socket.on("messages_read", (data: { conversationId: number, userId: number }) => {
      if (data.conversationId === conversationId) {
        // This would update the UI to show read receipts
        // For now, just invalidate the query to refresh
        queryClient.invalidateQueries({ queryKey: [`/api/conversations/${conversationId}`] });
      }
    });
    
    // Clean up socket connection
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socket.off("receive_message");
      socket.off("user_typing");
      socket.off("messages_read");
      socket.disconnect();
    };
  }, [conversationId, user, queryClient]);
  
  // Handle typing indicator on input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!isTyping && e.target.value.trim() !== "") {
      setIsTyping(true);
      socketRef.current?.emit("typing", { conversationId, userId: user?.id });
      
      // Reset typing status after 2 seconds
      setTimeout(() => {
        setIsTyping(false);
      }, 2000);
    }
  };
  
  // Send message using socket instead of API call
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newMessage.trim() && socketRef.current && user) {
      // Send message through socket
      socketRef.current.emit("send_message", {
        conversationId,
        senderId: user.id,
        text: newMessage.trim()
      });
      
      // Clear input right away for better UX
      setNewMessage("");
    }
  };
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages, otherUserTyping]);
  
  // Mark messages as read when viewing conversation
  useEffect(() => {
    if (conversationId && user && socketRef.current) {
      socketRef.current.emit("mark_read", { conversationId, userId: user.id });
      
      // Also update the UI through API for initial load
      const markAsRead = async () => {
        try {
          await apiRequest<{ success: boolean }>("POST", `/api/conversations/${conversationId}/read`);
          // Invalidate conversations list to update unread counts
          queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
        } catch (error) {
          console.error("Error marking messages as read:", error);
        }
      };
      
      markAsRead();
    }
  }, [conversationId, user, queryClient]);
  
  const formatMessageTime = (timestamp: Date | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return format(date, "HH:mm");
  };
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b flex items-center gap-3">
          <Button onClick={onBack} variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Skeleton className="h-10 w-40" />
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto">
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i} 
              className={cn(
                "flex gap-2 mb-4",
                i % 2 === 0 ? "justify-end" : "justify-start"
              )}
            >
              {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full" />}
              <Skeleton className={cn(
                "h-12 w-48 rounded-2xl",
                i % 2 === 0 ? "rounded-tr-sm" : "rounded-tl-sm"
              )} />
            </div>
          ))}
        </div>
        
        <div className="p-4 border-t">
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }
  
  if (error || !data) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b flex items-center gap-3">
          <Button onClick={onBack} variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span>Conversation</span>
        </div>
        
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-destructive">Error loading conversation</p>
        </div>
      </div>
    );
  }
  
  const { otherUser, messages } = data;
  
  return (
    <div className="flex flex-col h-full">
      {/* Conversation header */}
      <div className="p-4 border-b flex items-center gap-3">
        <Button onClick={onBack} variant="ghost" size="icon" className="md:hidden">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <Avatar className="h-10 w-10">
          <AvatarImage src={otherUser.profileImage || undefined} />
          <AvatarFallback>
            {getInitials(otherUser.fullName || otherUser.username)}
          </AvatarFallback>
        </Avatar>
        
        <div>
          <h3 className="font-medium">{otherUser.fullName || otherUser.username}</h3>
          <p className="text-xs text-muted-foreground">
            {otherUser.username}
          </p>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {messages.map((message) => {
              const isCurrentUser = message.sender.id === user?.id;
              
              return (
                <div 
                  key={message.id} 
                  className={cn(
                    "flex gap-2 mb-4",
                    isCurrentUser ? "justify-end" : "justify-start"
                  )}
                >
                  {!isCurrentUser && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.sender.profileImage || undefined} />
                      <AvatarFallback>
                        {getInitials(message.sender.fullName || message.sender.username)}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div>
                    <div className={cn(
                      "px-4 py-2 rounded-2xl max-w-xs break-words",
                      isCurrentUser 
                        ? "bg-primary text-primary-foreground rounded-tr-sm" 
                        : "bg-muted rounded-tl-sm"
                    )}>
                      {message.content}
                    </div>
                    <div className={cn(
                      "text-xs text-muted-foreground mt-1",
                      isCurrentUser ? "text-right" : "text-left"
                    )}>
                      {formatMessageTime(message.createdAt)}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Typing indicator */}
            {otherUserTyping && (
              <div className="flex gap-2 mb-4 justify-start">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={otherUser.profileImage || undefined} />
                  <AvatarFallback>
                    {getInitials(otherUser.fullName || otherUser.username)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="px-4 py-2 rounded-2xl max-w-xs break-words bg-muted rounded-tl-sm">
                  <div className="flex gap-1">
                    <span className="typing-dot animate-pulse">●</span>
                    <span className="typing-dot animate-pulse delay-100">●</span>
                    <span className="typing-dot animate-pulse delay-200">●</span>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message input */}
      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={!newMessage.trim()}
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}