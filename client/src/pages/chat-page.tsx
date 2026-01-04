import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useChatStream } from "@/hooks/use-chat-stream";
import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Send, 
  Search, 
  MoreVertical, 
  Phone, 
  Video, 
  Image as ImageIcon,
  Smile,
  Mic,
  ArrowLeft,
  CheckCheck,
  Edit2,
  Trash2,
  Reply,
  Pin,
  Archive,
  BellOff,
  Plus,
  Users
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Conversation {
  id: number;
  type: "dm" | "group";
  name?: string;
  avatarUrl?: string;
  lastMessageAt: string;
  lastMessagePreview?: string;
  members: Array<{
    userId: number;
    role: string;
    isMuted: boolean;
    isPinned: boolean;
    isArchived: boolean;
    user: {
      id: number;
      username: string;
      fullName?: string;
      profileImage?: string;
    };
  }>;
  unreadCount: number;
}

interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  type: string;
  content?: string;
  mediaUrl?: string;
  replyToId?: number;
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  sender: {
    id: number;
    username: string;
    fullName?: string;
    profileImage?: string;
  };
  reactions?: Array<{
    userId: number;
    emoji: string;
  }>;
}

export default function ChatPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // SSE connection for real-time updates
  useChatStream({
    onMessage: (data) => {
      if (data.conversationId === selectedConversation?.id) {
        queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations", selectedConversation?.id, "messages"] });
        // Mark as seen
        if (data.message?.id) {
          markAsSeen(data.message.id);
        }
      }
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
    },
  });

  // Fetch conversations
  const { data: conversations = [], isLoading: loadingConversations } = useQuery<Conversation[]>({
    queryKey: ["/api/chat/conversations"],
    queryFn: getQueryFn(),
    enabled: !!user,
  });

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: loadingMessages } = useQuery<Message[]>({
    queryKey: ["/api/chat/conversations", selectedConversation?.id, "messages"],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const res = await fetch(`/api/chat/conversations/${selectedConversation.id}/messages`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!selectedConversation,
  });

  // Fetch users for new chat
  const { data: searchUsers = [] } = useQuery({
    queryKey: ["/api/users/search", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: searchQuery.length >= 2,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { content: string; replyToId?: number }) => {
      return apiRequest("POST", `/api/chat/conversations/${selectedConversation!.id}/messages`, data);
    },
    onSuccess: () => {
      setMessageText("");
      setReplyingTo(null);
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations", selectedConversation?.id, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
    },
  });

  // Edit message mutation
  const editMessageMutation = useMutation({
    mutationFn: async ({ messageId, content }: { messageId: number; content: string }) => {
      return apiRequest("PATCH", `/api/chat/messages/${messageId}`, { content });
    },
    onSuccess: () => {
      setEditingMessage(null);
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations", selectedConversation?.id, "messages"] });
    },
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async ({ messageId, forEveryone }: { messageId: number; forEveryone: boolean }) => {
      return apiRequest("DELETE", `/api/chat/messages/${messageId}?forEveryone=${forEveryone}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations", selectedConversation?.id, "messages"] });
    },
  });

  // Create DM mutation
  const createDMMutation = useMutation({
    mutationFn: async (recipientId: number) => {
      return apiRequest("POST", "/api/chat/conversations/dm", { recipientId });
    },
    onSuccess: (data) => {
      setShowNewChat(false);
      setSearchQuery("");
      queryClient.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
      setSelectedConversation(data);
    },
  });

  // Send typing indicator
  const sendTyping = useCallback(async (isTyping: boolean) => {
    if (!selectedConversation) return;
    try {
      await fetch(`/api/chat/conversations/${selectedConversation.id}/typing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isTyping }),
        credentials: "include",
      });
    } catch (e) {
      // Ignore typing errors
    }
  }, [selectedConversation]);

  // Mark as seen
  const markAsSeen = useCallback(async (messageId: number) => {
    if (!selectedConversation) return;
    try {
      await fetch(`/api/chat/conversations/${selectedConversation.id}/seen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId }),
        credentials: "include",
      });
    } catch (e) {
      // Ignore seen errors
    }
  }, [selectedConversation]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as seen when conversation opens
  useEffect(() => {
    if (selectedConversation && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.senderId !== user?.id) {
        markAsSeen(lastMessage.id);
      }
    }
  }, [selectedConversation, messages, user, markAsSeen]);

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversation) return;

    if (editingMessage) {
      editMessageMutation.mutate({ messageId: editingMessage.id, content: messageText.trim() });
    } else {
      sendMessageMutation.mutate({ 
        content: messageText.trim(),
        replyToId: replyingTo?.id,
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getOtherUser = (conv: Conversation) => {
    if (conv.type === "group") return null;
    return conv.members.find(m => m.userId !== user?.id)?.user;
  };

  const getConversationName = (conv: Conversation) => {
    if (conv.type === "group") return conv.name || "Group";
    const other = getOtherUser(conv);
    return other?.fullName || other?.username || "Unknown";
  };

  const getConversationAvatar = (conv: Conversation) => {
    if (conv.type === "group") return conv.avatarUrl;
    return getOtherUser(conv)?.profileImage;
  };

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    const member = conv.members.find(m => m.userId === user?.id);
    return member && !member.isArchived;
  });

  const pinnedConversations = filteredConversations.filter(conv => {
    const member = conv.members.find(m => m.userId === user?.id);
    return member?.isPinned;
  });

  const regularConversations = filteredConversations.filter(conv => {
    const member = conv.members.find(m => m.userId === user?.id);
    return !member?.isPinned;
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Please log in to access messages</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header />
      
      <div className="flex flex-1 pt-16 pb-16 md:pb-0 overflow-hidden">
        {/* Conversation List */}
        <div className={cn(
          "w-full md:w-80 lg:w-96 border-r flex flex-col bg-background",
          selectedConversation && "hidden md:flex"
        )}>
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <h1 className="text-xl font-bold">{user.username}</h1>
            <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Plus className="h-5 w-5" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Message</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <ScrollArea className="h-64">
                    {searchUsers.map((u: any) => (
                      <div
                        key={u.id}
                        className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg cursor-pointer"
                        onClick={() => createDMMutation.mutate(u.id)}
                      >
                        <Avatar>
                          <AvatarImage src={u.profileImage} />
                          <AvatarFallback>{u.username[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{u.fullName || u.username}</p>
                          <p className="text-sm text-muted-foreground">@{u.username}</p>
                        </div>
                      </div>
                    ))}
                  </ScrollArea>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search */}
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search" className="pl-9 bg-muted" />
            </div>
          </div>

          {/* Conversations */}
          <ScrollArea className="flex-1">
            {pinnedConversations.length > 0 && (
              <div className="px-3 py-2">
                <p className="text-xs font-semibold text-muted-foreground mb-2">PINNED</p>
                {pinnedConversations.map(conv => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isSelected={selectedConversation?.id === conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    currentUserId={user.id}
                  />
                ))}
              </div>
            )}
            
            <div className="px-3 py-2">
              {pinnedConversations.length > 0 && (
                <p className="text-xs font-semibold text-muted-foreground mb-2">MESSAGES</p>
              )}
              {regularConversations.map(conv => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isSelected={selectedConversation?.id === conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  currentUserId={user.id}
                />
              ))}
            </div>

            {filteredConversations.length === 0 && !loadingConversations && (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Send className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">Your Messages</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Send private messages to a friend or group
                </p>
                <Button onClick={() => setShowNewChat(true)}>
                  Send Message
                </Button>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Window */}
        {selectedConversation ? (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="h-16 border-b flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setSelectedConversation(null)}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <Avatar>
                  <AvatarImage src={getConversationAvatar(selectedConversation) || ""} />
                  <AvatarFallback>
                    {getConversationName(selectedConversation)[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{getConversationName(selectedConversation)}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedConversation.type === "group" 
                      ? `${selectedConversation.members.length} members`
                      : "Active now"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon">
                  <Phone className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Video className="h-5 w-5" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <BellOff className="h-4 w-4 mr-2" />
                      Mute
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Pin className="h-4 w-4 mr-2" />
                      Pin
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Chat
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.senderId === user.id}
                    showAvatar={
                      selectedConversation.type === "group" &&
                      message.senderId !== user.id &&
                      (index === 0 || messages[index - 1].senderId !== message.senderId)
                    }
                    onEdit={() => {
                      setEditingMessage(message);
                      setMessageText(message.content || "");
                      inputRef.current?.focus();
                    }}
                    onDelete={(forEveryone) => {
                      deleteMessageMutation.mutate({ messageId: message.id, forEveryone });
                    }}
                    onReply={() => {
                      setReplyingTo(message);
                      inputRef.current?.focus();
                    }}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Reply Preview */}
            {replyingTo && (
              <div className="px-4 py-2 bg-muted/50 border-t flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Reply className="h-4 w-4 text-muted-foreground" />
                  <div className="text-sm">
                    <span className="font-medium">Replying to {replyingTo.sender.username}</span>
                    <p className="text-muted-foreground truncate max-w-xs">
                      {replyingTo.content}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>
                  ✕
                </Button>
              </div>
            )}

            {/* Edit Preview */}
            {editingMessage && (
              <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950 border-t flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Edit2 className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium text-blue-500">Editing message</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => {
                  setEditingMessage(null);
                  setMessageText("");
                }}>
                  Cancel
                </Button>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <ImageIcon className="h-5 w-5" />
                </Button>
                <div className="flex-1 relative">
                  <Input
                    ref={inputRef}
                    placeholder="Message..."
                    value={messageText}
                    onChange={(e) => {
                      setMessageText(e.target.value);
                      sendTyping(true);
                    }}
                    onBlur={() => sendTyping(false)}
                    onKeyDown={handleKeyDown}
                    className="pr-20"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Smile className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Mic className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
                <Button 
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sendMessageMutation.isPending}
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full border-2 border-foreground flex items-center justify-center mx-auto mb-4">
                <Send className="h-12 w-12" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Your Messages</h2>
              <p className="text-muted-foreground mb-4">
                Send private photos and messages to a friend or group
              </p>
              <Button onClick={() => setShowNewChat(true)}>
                Send Message
              </Button>
            </div>
          </div>
        )}
      </div>

      <MobileNav />
    </div>
  );
}

// Conversation Item Component
function ConversationItem({ 
  conversation, 
  isSelected, 
  onClick,
  currentUserId 
}: { 
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
  currentUserId: number;
}) {
  const otherUser = conversation.type === "dm" 
    ? conversation.members.find(m => m.userId !== currentUserId)?.user
    : null;

  const name = conversation.type === "group" 
    ? conversation.name 
    : otherUser?.fullName || otherUser?.username;

  const avatar = conversation.type === "group"
    ? conversation.avatarUrl
    : otherUser?.profileImage;

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors",
        isSelected ? "bg-muted" : "hover:bg-muted/50"
      )}
      onClick={onClick}
    >
      <Avatar className="h-14 w-14">
        <AvatarImage src={avatar || ""} />
        <AvatarFallback className="text-lg">
          {conversation.type === "group" ? <Users className="h-6 w-6" /> : name?.[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className={cn("font-semibold truncate", conversation.unreadCount > 0 && "font-bold")}>
            {name || "Unknown"}
          </p>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(conversation.lastMessageAt), { addSuffix: false })}
          </span>
        </div>
        <p className={cn(
          "text-sm truncate",
          conversation.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
        )}>
          {conversation.lastMessagePreview || "No messages yet"}
        </p>
      </div>
      {conversation.unreadCount > 0 && (
        <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
          {conversation.unreadCount}
        </div>
      )}
    </div>
  );
}

// Message Bubble Component
function MessageBubble({
  message,
  isOwn,
  showAvatar,
  onEdit,
  onDelete,
  onReply,
}: {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
  onEdit: () => void;
  onDelete: (forEveryone: boolean) => void;
  onReply: () => void;
}) {
  if (message.isDeleted) {
    return (
      <div className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
        <div className="px-4 py-2 rounded-2xl bg-muted text-muted-foreground italic text-sm">
          This message was deleted
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-2 group", isOwn ? "justify-end" : "justify-start")}>
      {!isOwn && showAvatar && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={message.sender.profileImage || ""} />
          <AvatarFallback>{message.sender.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>
      )}
      {!isOwn && !showAvatar && <div className="w-8" />}
      
      <div className={cn("max-w-[70%] relative", isOwn && "order-first")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div
              className={cn(
                "px-4 py-2 rounded-2xl cursor-pointer",
                isOwn 
                  ? "bg-primary text-primary-foreground rounded-br-md" 
                  : "bg-muted rounded-bl-md"
              )}
            >
              {message.content}
              <div className={cn(
                "flex items-center gap-1 mt-1 text-xs",
                isOwn ? "text-primary-foreground/70 justify-end" : "text-muted-foreground"
              )}>
                <span>
                  {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {message.isEdited && <span>· edited</span>}
                {isOwn && (
                  <CheckCheck className="h-3 w-3 ml-1" />
                )}
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isOwn ? "end" : "start"}>
            <DropdownMenuItem onClick={onReply}>
              <Reply className="h-4 w-4 mr-2" />
              Reply
            </DropdownMenuItem>
            {isOwn && (
              <DropdownMenuItem onClick={onEdit}>
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onDelete(false)}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete for me
            </DropdownMenuItem>
            {isOwn && (
              <DropdownMenuItem onClick={() => onDelete(true)} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Unsend
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Reactions */}
        {message.reactions && message.reactions.length > 0 && (
          <div className={cn(
            "absolute -bottom-3 flex gap-0.5 bg-background rounded-full px-1 py-0.5 shadow-sm border",
            isOwn ? "right-2" : "left-2"
          )}>
            {message.reactions.slice(0, 3).map((r, i) => (
              <span key={i} className="text-xs">{r.emoji}</span>
            ))}
            {message.reactions.length > 3 && (
              <span className="text-xs text-muted-foreground">+{message.reactions.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
