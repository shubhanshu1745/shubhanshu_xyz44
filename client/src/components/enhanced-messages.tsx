import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Phone, Video, Info, Image, Smile, Mic, Heart, Camera, Search, MoreHorizontal, ArrowLeft, Check, CheckCheck, Star, Archive, Trash2, Shield, VolumeX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Message, User, Conversation } from "@shared/schema";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { VerificationBadge } from "@/components/verification-badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface MessageBubbleProps {
  message: Message & { user: User };
  isOwn: boolean;
  showAvatar: boolean;
  isLast: boolean;
}

function MessageBubble({ message, isOwn, showAvatar, isLast }: MessageBubbleProps) {
  const formatMessageTime = (date: Date | null) => {
    if (!date) return "";
    const messageDate = new Date(date);
    
    if (isToday(messageDate)) {
      return format(messageDate, "HH:mm");
    } else if (isYesterday(messageDate)) {
      return `Yesterday ${format(messageDate, "HH:mm")}`;
    } else {
      return format(messageDate, "MMM d, HH:mm");
    }
  };

  const getMessageStatus = () => {
    if (!isOwn) return null;
    
    if (message.read) {
      return <CheckCheck className="h-3 w-3 text-blue-500" />;
    } else {
      return <Check className="h-3 w-3 text-gray-400" />;
    }
  };

  const isImage = message.mediaUrl && (
    message.mediaUrl.includes('.jpg') || 
    message.mediaUrl.includes('.jpeg') || 
    message.mediaUrl.includes('.png') || 
    message.mediaUrl.includes('.gif')
  );

  const isVideo = message.mediaUrl && (
    message.mediaUrl.includes('.mp4') || 
    message.mediaUrl.includes('.mov') || 
    message.mediaUrl.includes('.webm')
  );

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1 group`}>
      <div className={`flex items-end space-x-2 max-w-xs lg:max-w-md ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar */}
        {showAvatar && !isOwn && (
          <Avatar className="h-6 w-6 mb-1">
            <AvatarImage src={message.user.profileImage || ""} alt={message.user.username} />
            <AvatarFallback className="text-xs">{message.user.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        )}
        
        {/* Message Content */}
        <div className={`relative ${isOwn ? 'ml-6' : 'mr-6'}`}>
          {/* Media Content */}
          {message.mediaUrl && (
            <div className="mb-1">
              {isImage ? (
                <img
                  src={message.mediaUrl || ""}
                  alt="Shared image"
                  className="rounded-2xl max-w-full h-auto cursor-pointer hover:opacity-95 transition-opacity"
                  onClick={() => message.mediaUrl && window.open(message.mediaUrl, '_blank')}
                />
              ) : isVideo ? (
                <video
                  src={message.mediaUrl}
                  controls
                  className="rounded-2xl max-w-full h-auto"
                  preload="metadata"
                />
              ) : (
                <div className="bg-gray-100 rounded-2xl p-3 border">
                  <p className="text-sm text-gray-600">📎 {message.mediaUrl.split('/').pop()}</p>
                </div>
              )}
            </div>
          )}

          {/* Text Content */}
          {message.content && (
            <div
              className={`px-4 py-2 rounded-2xl ${
                isOwn
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              } ${!message.mediaUrl ? '' : 'mt-1'}`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                {message.content}
              </p>
            </div>
          )}

          {/* Reactions - temporarily disabled for schema compatibility */}
          {false && (
            <div className="flex flex-wrap gap-1 mt-1">
              <div className="bg-white border border-gray-200 rounded-full px-2 py-1 text-xs flex items-center space-x-1 shadow-sm">
                <span>❤️</span>
                <span className="text-gray-600">1</span>
              </div>
            </div>
          )}

          {/* Message Info */}
          <div className={`flex items-center space-x-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${isOwn ? 'justify-end' : ''}`}>
            <span className="text-xs text-gray-500">
              {formatMessageTime(message.createdAt)}
            </span>
            {getMessageStatus()}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ConversationListProps {
  selectedConversationId?: number;
  onSelectConversation: (conversation: Conversation & { otherUser: User; lastMessage?: Message }) => void;
  onNewMessage: () => void;
}

function ConversationList({ selectedConversationId, onSelectConversation, onNewMessage }: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: conversations, isLoading } = useQuery({
    queryKey: ["/api/conversations"],
    queryFn: getQueryFn(),
    refetchInterval: 5000, // Poll for new messages
  });

  const filteredConversations = conversations?.filter((conv: any) =>
    conv.otherUser.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.otherUser.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const formatLastMessageTime = (date: Date | null) => {
    if (!date) return "";
    const messageDate = new Date(date);
    
    if (isToday(messageDate)) {
      return format(messageDate, "HH:mm");
    } else if (isYesterday(messageDate)) {
      return "Yesterday";
    } else {
      return format(messageDate, "MMM d");
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b">
          <div className="h-8 bg-gray-200 rounded animate-pulse mb-4" />
        </div>
        <div className="flex-1 p-4 space-y-4">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-gray-200 rounded-full animate-pulse" />
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Messages</h2>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={onNewMessage}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-50 border-0 focus:bg-white focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Conversations */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No conversations yet</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={onNewMessage}
              >
                Start a conversation
              </Button>
            </div>
          ) : (
            filteredConversations.map((conversation: any) => (
              <div
                key={conversation.id}
                className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConversationId === conversation.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => onSelectConversation(conversation)}
              >
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={conversation.otherUser.profileImage || ""} alt={conversation.otherUser.username} />
                    <AvatarFallback>{conversation.otherUser.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {(conversation.otherUser as any).isOnline && (
                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-1">
                      <span className="font-medium text-gray-900 truncate">
                        {conversation.otherUser.fullName || conversation.otherUser.username}
                      </span>
                      {(conversation.otherUser as any).isVerified && <span className="text-blue-500 text-xs">✓</span>}
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatLastMessageTime(conversation.lastMessage?.createdAt)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.lastMessage?.content || "No messages yet"}
                    </p>
                    {conversation.unreadCount > 0 && (
                      <Badge variant="destructive" className="h-5 w-5 p-0 text-xs flex items-center justify-center">
                        {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

interface ChatWindowProps {
  conversation: Conversation & { otherUser: User };
  onBack: () => void;
}

function ChatWindow({ conversation, onBack }: ChatWindowProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Fetch messages
  const { data: messages, isLoading } = useQuery({
    queryKey: [`/api/conversations/${conversation.id}/messages`],
    queryFn: getQueryFn(),
    refetchInterval: 2000, // Real-time polling
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ content, mediaUrl }: { content?: string; mediaUrl?: string }) => {
      return await apiRequest("POST", `/api/conversations/${conversation.id}/messages`, {
        content,
        mediaUrl
      });
    },
    onSuccess: () => {
      setMessage("");
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["/api/conversations", conversation.id, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/conversations/${conversation.id}/read`);
    }
  });

  // File upload mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return await apiRequest("POST", "/api/upload", formData);
    },
    onSuccess: (response) => {
      sendMessageMutation.mutate({ mediaUrl: response.url });
    }
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark as read when conversation opens
  useEffect(() => {
    markAsReadMutation.mutate();
  }, [conversation.id]);

  // Handle typing indicators
  useEffect(() => {
    if (message.trim() && !isTyping) {
      setIsTyping(true);
      // Send typing indicator to server
    } else if (!message.trim() && isTyping) {
      setIsTyping(false);
      // Send stop typing to server
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        // Send stop typing to server
      }
    }, 3000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, isTyping]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() || selectedFile) {
      if (selectedFile) {
        uploadFileMutation.mutate(selectedFile);
      } else {
        sendMessageMutation.mutate({ content: message.trim() });
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowMediaPicker(false);
    }
  };

  const groupedMessages = messages?.reduce((groups: any[], message: any, index: number) => {
    const prevMessage = messages[index - 1];
    const shouldGroup = 
      prevMessage &&
      prevMessage.userId === message.userId &&
      new Date(message.createdAt).getTime() - new Date(prevMessage.createdAt).getTime() < 60000; // 1 minute

    if (shouldGroup) {
      groups[groups.length - 1].messages.push(message);
    } else {
      groups.push({ messages: [message], userId: message.userId });
    }
    return groups;
  }, []) || [];

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 lg:hidden"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <Link href={`/profile/${conversation.otherUser.username}`}>
            <div className="flex items-center space-x-3 cursor-pointer">
              <div className="relative">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={conversation.otherUser.profileImage || ""} alt={conversation.otherUser.username} />
                  <AvatarFallback>{conversation.otherUser.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                {/* Online indicator - would need to be implemented with real-time data */}
                <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 border-2 border-white rounded-full opacity-0" />
              </div>
              
              <div>
                <div className="flex items-center space-x-1">
                  <span className="font-medium text-gray-900">
                    {conversation.otherUser.fullName || conversation.otherUser.username}
                  </span>
                  {/* Verification badge - would need to be implemented with proper user schema */}
                </div>
                <p className="text-sm text-gray-500">
                  {(conversation.otherUser as any).isOnline ? "Active now" : 
                   (conversation.otherUser as any).lastActiveAt ? 
                   `Active ${formatDistanceToNow(new Date((conversation.otherUser as any).lastActiveAt), { addSuffix: true })}` : 
                   "Offline"}
                </p>
              </div>
            </div>
          </Link>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Phone className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Video className="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Info className="h-4 w-4 mr-2" />
                View profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <VolumeX className="h-4 w-4 mr-2" />
                Mute conversation
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Shield className="h-4 w-4 mr-2" />
                Block user
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete conversation
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="space-y-4">
            {Array(10).fill(0).map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-xs ${i % 2 === 0 ? 'bg-gray-200' : 'bg-blue-200'} rounded-2xl p-3 animate-pulse`}>
                  <div className="h-4 bg-current opacity-20 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {groupedMessages.map((group: any, groupIndex: number) => (
              <div key={groupIndex}>
                {group.messages.map((message: any, messageIndex: number) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.userId === user?.id}
                    showAvatar={messageIndex === 0}
                    isLast={messageIndex === group.messages.length - 1}
                  />
                ))}
              </div>
            ))}
            
            {otherUserTyping && (
              <div className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={conversation.otherUser.profileImage || ""} />
                  <AvatarFallback className="text-xs">
                    {conversation.otherUser.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 rounded-2xl px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        {selectedFile && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                {selectedFile.type.startsWith('image/') ? <Image className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
              </div>
              <span className="text-sm text-gray-700">{selectedFile.name}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFile(null)}
            >
              ×
            </Button>
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
          <div className="flex-1 relative">
            <Input
              placeholder="Message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="pr-12 rounded-full border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              disabled={sendMessageMutation.isPending || uploadFileMutation.isPending}
            />
            
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setShowMediaPicker(!showMediaPicker)}
              >
                <Image className="h-4 w-4 text-gray-400" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                <Smile className="h-4 w-4 text-gray-400" />
              </Button>
            </div>
          </div>

          {(message.trim() || selectedFile) ? (
            <Button
              type="submit"
              size="sm"
              className="rounded-full h-10 w-10 p-0 bg-blue-500 hover:bg-blue-600"
              disabled={sendMessageMutation.isPending || uploadFileMutation.isPending}
            >
              <Send className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full h-10 w-10 p-0"
            >
              <Heart className="h-4 w-4 text-red-500" />
            </Button>
          )}
        </form>

        {/* Media picker */}
        {showMediaPicker && (
          <div className="absolute bottom-20 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
              onClick={() => fileInputRef.current?.click()}
            >
              <Image className="h-4 w-4 mr-2" />
              Photo/Video
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start"
            >
              <Camera className="h-4 w-4 mr-2" />
              Camera
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

interface MessagesContainerProps {
  className?: string;
}

export function MessagesContainer({ className = "" }: MessagesContainerProps) {
  const [selectedConversation, setSelectedConversation] = useState<(Conversation & { otherUser: User }) | null>(null);
  const [showNewMessage, setShowNewMessage] = useState(false);

  const handleSelectConversation = (conversation: Conversation & { otherUser: User }) => {
    setSelectedConversation(conversation);
  };

  const handleBack = () => {
    setSelectedConversation(null);
  };

  return (
    <div className={`h-screen flex ${className}`}>
      {/* Conversation List */}
      <div className={`w-full lg:w-1/3 border-r border-gray-200 ${selectedConversation ? 'hidden lg:block' : ''}`}>
        <ConversationList
          selectedConversationId={selectedConversation?.id}
          onSelectConversation={handleSelectConversation}
          onNewMessage={() => setShowNewMessage(true)}
        />
      </div>

      {/* Chat Window */}
      <div className={`flex-1 ${!selectedConversation ? 'hidden lg:flex' : 'flex'} flex-col`}>
        {selectedConversation ? (
          <ChatWindow
            conversation={selectedConversation}
            onBack={handleBack}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Your Messages</h3>
              <p className="text-gray-500 mb-4">Send private messages to cricket fans and players</p>
              <Button
                onClick={() => setShowNewMessage(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                Send Message
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* New Message Dialog */}
      <Dialog open={showNewMessage} onOpenChange={setShowNewMessage}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input placeholder="Search people..." />
            <div className="text-center py-8 text-gray-500">
              <p>Search for users to start a conversation</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}