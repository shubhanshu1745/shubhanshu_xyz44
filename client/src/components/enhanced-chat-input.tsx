import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Send, Image, Smile, Mic, MicOff, Camera, X, 
  Paperclip, FileText, Loader2, StopCircle
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

interface EnhancedChatInputProps {
  conversationId: number;
  userId: number;
  onSendMessage: (message: {
    conversationId: number;
    senderId: number;
    content: string;
    messageType?: string;
    mediaUrl?: string;
  }) => void;
  onTyping?: () => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function EnhancedChatInput({
  conversationId,
  userId,
  onSendMessage,
  onTyping,
  disabled = false,
  placeholder = "Type a message...",
  className = ""
}: EnhancedChatInputProps) {
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [cameraStream, audioUrl]);

  // Handle emoji selection
  const handleEmojiSelect = (emoji: any) => {
    setMessage(prev => prev + emoji.native);
    setShowEmojiPicker(false);
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max file size is 10MB", variant: "destructive" });
      return;
    }

    setSelectedFile(file);
    
    if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  // Remove selected file
  const removeFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Start voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (error) {
      toast({ title: "Microphone access denied", description: "Please allow microphone access to record voice messages", variant: "destructive" });
    }
  };

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  // Cancel voice recording
  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
  };

  // Open camera
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: 1280, height: 720 } 
      });
      setCameraStream(stream);
      setShowCamera(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      toast({ title: "Camera access denied", description: "Please allow camera access to take photos", variant: "destructive" });
    }
  };

  // Close camera
  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  // Capture photo
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
            setSelectedFile(file);
            setFilePreview(canvas.toDataURL('image/jpeg'));
            closeCamera();
          }
        }, 'image/jpeg', 0.9);
      }
    }
  };

  // Upload file
  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload/message', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Upload failed');
      
      const data = await response.json();
      return data.url || data.filename;
    } catch (error) {
      toast({ title: "Upload failed", description: "Failed to upload file", variant: "destructive" });
      return null;
    }
  };

  // Send message
  const handleSend = async () => {
    if (disabled) return;

    let mediaUrl: string | undefined;
    let messageType = 'text';

    // Handle audio message
    if (audioBlob) {
      setIsUploading(true);
      const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
      mediaUrl = await uploadFile(audioFile) || undefined;
      messageType = 'audio';
      setAudioBlob(null);
      setAudioUrl(null);
      setIsUploading(false);
      
      if (mediaUrl) {
        onSendMessage({
          conversationId,
          senderId: userId,
          content: '🎤 Voice message',
          messageType,
          mediaUrl,
        });
      }
      return;
    }

    // Handle file upload
    if (selectedFile) {
      setIsUploading(true);
      mediaUrl = await uploadFile(selectedFile) || undefined;
      messageType = selectedFile.type.startsWith('image/') ? 'image' : 
                    selectedFile.type.startsWith('video/') ? 'video' : 'file';
      setIsUploading(false);
      removeFile();
    }

    // Send message
    if (message.trim() || mediaUrl) {
      onSendMessage({
        conversationId,
        senderId: userId,
        content: message.trim() || (mediaUrl ? `📎 ${selectedFile?.name || 'File'}` : ''),
        messageType: mediaUrl ? messageType : 'text',
        mediaUrl,
      });
      setMessage("");
    }
  };

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    onTyping?.();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn("relative", className)}>
      {/* Camera View */}
      {showCamera && (
        <div className="absolute inset-0 z-50 bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
            <Button
              variant="secondary"
              size="icon"
              className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm"
              onClick={closeCamera}
            >
              <X className="h-6 w-6 text-white" />
            </Button>
            <Button
              size="icon"
              className="h-16 w-16 rounded-full bg-white"
              onClick={capturePhoto}
            >
              <div className="h-12 w-12 rounded-full border-4 border-slate-900" />
            </Button>
          </div>
        </div>
      )}

      {/* File Preview */}
      {filePreview && (
        <div className="mb-2 relative inline-block">
          {selectedFile?.type.startsWith('image/') ? (
            <img src={filePreview} alt="Preview" className="h-20 w-20 object-cover rounded-lg" />
          ) : selectedFile?.type.startsWith('video/') ? (
            <video src={filePreview} className="h-20 w-20 object-cover rounded-lg" />
          ) : (
            <div className="h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
              <FileText className="h-8 w-8 text-slate-400" />
            </div>
          )}
          <Button
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={removeFile}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Audio Recording Preview */}
      {audioUrl && !isRecording && (
        <div className="mb-2 flex items-center gap-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <audio src={audioUrl} controls className="h-8 flex-1" />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={cancelRecording}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Recording Indicator */}
      {isRecording && (
        <div className="mb-2 flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
          <div className="h-3 w-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-red-600 dark:text-red-400 font-medium">Recording {formatTime(recordingTime)}</span>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" onClick={cancelRecording}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" onClick={stopRecording}>
            <StopCircle className="h-4 w-4 mr-1" /> Stop
          </Button>
        </div>
      )}

      {/* Main Input Area */}
      <div className="flex items-end gap-2">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,video/*,.pdf,.doc,.docx,.txt"
        />

        {/* Attachment Button */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
              disabled={disabled || isRecording}
            >
              <Paperclip className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" side="top">
            <div className="grid gap-1">
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = "image/*";
                    fileInputRef.current.click();
                  }
                }}
              >
                <Image className="h-4 w-4 mr-2" /> Photo
              </Button>
              <Button
                variant="ghost"
                className="justify-start"
                onClick={openCamera}
              >
                <Camera className="h-4 w-4 mr-2" /> Camera
              </Button>
              <Button
                variant="ghost"
                className="justify-start"
                onClick={() => {
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = "*/*";
                    fileInputRef.current.click();
                  }
                }}
              >
                <FileText className="h-4 w-4 mr-2" /> File
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Message Input */}
        <div className="flex-1 relative">
          <Input
            value={message}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isRecording || isUploading}
            className="pr-10 rounded-full bg-slate-100 dark:bg-slate-800 border-0 focus-visible:ring-1 focus-visible:ring-orange-400"
          />
          
          {/* Emoji Picker */}
          <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full text-slate-400 hover:text-slate-600"
                disabled={disabled || isRecording}
              >
                <Smile className="h-5 w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 border-0" side="top" align="end">
              <Picker
                data={data}
                onEmojiSelect={handleEmojiSelect}
                theme="auto"
                previewPosition="none"
                skinTonePosition="none"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Mic / Send Button */}
        {message.trim() || selectedFile || audioBlob ? (
          <Button
            size="icon"
            className="h-10 w-10 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
            onClick={handleSend}
            disabled={disabled || isUploading}
          >
            {isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        ) : (
          <Button
            variant={isRecording ? "destructive" : "ghost"}
            size="icon"
            className={cn(
              "h-10 w-10 rounded-full",
              isRecording ? "" : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
            )}
            onClick={isRecording ? stopRecording : startRecording}
            disabled={disabled}
          >
            {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
        )}
      </div>
    </div>
  );
}

export default EnhancedChatInput;
