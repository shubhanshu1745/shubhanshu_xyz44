import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/conversations/${conversationId}`],
    enabled: !!conversationId && !!user,
    refetchInterval: 5000, // Poll for new messages every 5 seconds
    select: (data: any) => data as ConversationData
  });
  
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      return response as MessageWithSender;
    },
    onSuccess: () => {
      // Reset input
      setNewMessage("");
      
      // Refetch messages
      queryClient.invalidateQueries({ queryKey: [`/api/conversations/${conversationId}`] });
      
      // Also invalidate the conversations list to update the last message
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    }
  });
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(newMessage);
    }
  };
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages]);
  
  // Mark messages as read when viewing conversation
  useEffect(() => {
    if (conversationId && user) {
      const markAsRead = async () => {
        try {
          await apiRequest(`/api/conversations/${conversationId}/read`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          });
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
          messages.map((message) => {
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
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message input */}
      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={sendMessageMutation.isPending || !newMessage.trim()}
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}