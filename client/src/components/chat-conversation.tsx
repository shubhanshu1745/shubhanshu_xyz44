import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Socket } from "socket.io-client";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useSocket } from "@/hooks/use-socket";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, ArrowLeft, Image, Paperclip, MapPin, Mic, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
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
  const { socket, isConnected } = useSocket();
  const { toast } = useToast();
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();
  
  // Use React Query to fetch initial messages, but don't poll
  const { data, isLoading, error } = useQuery<ConversationData>({
    queryKey: [`/api/conversations/${conversationId}`],
    enabled: !!conversationId && !!user
  });
  
  // Set up event listeners for socket events
  useEffect(() => {
    if (!user || !conversationId || !socket || !isConnected) return;
    
    // Listen for new messages
    const handleNewMessage = (message: MessageWithSender) => {
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
    };
    
    // Listen for typing indicators
    const handleTypingIndicator = (data: { conversationId: number, userId: number }) => {
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
    };
    
    // Listen for read receipts
    const handleReadReceipts = (data: { conversationId: number, userId: number }) => {
      if (data.conversationId === conversationId) {
        // This would update the UI to show read receipts
        // For now, just invalidate the query to refresh
        queryClient.invalidateQueries({ queryKey: [`/api/conversations/${conversationId}`] });
      }
    };
    
    // Register event listeners
    socket.on("receive_message", handleNewMessage);
    socket.on("user_typing", handleTypingIndicator);
    socket.on("messages_read", handleReadReceipts);
    
    // Mark messages as read when first viewing conversation
    socket.emit("mark_read", { conversationId, userId: user.id });
    
    // Clean up event listeners
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socket.off("receive_message", handleNewMessage);
      socket.off("user_typing", handleTypingIndicator);
      socket.off("messages_read", handleReadReceipts);
    };
  }, [conversationId, user, queryClient, socket, isConnected]);
  
  // Handle typing indicator on input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (!isTyping && e.target.value.trim() !== "" && socket && isConnected) {
      setIsTyping(true);
      socket.emit("typing", { conversationId, userId: user?.id });
      
      // Reset typing status after 2 seconds
      setTimeout(() => {
        setIsTyping(false);
      }, 2000);
    }
  };
  
  // Handle file selection
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    setUploadingMedia(true);
    
    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversationId', conversationId.toString());
      
      // Upload the file
      const response = await fetch('/api/messages/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload file');
      }
      
      const data = await response.json();
      
      // Send the message with media via socket
      if (socket && isConnected && user) {
        socket.emit("send_message", {
          conversationId,
          senderId: user.id,
          text: file.name,
          messageType: file.type.startsWith('image/') ? 'image' : 'document',
          mediaUrl: data.url
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload your file. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploadingMedia(false);
      setShowAttachmentOptions(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Handle image preview before sending
  const handleImagePreview = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const file = files[0];
    if (!file.type.startsWith('image/')) {
      handleFileSelect(e);
      return;
    }
    
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // Cancel image preview
  const cancelPreview = () => {
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Send media message after preview
  const sendMediaMessage = async () => {
    if (!fileInputRef.current?.files?.length) return;
    await handleFileSelect({ target: { files: fileInputRef.current.files } } as React.ChangeEvent<HTMLInputElement>);
    setPreviewImage(null);
  };
  
  // Send message using socket instead of API call
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newMessage.trim() && socket && isConnected && user) {
      // Send message through socket
      socket.emit("send_message", {
        conversationId,
        senderId: user.id,
        text: newMessage.trim(),
        messageType: 'text'
      });
      
      // Clear input right away for better UX
      setNewMessage("");
    }
  };
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages, otherUserTyping]);
  
  // Mark messages as read through REST API as a backup
  useEffect(() => {
    if (conversationId && user) {
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
                      {message.messageType === 'image' && message.mediaUrl ? (
                        <div className="mb-2">
                          <img 
                            src={message.mediaUrl} 
                            alt="Shared image" 
                            className="rounded-lg max-w-full cursor-pointer hover:opacity-90 transition-opacity"
                          />
                          {message.content && <p className="mt-2">{message.content}</p>}
                        </div>
                      ) : message.messageType === 'document' && message.mediaUrl ? (
                        <div className="flex items-center gap-2">
                          <Paperclip className="h-4 w-4 shrink-0" />
                          <a 
                            href={message.mediaUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="underline underline-offset-2 hover:text-primary"
                          >
                            {message.content}
                          </a>
                        </div>
                      ) : (
                        <>{message.content}</>
                      )}
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
      
      {/* Image preview */}
      {previewImage && (
        <div className="p-4 border-t">
          <div className="relative p-2 border rounded-lg">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 rounded-full bg-background/80"
              onClick={cancelPreview}
            >
              <X className="h-4 w-4" />
            </Button>
            <img 
              src={previewImage} 
              alt="Preview" 
              className="w-40 h-40 object-contain mx-auto rounded-md"
            />
            <div className="flex justify-end mt-2">
              <Button 
                onClick={sendMediaMessage}
                disabled={uploadingMedia}
              >
                {uploadingMedia ? "Sending..." : "Send Image"}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* File input (hidden) */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImagePreview}
        className="hidden"
        accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      />
      
      {/* Message input */}
      <div className="p-4 border-t">
        {showAttachmentOptions && (
          <div className="flex justify-start gap-2 mb-3 p-2 bg-muted rounded-lg">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => {
                fileInputRef.current?.click();
                setShowAttachmentOptions(false);
              }}
            >
              <Image className="h-5 w-5 text-blue-500" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => {
                fileInputRef.current?.click();
                setShowAttachmentOptions(false);
              }}
            >
              <Paperclip className="h-5 w-5 text-green-500" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => {
                toast({
                  title: "Coming Soon",
                  description: "Location sharing will be available soon!"
                });
                setShowAttachmentOptions(false);
              }}
            >
              <MapPin className="h-5 w-5 text-red-500" />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => {
                toast({
                  title: "Coming Soon",
                  description: "Voice messages will be available soon!"
                });
                setShowAttachmentOptions(false);
              }}
            >
              <Mic className="h-5 w-5 text-amber-500" />
            </Button>
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowAttachmentOptions(!showAttachmentOptions)}
            className="rounded-full"
          >
            <Paperclip className="h-5 w-5" />
          </Button>
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