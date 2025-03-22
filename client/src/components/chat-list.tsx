import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, MessageCircle, SendHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { User, Conversation, Message } from "@shared/schema";

type ConversationWithMeta = Conversation & {
  otherUser: Omit<User, "password">;
  lastMessage: Message | null;
  unreadCount: number;
};

export function ChatList() {
  const { user } = useAuth();
  const [_, setLocation] = useLocation();
  const [newMessageUsername, setNewMessageUsername] = useState("");
  const queryClient = useQueryClient();
  
  const { data: conversations, isLoading, error } = useQuery<ConversationWithMeta[]>({
    queryKey: ["/api/conversations"],
    enabled: !!user
  });
  
  const createConversationMutation = useMutation<ConversationWithMeta, Error, string>({
    mutationFn: async (username: string) => {
      return apiRequest<ConversationWithMeta>("POST", "/api/conversations", {
        username
      });
    },
    onSuccess: (newConversation) => {
      // Reset search input
      setNewMessageUsername("");
      
      // Update the conversations list
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      
      // Navigate to the new conversation
      setLocation(`/chat/${newConversation.id}`);
    }
  });
  
  const handleNewConversation = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessageUsername) {
      createConversationMutation.mutate(newMessageUsername);
    }
  };
  
  const handleConversationClick = (conversationId: number) => {
    setLocation(`/chat/${conversationId}`);
  };
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };
  
  const getTimeDisplay = (timestamp: Date | null) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return format(date, 'HH:mm');
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-10 w-full" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-4 w-2/3 mb-2" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 text-center text-destructive">
        Failed to load conversations
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <form onSubmit={handleNewConversation} className="flex gap-2">
          <Input
            value={newMessageUsername}
            onChange={(e) => setNewMessageUsername(e.target.value)}
            placeholder="Enter username to chat"
            className="flex-1"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={createConversationMutation.isPending || !newMessageUsername}
          >
            {createConversationMutation.isPending ? 
              <Skeleton className="h-5 w-5 rounded-full" /> : 
              <SendHorizontal className="h-5 w-5" />
            }
          </Button>
        </form>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        {conversations && conversations.length > 0 ? (
          conversations.map(conversation => (
            <div
              key={conversation.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-md cursor-pointer hover:bg-muted mb-1",
                conversation.unreadCount > 0 && "bg-muted"
              )}
              onClick={() => handleConversationClick(conversation.id)}
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={conversation.otherUser.profileImage || undefined} />
                <AvatarFallback>
                  {getInitials(conversation.otherUser.fullName || conversation.otherUser.username)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 overflow-hidden">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium truncate">
                    {conversation.otherUser.fullName || conversation.otherUser.username}
                  </h3>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {getTimeDisplay(conversation.lastMessageAt)}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <p className="text-sm text-muted-foreground truncate flex-1">
                    {conversation.lastMessage ? conversation.lastMessage.content : 'No messages yet'}
                  </p>
                  
                  {conversation.unreadCount > 0 && (
                    <Badge variant="secondary" className="h-5 w-5 flex items-center justify-center rounded-full p-0">
                      {conversation.unreadCount}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-4 text-center">
            <MessageCircle className="h-10 w-10 mb-2" strokeWidth={1.5} />
            <p>No conversations yet</p>
            <p className="text-sm">Search for a user to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}