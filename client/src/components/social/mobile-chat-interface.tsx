import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Send, 
  Image, 
  Smile, 
  Mic, 
  Camera,
  ArrowLeft,
  MoreVertical,
  Phone,
  Video
} from "lucide-react";

interface Message {
  id: number;
  content: string;
  senderId: number;
  createdAt: Date;
  read: boolean;
  messageType: "text" | "image" | "voice";
  mediaUrl?: string;
}

interface ChatUser {
  id: number;
  username: string;
  profileImage: string | null;
  isOnline?: boolean;
  lastSeen?: Date;
}

interface MobileChatInterfaceProps {
  user: ChatUser;
  messages: Message[];
  currentUserId: number;
  onSendMessage: (content: string, type: "text" | "image" | "voice") => void;
  onBack: () => void;
  isTyping?: boolean;
}

export function MobileChatInterface({
  user,
  messages,
  currentUserId,
  onSendMessage,
  onBack,
  isTyping = false
}: MobileChatInterfaceProps) {
  const [inputValue, setInputValue] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim(), "text");
      setInputValue("");
      inputRef.current?.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: "2-digit", 
      minute: "2-digit" 
    });
  };

  const formatLastSeen = (date?: Date) => {
    if (!date) return "";
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b bg-card sticky top-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="touch-manipulation"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <Avatar className="h-10 w-10">
          <AvatarImage src={user.profileImage || undefined} />
          <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate">{user.username}</h3>
          <p className="text-xs text-muted-foreground">
            {user.isOnline ? (
              <span className="text-green-500">Online</span>
            ) : (
              formatLastSeen(user.lastSeen)
            )}
          </p>
        </div>
        
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="touch-manipulation">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="touch-manipulation">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="touch-manipulation">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message, index) => {
          const isOwn = message.senderId === currentUserId;
          const showAvatar = !isOwn && (
            index === 0 || 
            messages[index - 1].senderId !== message.senderId
          );

          return (
            <div
              key={message.id}
              className={`flex ${isOwn ? "justify-end" : "justify-start"} gap-2`}
            >
              {!isOwn && showAvatar && (
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={user.profileImage || undefined} />
                  <AvatarFallback>{user.username[0]}</AvatarFallback>
                </Avatar>
              )}
              {!isOwn && !showAvatar && <div className="w-8" />}
              
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  isOwn
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : "bg-muted rounded-bl-sm"
                }`}
              >
                {message.messageType === "image" && message.mediaUrl && (
                  <img
                    src={message.mediaUrl}
                    alt="Shared image"
                    className="rounded-lg max-w-full mb-1"
                  />
                )}
                <p className="text-sm break-words">{message.content}</p>
                <div className={`flex items-center gap-1 mt-1 ${
                  isOwn ? "justify-end" : "justify-start"
                }`}>
                  <span className="text-[10px] opacity-70">
                    {formatTime(message.createdAt)}
                  </span>
                  {isOwn && (
                    <span className="text-[10px] opacity-70">
                      {message.read ? "✓✓" : "✓"}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.profileImage || undefined} />
              <AvatarFallback>{user.username[0]}</AvatarFallback>
            </Avatar>
            <div className="bg-muted rounded-2xl px-4 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t bg-card p-3 safe-area-inset-bottom">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="touch-manipulation flex-shrink-0"
          >
            <Camera className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Message..."
              className="pr-20 rounded-full"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 touch-manipulation"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              >
                <Smile className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 touch-manipulation"
              >
                <Image className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {inputValue.trim() ? (
            <Button
              size="icon"
              onClick={handleSend}
              className="touch-manipulation flex-shrink-0 rounded-full"
            >
              <Send className="h-5 w-5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="touch-manipulation flex-shrink-0"
            >
              <Mic className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
