import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Video, 
  Mic, 
  MicOff, 
  Camera, 
  CameraOff, 
  Settings, 
  Share, 
  Users, 
  MessageSquare, 
  ThumbsUp, 
  Heart, 
  Send, 
  MoreVertical, 
  X, 
  Play, 
  Pause, 
  Volume, 
  Volume2,
  Volume1,
  VolumeX,
  Maximize,
  Loader2,
  PhoneCall,
  PhoneIncoming,
  PhoneMissed,
  Clock,
  MonitorPlay,
  Upload,
  Wifi,
  WifiOff,
  FullscreenIcon
} from "lucide-react";

interface LiveStreamProps {
  match?: {
    id: number;
    title: string;
    team1: string;
    team2: string;
    team1Logo?: string;
    team2Logo?: string;
    venue: string;
    format: string;
    startTime: Date;
    status: 'upcoming' | 'live' | 'completed';
  };
  isHost?: boolean;
  onClose?: () => void;
}

export function LiveMatchStreaming({ match, isHost = false, onClose }: LiveStreamProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLive, setIsLive] = useState(false);
  const [streamingTab, setStreamingTab] = useState<'video' | 'chat' | 'scorecard'>(isHost ? 'video' : 'chat');
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [streamQuality, setStreamQuality] = useState<'auto' | '720p' | '1080p'>('auto');
  const [isLoading, setIsLoading] = useState(true);
  const [networkQuality, setNetworkQuality] = useState<'excellent' | 'good' | 'poor'>('good');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Simulate loading and network conditions
  useEffect(() => {
    // Simulate loading time
    const loadingTimeout = setTimeout(() => {
      setIsLoading(false);
      
      // Simulate viewers joining
      const viewerInterval = setInterval(() => {
        setViewerCount(prev => {
          const change = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
          return Math.max(0, prev + change);
        });
      }, 5000);
      
      // Simulate network quality changes
      const networkInterval = setInterval(() => {
        const rand = Math.random();
        if (rand > 0.9) {
          setNetworkQuality('poor');
        } else if (rand > 0.6) {
          setNetworkQuality('good');
        } else {
          setNetworkQuality('excellent');
        }
      }, 15000);
      
      // Simulate chat messages
      if (!isHost) {
        const chatInterval = setInterval(() => {
          if (Math.random() > 0.6) {
            const messageTypes = [
              "Great shot!",
              "What a delivery!",
              "Come on team!",
              "How's that not a wide?",
              "That's definitely out!",
              "Superb fielding!",
              "When's the next drinks break?",
              "Who's going to bowl next?",
              "This is such a close match!",
              "The pitch looks challenging today."
            ];
            
            const userNames = [
              "cricket_fan_1",
              "bowlingExpert",
              "batting_guru",
              "team_india_supporter",
              "aussie_rules",
              "cricketing_legend",
              "sports_analyst",
              "game_lover",
              "cricket_commentator"
            ];
            
            addChatMessage({
              id: Date.now().toString(),
              user: {
                id: Math.floor(Math.random() * 1000),
                username: userNames[Math.floor(Math.random() * userNames.length)],
                profileImage: Math.random() > 0.5 ? "https://github.com/shadcn.png" : undefined
              },
              message: messageTypes[Math.floor(Math.random() * messageTypes.length)],
              timestamp: new Date()
            });
          }
        }, 3000);
        
        return () => {
          clearInterval(chatInterval);
          clearInterval(viewerInterval);
          clearInterval(networkInterval);
        };
      }
      
      return () => {
        clearInterval(viewerInterval);
        clearInterval(networkInterval);
      };
    }, 2000);
    
    return () => clearTimeout(loadingTimeout);
  }, [isHost]);
  
  useEffect(() => {
    // Auto-scroll chat to bottom when new messages come in
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages]);
  
  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      localStreamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setIsLive(true);
      setViewerCount(1); // Start with 1 viewer (self)
      
      toast({
        title: "Live stream started",
        description: "Your match stream is now live!",
      });
      
      // Simulate viewers joining
      setTimeout(() => {
        setViewerCount(5);
        toast({
          title: "Viewers joining",
          description: "5 viewers have joined your stream",
        });
      }, 5000);
      
    } catch (error) {
      console.error("Error accessing media devices:", error);
      toast({
        title: "Failed to start stream",
        description: "Could not access camera or microphone. Please check your permissions.",
        variant: "destructive",
      });
    }
  };
  
  const stopStream = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsLive(false);
    
    toast({
      title: "Live stream ended",
      description: "Your match stream has ended",
    });
  };
  
  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !micEnabled;
        setMicEnabled(!micEnabled);
      }
    }
  };
  
  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !cameraEnabled;
        setCameraEnabled(!cameraEnabled);
      }
    }
  };
  
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };
  
  const addChatMessage = (message: any) => {
    setChatMessages(prev => [...prev, message]);
  };
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    addChatMessage({
      id: Date.now().toString(),
      user: {
        id: user?.id || 0,
        username: user?.username || "anonymous",
        profileImage: user?.profileImage
      },
      message: newMessage.trim(),
      timestamp: new Date()
    });
    
    setNewMessage("");
  };
  
  const changeStreamQuality = (quality: 'auto' | '720p' | '1080p') => {
    setStreamQuality(quality);
    toast({
      title: "Quality changed",
      description: `Stream quality set to ${quality}`,
    });
  };
  
  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    if (videoRef.current) {
      videoRef.current.volume = value[0] / 100;
    }
    
    if (value[0] === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };
  
  const getStreamStatusIndicator = () => {
    if (isLoading) {
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/50">
          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
          Connecting...
        </Badge>
      );
    }
    
    if (isLive) {
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/50 animate-pulse">
          LIVE
        </Badge>
      );
    }
    
    if (networkQuality === 'poor') {
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/50">
          <WifiOff className="w-3 h-3 mr-1" />
          Poor Connection
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className={`${
        networkQuality === 'excellent' 
          ? 'bg-green-500/10 text-green-500 border-green-500/50' 
          : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50'
      }`}>
        <Wifi className="w-3 h-3 mr-1" />
        {networkQuality === 'excellent' ? 'Excellent' : 'Good'} Connection
      </Badge>
    );
  };

  return (
    <div className="flex flex-col h-full max-h-[90vh] overflow-hidden bg-background">
      <div className="flex justify-between items-center p-4 border-b">
        <div className="flex items-center space-x-2">
          {match ? (
            <>
              <div className="font-medium">{match.title}</div>
              <Badge variant="outline">{match.format}</Badge>
            </>
          ) : (
            <div className="font-medium">Cricket Match Live Stream</div>
          )}
          {getStreamStatusIndicator()}
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="flex items-center">
            <Users className="w-3 h-3 mr-1" />
            {viewerCount} {viewerCount === 1 ? 'viewer' : 'viewers'}
          </Badge>
          
          {isHost && (
            <Button 
              variant={isLive ? "destructive" : "default"} 
              size="sm"
              onClick={isLive ? stopStream : startStream}
            >
              {isLive ? "End Stream" : "Go Live"}
            </Button>
          )}
          
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        <div className={`${streamingTab === 'video' || streamingTab === 'scorecard' ? 'w-full md:w-2/3' : 'hidden md:block md:w-2/3'} relative bg-black`}>
          {isLoading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <div className="text-sm">Connecting to stream...</div>
            </div>
          ) : (
            <>
              <video 
                ref={videoRef}
                className="w-full h-full object-contain"
                autoPlay
                playsInline
                poster="/assets/match-stream-poster.jpg"
                onMouseEnter={() => setShowControls(true)}
                onMouseLeave={() => setShowControls(false)}
              >
                <source src="/assets/sample-match.mp4" type="video/mp4" />
                Your browser does not support HTML video.
              </video>
              
              {/* Team scores overlay */}
              <div className="absolute top-2 left-2 right-2 flex justify-between items-center bg-black/50 backdrop-blur-sm text-white p-2 rounded">
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={match?.team1Logo} />
                    <AvatarFallback>{match?.team1?.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium">{match?.team1 || 'Team 1'}</div>
                    <div className="text-xs">136/4 (18.2)</div>
                  </div>
                </div>
                
                <div className="text-xs font-medium mx-2">vs</div>
                
                <div className="flex items-center">
                  <div className="text-right mr-2">
                    <div className="text-sm font-medium">{match?.team2 || 'Team 2'}</div>
                    <div className="text-xs">142/6 (20.0)</div>
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={match?.team2Logo} />
                    <AvatarFallback>{match?.team2?.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                </div>
              </div>
              
              {/* Video controls */}
              {showControls && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-4 pt-10">
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-white text-sm">Live Match</div>
                    <div className="text-white text-sm">
                      <Clock className="h-3 w-3 inline-block mr-1" />
                      01:45:32
                    </div>
                  </div>
                  
                  <Progress value={65} className="h-1 mb-2" />
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="icon" className="text-white h-8 w-8" onClick={toggleMute}>
                        {isMuted ? <VolumeX className="h-4 w-4" /> : 
                         volume < 30 ? <Volume className="h-4 w-4" /> :
                         volume < 70 ? <Volume1 className="h-4 w-4" /> :
                         <Volume2 className="h-4 w-4" />}
                      </Button>
                      
                      <div className="w-24">
                        <Slider
                          value={[volume]}
                          min={0}
                          max={100}
                          step={1}
                          onValueChange={handleVolumeChange}
                          className="h-2"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Popover open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-white h-8 w-8">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-56 p-2" align="end">
                          <div className="space-y-3">
                            <div className="font-medium text-sm">Stream Quality</div>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="quality-auto" 
                                  checked={streamQuality === 'auto'} 
                                  onCheckedChange={() => changeStreamQuality('auto')}
                                />
                                <Label htmlFor="quality-auto">Auto</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="quality-720" 
                                  checked={streamQuality === '720p'} 
                                  onCheckedChange={() => changeStreamQuality('720p')}
                                />
                                <Label htmlFor="quality-720">720p</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox 
                                  id="quality-1080" 
                                  checked={streamQuality === '1080p'} 
                                  onCheckedChange={() => changeStreamQuality('1080p')}
                                />
                                <Label htmlFor="quality-1080">1080p</Label>
                              </div>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>
                      
                      <Button variant="ghost" size="icon" className="text-white h-8 w-8" onClick={toggleFullscreen}>
                        <Maximize className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Video control overlay for mobile */}
              <div className="absolute inset-0 md:hidden" onClick={() => setShowControls(!showControls)}></div>
            </>
          )}
          
          {/* Host controls overlay */}
          {isHost && isLive && (
            <div className="absolute bottom-16 right-4 flex flex-col space-y-2">
              <Button 
                variant={micEnabled ? "outline" : "secondary"} 
                size="icon" 
                className="rounded-full h-10 w-10 bg-black/50 backdrop-blur-sm border-white/20"
                onClick={toggleMic}
              >
                {micEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
              </Button>
              
              <Button 
                variant={cameraEnabled ? "outline" : "secondary"} 
                size="icon" 
                className="rounded-full h-10 w-10 bg-black/50 backdrop-blur-sm border-white/20"
                onClick={toggleCamera}
              >
                {cameraEnabled ? <Camera className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
              </Button>
              
              <Button 
                variant="outline" 
                size="icon" 
                className="rounded-full h-10 w-10 bg-black/50 backdrop-blur-sm border-white/20"
                onClick={() => setIsSettingsOpen(true)}
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
        
        <div className={`${streamingTab === 'chat' ? 'w-full md:w-1/3' : 'hidden md:block md:w-1/3'} border-l flex flex-col h-full`}>
          <Tabs defaultValue="chat" className="flex flex-col h-full">
            <TabsList className="grid grid-cols-2 mx-4 my-2">
              <TabsTrigger value="chat">Live Chat</TabsTrigger>
              <TabsTrigger value="info">Match Info</TabsTrigger>
            </TabsList>
            
            <TabsContent value="chat" className="flex-1 flex flex-col px-0 m-0">
              <ScrollArea className="flex-1 p-4" ref={chatScrollRef}>
                <div className="space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No messages yet</p>
                      <p className="text-sm">Be the first to comment on this stream!</p>
                    </div>
                  ) : (
                    chatMessages.map(message => (
                      <div key={message.id} className="flex space-x-2">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={message.user.profileImage} />
                          <AvatarFallback>{message.user.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center">
                            <span className="font-medium text-sm mr-2">{message.user.username}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-sm">{message.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
              
              <div className="p-4 border-t">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <Input 
                    placeholder="Send a message..." 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </TabsContent>
            
            <TabsContent value="info" className="flex-1 p-4 m-0">
              {match ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Match Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Match:</span>
                        <span>{match.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Format:</span>
                        <span>{match.format}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Venue:</span>
                        <span>{match.venue}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={match.status === 'live' ? "default" : "outline"}>
                          {match.status === 'upcoming' ? 'Upcoming' : match.status === 'live' ? 'Live' : 'Completed'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-medium mb-2">Teams</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarImage src={match.team1Logo} />
                          <AvatarFallback>{match.team1.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span>{match.team1}</span>
                      </div>
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarImage src={match.team2Logo} />
                          <AvatarFallback>{match.team2.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span>{match.team2}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h3 className="font-medium mb-2">Live Stream Info</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Quality:</span>
                        <span>{streamQuality}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Viewers:</span>
                        <span>{viewerCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Started:</span>
                        <span>10:30 AM</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Network:</span>
                        <span className={`${
                          networkQuality === 'excellent' 
                            ? 'text-green-500' 
                            : networkQuality === 'good'
                              ? 'text-yellow-500'
                              : 'text-red-500'
                        }`}>
                          {networkQuality.charAt(0).toUpperCase() + networkQuality.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <Button variant="outline" className="w-full" onClick={() => {}}>
                      <Share className="h-4 w-4 mr-2" />
                      Share Stream
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No match information available</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <div className="md:hidden flex justify-center border-t">
        <TabsList className="grid grid-cols-3 w-full rounded-none">
          <TabsTrigger 
            value="video" 
            className={streamingTab === 'video' ? 'data-[state=active]:bg-primary' : ''} 
            onClick={() => setStreamingTab('video')}
          >
            <Video className="h-4 w-4 mr-2" />
            Video
          </TabsTrigger>
          <TabsTrigger 
            value="chat" 
            className={streamingTab === 'chat' ? 'data-[state=active]:bg-primary' : ''} 
            onClick={() => setStreamingTab('chat')}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Chat
          </TabsTrigger>
          <TabsTrigger 
            value="scorecard" 
            className={streamingTab === 'scorecard' ? 'data-[state=active]:bg-primary' : ''} 
            onClick={() => setStreamingTab('scorecard')}
          >
            <Trophy className="h-4 w-4 mr-2" />
            Score
          </TabsTrigger>
        </TabsList>
      </div>
    </div>
  );
}

export function LiveStreamingDialog({ match, isHost }: LiveStreamProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2">
          <Video className="h-4 w-4" />
          <span>{isHost ? 'Stream Match' : 'Watch Live'}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl p-0 h-[90vh]">
        <LiveMatchStreaming 
          match={match} 
          isHost={isHost} 
          onClose={() => setIsOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}