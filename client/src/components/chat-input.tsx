import { useState, useRef, ChangeEvent, KeyboardEvent, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paperclip, Send, Image, X, FileText } from "lucide-react";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ChatInputProps {
  conversationId: number;
  userId: number;
  onSendMessage: (message: {
    conversationId: number; 
    senderId: number; 
    content: string;
    messageType?: string;
    mediaUrl?: string;
  }) => void;
  disabled?: boolean;
}

export function ChatInput({ conversationId, userId, onSendMessage, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setFilePreview(event.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        // For non-image files, just show the filename
        setFilePreview(null);
      }
    }
  };

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = "image/*";
      fileInputRef.current.click();
    }
  };

  const handleFileClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = "*/*";
      fileInputRef.current.click();
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const uploadFile = async (): Promise<string | null> => {
    try {
      if (!selectedFile) return null;
      
      setIsUploading(true);
      // For FormData we need to use fetch directly instead of apiRequest
      const formData = new FormData();
      formData.append("file", selectedFile);
      
      const res = await fetch('/api/upload/message', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!res.ok) {
        throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
      }
      
      const response = await res.json();
      return response.url;
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload file. Please try again.",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    
    if (disabled || (message.trim() === "" && !selectedFile)) return;
    
    try {
      let messageType = "text";
      let mediaUrl = null;
      let content = message;
      
      // If there's a file selected, upload it
      if (selectedFile) {
        mediaUrl = await uploadFile();
        if (!mediaUrl) return; // Upload failed
        
        if (selectedFile.type.startsWith('image/')) {
          messageType = "image";
        } else {
          messageType = "document";
        }
        
        // If no text message, use filename as content
        if (message.trim() === "") {
          content = selectedFile.name;
        }
      }
      
      onSendMessage({
        conversationId,
        senderId: userId,
        content,
        messageType,
        mediaUrl: mediaUrl || undefined
      });
      
      // Reset state
      setMessage("");
      removeSelectedFile();
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Message Failed",
        description: "Failed to send message. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col p-2 bg-card border-t">
      {/* File preview area */}
      {selectedFile && (
        <div className="mb-2 relative bg-muted rounded-md p-2 flex items-center">
          {filePreview ? (
            <div className="relative w-16 h-16 mr-2">
              <img 
                src={filePreview} 
                alt="Preview" 
                className="w-full h-full object-cover rounded-md"
              />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-md bg-background mr-2 flex items-center justify-center">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={removeSelectedFile}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {/* Input area */}
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Paperclip className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2" side="top" align="start">
            <div className="flex flex-col gap-1">
              <Button 
                variant="outline" 
                size="sm" 
                className="justify-start font-normal"
                onClick={handleImageClick}
              >
                <Image className="mr-2 h-4 w-4" />
                Image
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="justify-start font-normal"
                onClick={handleFileClick}
              >
                <FileText className="mr-2 h-4 w-4" />
                Document
              </Button>
            </div>
          </PopoverContent>
        </Popover>
        
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileSelect}
        />
        
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className={cn("flex-1", disabled && "opacity-50")}
          disabled={disabled || isUploading}
        />
        
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-9 w-9",
            (message.trim() === "" && !selectedFile) ? 
              "text-muted-foreground" : 
              "text-primary"
          )}
          disabled={disabled || isUploading || (message.trim() === "" && !selectedFile)}
          onClick={handleSendMessage}
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}