import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Users, Settings, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface VideoCallParticipant {
  id: number;
  username: string;
  fullName: string;
  profileImage: string;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isSpeaking: boolean;
}

interface VideoCallRoom {
  id: string;
  type: 'one-on-one' | 'group';
  participants: VideoCallParticipant[];
  duration: number;
  createdAt: string;
}

interface VideoChatProps {
  conversationId?: number;
  groupId?: number;
  participants: VideoCallParticipant[];
  onEndCall: () => void;
  className?: string;
}

export function VideoChat({ conversationId, groupId, participants, onEndCall, className = "" }: VideoChatProps) {
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [isCallActive, setIsCallActive] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isCallActive) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCallActive]);

  const startCallMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/video-calls/start", {
        conversationId,
        groupId,
        participantIds: participants.map(p => p.id)
      });
    },
    onSuccess: () => {
      setIsCallActive(true);
      initializeCamera();
    }
  });

  const endCallMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/video-calls/end", {
        conversationId,
        groupId
      });
    },
    onSuccess: () => {
      setIsCallActive(false);
      stopCamera();
      onEndCall();
    }
  });

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideoEnabled,
        audio: isAudioEnabled
      });
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      toast({
        title: "Camera access denied",
        description: "Please allow camera and microphone access to join the video call",
        variant: "destructive"
      });
    }
  };

  const stopCamera = () => {
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isVideoEnabled;
      }
    }
  };

  const toggleAudio = () => {
    setIsAudioEnabled(!isAudioEnabled);
    if (localVideoRef.current?.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isAudioEnabled;
      }
    }
  };

  const formatCallDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartCall = () => {
    startCallMutation.mutate();
  };

  const handleEndCall = () => {
    endCallMutation.mutate();
  };

  return (
    <Dialog open onOpenChange={onEndCall}>
      <DialogContent className="max-w-4xl max-h-[80vh] p-0">
        <div className="bg-black text-white rounded-lg overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-gray-900 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="h-5 w-5" />
              <span className="font-medium">
                {participants.length === 1 ? participants[0].fullName || participants[0].username : `Group Call (${participants.length + 1})`}
              </span>
              {isCallActive && (
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  {formatCallDuration(callDuration)}
                </Badge>
              )}
            </div>
            
            <Button variant="ghost" size="icon" className="text-white">
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {/* Video Area */}
          <div className="relative h-96 bg-gray-800">
            {!isCallActive ? (
              // Pre-call screen
              <div className="h-full flex flex-col items-center justify-center space-y-6">
                <div className="text-center">
                  <div className="flex justify-center mb-4">
                    {participants.slice(0, 3).map((participant, index) => (
                      <Avatar 
                        key={participant.id} 
                        className={`h-16 w-16 border-4 border-white ${index > 0 ? '-ml-4' : ''}`}
                      >
                        <AvatarImage src={participant.profileImage || ""} alt={participant.username} />
                        <AvatarFallback>{participant.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {participants.length === 1 ? 'Video Call' : 'Group Video Call'}
                  </h3>
                  <p className="text-gray-300">
                    {participants.length === 1 
                      ? `Calling ${participants[0].fullName || participants[0].username}...`
                      : `Starting call with ${participants.length} participants`
                    }
                  </p>
                </div>

                <Button
                  onClick={handleStartCall}
                  disabled={startCallMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-full"
                >
                  <Video className="h-5 w-5 mr-2" />
                  {startCallMutation.isPending ? 'Connecting...' : 'Start Call'}
                </Button>
              </div>
            ) : (
              // Active call screen
              <div className="h-full grid grid-cols-2 gap-2 p-2">
                {/* Local video */}
                <div className="relative bg-gray-700 rounded-lg overflow-hidden">
                  {isVideoEnabled ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <Avatar className="h-16 w-16 mx-auto mb-2">
                          <AvatarFallback className="text-2xl">You</AvatarFallback>
                        </Avatar>
                        <p className="text-sm text-gray-300">Camera off</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="absolute bottom-2 left-2">
                    <Badge variant="secondary" className="bg-black/50 text-white">
                      You
                    </Badge>
                  </div>
                  
                  {!isAudioEnabled && (
                    <div className="absolute top-2 right-2">
                      <MicOff className="h-4 w-4 text-red-500" />
                    </div>
                  )}
                </div>

                {/* Remote participants */}
                {participants.map((participant) => (
                  <div key={participant.id} className="relative bg-gray-700 rounded-lg overflow-hidden">
                    {participant.isVideoEnabled ? (
                      <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                        <div className="text-center">
                          <Avatar className="h-16 w-16 mx-auto mb-2">
                            <AvatarImage src={participant.profileImage || ""} alt={participant.username} />
                            <AvatarFallback>
                              {participant.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-sm text-gray-300">Connecting...</p>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <Avatar className="h-16 w-16 mx-auto mb-2">
                            <AvatarImage src={participant.profileImage || ""} alt={participant.username} />
                            <AvatarFallback>
                              {participant.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-sm text-gray-300">Camera off</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="absolute bottom-2 left-2">
                      <Badge 
                        variant="secondary" 
                        className={`bg-black/50 text-white ${participant.isSpeaking ? 'ring-2 ring-green-500' : ''}`}
                      >
                        {participant.fullName || participant.username}
                      </Badge>
                    </div>
                    
                    {!participant.isAudioEnabled && (
                      <div className="absolute top-2 right-2">
                        <MicOff className="h-4 w-4 text-red-500" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-4 bg-gray-900 flex items-center justify-center space-x-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleAudio}
              className={`rounded-full ${!isAudioEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleVideo}
              className={`rounded-full ${!isVideoEnabled ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'}`}
            >
              {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSpeakerEnabled(!isSpeakerEnabled)}
              className="rounded-full bg-gray-700 hover:bg-gray-600"
            >
              {isSpeakerEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>

            <Button
              onClick={handleEndCall}
              disabled={endCallMutation.isPending}
              className="bg-red-600 hover:bg-red-700 text-white rounded-full px-6"
            >
              <PhoneOff className="h-5 w-5 mr-2" />
              End Call
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}