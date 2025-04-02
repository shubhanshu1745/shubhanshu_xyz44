import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  MessageSquare, 
  PlusCircle, 
  Search, 
  Trophy, 
  Settings, 
  Bell, 
  BellOff, 
  Send, 
  MoreVertical, 
  UserPlus, 
  User, 
  LogOut, 
  Edit, 
  Trash2, 
  Lock, 
  Globe, 
  ShieldAlert, 
  ThumbsUp, 
  Heart, 
  Share, 
  EyeOff,
  Info,
  Smile,
  Loader2,
  Terminal
} from "lucide-react";

interface ChatMessage {
  id: string;
  content: string;
  sender: {
    id: number;
    username: string;
    fullName?: string;
    profileImage?: string;
    isAdmin?: boolean;
  };
  timestamp: Date;
  reactions?: {
    type: string;
    count: number;
    userIds: number[];
  }[];
  isDeleted?: boolean;
  isPinned?: boolean;
  mentions?: number[];
  attachments?: {
    type: 'image' | 'video' | 'link';
    url: string;
    thumbnail?: string;
  }[];
}

interface ChatGroup {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  matchId?: number;
  teamId?: number;
  createdBy: number;
  memberCount: number;
  lastActivity: Date;
  isPrivate: boolean;
  isPinned?: boolean;
  unreadCount?: number;
  lastMessage?: {
    content: string;
    sender: string;
    timestamp: Date;
  };
  members?: {
    id: number;
    username: string;
    profileImage?: string;
    isAdmin?: boolean;
    isOnline?: boolean;
  }[];
}

interface MatchDiscussionGroupsProps {
  matchId?: number;
  teamId?: number;
  initialGroupId?: string;
}

export function MatchDiscussionGroups({ matchId, teamId, initialGroupId }: MatchDiscussionGroupsProps) {
  const { user } = useAuth() || {};
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(initialGroupId || null);
  const [messageText, setMessageText] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [isPrivateGroup, setIsPrivateGroup] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  
  // Mock data - in real app this would come from API
  const mockGroups: ChatGroup[] = [
    {
      id: "g1",
      name: "Match Day Discussion",
      description: "Official match thread for live discussion",
      avatarUrl: "/assets/groups/match-day.jpg",
      matchId: 1,
      createdBy: 1,
      memberCount: 156,
      lastActivity: new Date(),
      isPrivate: false,
      unreadCount: 4,
      lastMessage: {
        content: "What a fantastic catch!",
        sender: "cricket_fan",
        timestamp: new Date(Date.now() - 2 * 60 * 1000)
      }
    },
    {
      id: "g2",
      name: "Team India Supporters",
      description: "For fans supporting Team India",
      avatarUrl: "/assets/groups/team-india.jpg",
      teamId: 1,
      createdBy: 2,
      memberCount: 342,
      lastActivity: new Date(Date.now() - 30 * 60 * 1000),
      isPrivate: false,
      unreadCount: 0,
      lastMessage: {
        content: "Hope our top order performs well today!",
        sender: "team_india_fan",
        timestamp: new Date(Date.now() - 35 * 60 * 1000)
      }
    },
    {
      id: "g3",
      name: "Fantasy League Group",
      description: "Discuss your fantasy league picks",
      avatarUrl: "/assets/groups/fantasy.jpg",
      createdBy: 3,
      memberCount: 48,
      lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isPrivate: true,
      isPinned: true,
      unreadCount: 12,
      lastMessage: {
        content: "I'm picking Kohli as captain for today",
        sender: "fantasy_master",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
      }
    },
    {
      id: "g4",
      name: "Statistics & Analysis",
      description: "For in-depth cricket statistics and analysis",
      avatarUrl: "/assets/groups/stats.jpg",
      createdBy: 4,
      memberCount: 78,
      lastActivity: new Date(Date.now() - 5 * 60 * 60 * 1000),
      isPrivate: false,
      unreadCount: 0,
      lastMessage: {
        content: "Here's the batting average comparison...",
        sender: "stats_guru",
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000)
      }
    }
  ];
  
  // Mock messages - in real app this would come from API
  const mockMessages: Record<string, ChatMessage[]> = {
    "g1": [
      {
        id: "m1",
        content: "Welcome to today's match discussion!",
        sender: {
          id: 1,
          username: "admin",
          profileImage: "/assets/profiles/admin.jpg",
          isAdmin: true
        },
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
        isPinned: true
      },
      {
        id: "m2",
        content: "What do you think about the pitch today?",
        sender: {
          id: 2,
          username: "pitch_expert",
          profileImage: "/assets/profiles/user2.jpg"
        },
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        id: "m3",
        content: "Looks dry and might help spinners later in the game.",
        sender: {
          id: 3,
          username: "spin_wizard",
          profileImage: "/assets/profiles/user3.jpg"
        },
        timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000)
      },
      {
        id: "m4",
        content: "The toss will be crucial on this pitch.",
        sender: {
          id: 4,
          username: "toss_predictor",
          profileImage: "/assets/profiles/user4.jpg"
        },
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000)
      },
      {
        id: "m5",
        content: "Team lineup announced! Couple of surprising changes.",
        sender: {
          id: 5,
          username: "team_analyst",
          profileImage: "/assets/profiles/user5.jpg"
        },
        timestamp: new Date(Date.now() - 45 * 60 * 1000),
        attachments: [
          {
            type: 'image',
            url: '/assets/team-lineup.jpg',
            thumbnail: '/assets/team-lineup-thumb.jpg'
          }
        ]
      },
      {
        id: "m6",
        content: "They've dropped their main fast bowler! Interesting decision.",
        sender: {
          id: 2,
          username: "pitch_expert",
          profileImage: "/assets/profiles/user2.jpg"
        },
        timestamp: new Date(Date.now() - 40 * 60 * 1000),
        reactions: [
          {
            type: 'thumbsup',
            count: 5,
            userIds: [1, 3, 4, 5, 7]
          },
          {
            type: 'surprised',
            count: 3,
            userIds: [2, 6, 8]
          }
        ]
      },
      {
        id: "m7",
        content: "Match about to begin! Who's excited?",
        sender: {
          id: 1,
          username: "admin",
          profileImage: "/assets/profiles/admin.jpg",
          isAdmin: true
        },
        timestamp: new Date(Date.now() - 10 * 60 * 1000),
        reactions: [
          {
            type: 'heart',
            count: 12,
            userIds: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
          }
        ]
      },
      {
        id: "m8",
        content: "First ball: FOUR!",
        sender: {
          id: 6,
          username: "cricket_fan",
          profileImage: "/assets/profiles/user6.jpg"
        },
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        reactions: [
          {
            type: 'clap',
            count: 8,
            userIds: [1, 2, 3, 4, 5, 7, 8, 9]
          }
        ]
      },
      {
        id: "m9",
        content: "Great start to the innings!",
        sender: {
          id: 7,
          username: "batting_expert",
          profileImage: "/assets/profiles/user7.jpg"
        },
        timestamp: new Date(Date.now() - 3 * 60 * 1000)
      },
      {
        id: "m10",
        content: "What a fantastic catch!",
        sender: {
          id: 6,
          username: "cricket_fan",
          profileImage: "/assets/profiles/user6.jpg"
        },
        timestamp: new Date(Date.now() - 2 * 60 * 1000)
      }
    ],
    "g2": [
      {
        id: "m1g2",
        content: "Team India supporters, assemble!",
        sender: {
          id: 11,
          username: "team_india_captain",
          profileImage: "/assets/profiles/user11.jpg",
          isAdmin: true
        },
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
        isPinned: true
      },
      {
        id: "m2g2",
        content: "Hope our top order performs well today!",
        sender: {
          id: 12,
          username: "team_india_fan",
          profileImage: "/assets/profiles/user12.jpg"
        },
        timestamp: new Date(Date.now() - 35 * 60 * 1000)
      }
    ]
  };
  
  // Filter groups based on search query
  const filteredGroups = mockGroups.filter(group => 
    group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (group.description && group.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Sort groups with pinned first, then by last activity
  const sortedGroups = [...filteredGroups].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
  });
  
  // Auto-scroll to bottom when messages change or when a new message is sent
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedGroupId, mockMessages[selectedGroupId || ""]]);
  
  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedGroupId) return;
    
    // In a real app, this would send to the server
    // For now, we'll just simulate adding the message
    const newMessage: ChatMessage = {
      id: `m${Date.now()}`,
      content: messageText.trim(),
      sender: {
        id: user?.id || 0,
        username: user?.username || "anonymous",
        profileImage: user?.profileImage
      },
      timestamp: new Date()
    };
    
    // Update the mock data (in a real app, this would happen through server response)
    mockMessages[selectedGroupId] = [...(mockMessages[selectedGroupId] || []), newMessage];
    
    // Clear input
    setMessageText("");
    
    // Scroll to bottom
    setTimeout(() => {
      messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };
  
  const handleCreateGroup = () => {
    if (!groupName.trim()) {
      toast({
        title: "Group name required",
        description: "Please enter a name for your group",
        variant: "destructive"
      });
      return;
    }
    
    // In a real app, this would send to the server
    const newGroup: ChatGroup = {
      id: `g${Date.now()}`,
      name: groupName.trim(),
      description: groupDescription.trim() || undefined,
      createdBy: user?.id || 0,
      memberCount: 1,
      lastActivity: new Date(),
      isPrivate: isPrivateGroup,
      unreadCount: 0
    };
    
    // Update the mock data (in a real app, this would happen through server response)
    mockGroups.push(newGroup);
    
    // Initialize empty messages array for the new group
    mockMessages[newGroup.id] = [];
    
    // Reset form and close dialog
    setGroupName("");
    setGroupDescription("");
    setIsPrivateGroup(false);
    setIsCreatingGroup(false);
    
    // Select the new group
    setSelectedGroupId(newGroup.id);
    
    toast({
      title: "Group created",
      description: `'${newGroup.name}' has been created successfully`
    });
  };
  
  const handleLoadMoreMessages = () => {
    if (!selectedGroupId) return;
    
    setIsLoadingMoreMessages(true);
    
    // Simulate loading more messages
    setTimeout(() => {
      // In a real app, this would fetch older messages from the server
      setIsLoadingMoreMessages(false);
    }, 1000);
  };
  
  const getSelectedGroup = () => {
    return mockGroups.find(group => group.id === selectedGroupId) || null;
  };
  
  const getMessages = () => {
    return mockMessages[selectedGroupId || ""] || [];
  };
  
  const formatMessageTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="flex h-[calc(100vh-14rem)] max-h-[calc(100vh-14rem)] border rounded-md overflow-hidden">
      {/* Groups List */}
      <div className="w-full md:w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg">Discussion Groups</h2>
            <Button variant="ghost" size="icon" onClick={() => setIsCreatingGroup(true)}>
              <PlusCircle className="h-5 w-5" />
            </Button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search groups" 
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-2">
            {sortedGroups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No groups found</p>
                <Button variant="ghost" className="mt-2" onClick={() => setIsCreatingGroup(true)}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create a group
                </Button>
              </div>
            ) : (
              sortedGroups.map(group => (
                <div 
                  key={group.id}
                  className={`p-2 rounded-md cursor-pointer hover:bg-accent transition-colors ${
                    selectedGroupId === group.id ? 'bg-accent' : ''
                  }`}
                  onClick={() => setSelectedGroupId(group.id)}
                >
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={group.avatarUrl} />
                      <AvatarFallback>{group.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div className="font-medium text-sm truncate pr-2">
                          {group.name}
                          {group.isPinned && <span className="ml-1 text-muted-foreground">📌</span>}
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatMessageTime(group.lastActivity)}
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-1">
                        {group.lastMessage ? (
                          <p className="text-xs text-muted-foreground truncate">
                            <span className="font-medium">{group.lastMessage.sender}:</span> {group.lastMessage.content}
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground truncate">No messages yet</p>
                        )}
                        
                        {group.unreadCount > 0 && (
                          <Badge className="ml-2 shrink-0" variant="default">
                            {group.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
      
      {/* Chat Area */}
      <div className="hidden md:flex flex-col flex-1">
        {selectedGroupId ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b flex justify-between items-center">
              <div className="flex items-center">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={getSelectedGroup()?.avatarUrl} />
                  <AvatarFallback>{getSelectedGroup()?.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium flex items-center">
                    {getSelectedGroup()?.name}
                    {getSelectedGroup()?.isPrivate && (
                      <Lock className="ml-2 h-3 w-3 text-muted-foreground" />
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center">
                    <Users className="h-3 w-3 mr-1" />
                    {getSelectedGroup()?.memberCount} members
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-1">
                <Button variant="ghost" size="icon">
                  <Info className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Bell className="h-4 w-4" />
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48" align="end">
                    <div className="space-y-1">
                      <Button variant="ghost" className="w-full justify-start" size="sm">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite Members
                      </Button>
                      <Button variant="ghost" className="w-full justify-start" size="sm">
                        <Bell className="h-4 w-4 mr-2" />
                        Mute Notifications
                      </Button>
                      <Button variant="ghost" className="w-full justify-start" size="sm">
                        <EyeOff className="h-4 w-4 mr-2" />
                        Leave Group
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                <Button 
                  variant="ghost" 
                  className="mx-auto flex items-center"
                  onClick={handleLoadMoreMessages}
                  disabled={isLoadingMoreMessages}
                >
                  {isLoadingMoreMessages ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Terminal className="h-4 w-4 mr-2" />
                  )}
                  Load earlier messages
                </Button>
                
                {getMessages().length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No messages yet</p>
                    <p className="text-xs mt-1">Be the first to start a conversation!</p>
                  </div>
                ) : (
                  getMessages().map((message, index) => {
                    const isFirstMessageOfDay = index === 0 || (
                      new Date(message.timestamp).toDateString() !== 
                      new Date(getMessages()[index - 1].timestamp).toDateString()
                    );
                    
                    const isConsecutiveFromSameUser = index > 0 && 
                      message.sender.id === getMessages()[index - 1].sender.id &&
                      new Date(message.timestamp).getTime() - 
                      new Date(getMessages()[index - 1].timestamp).getTime() < 5 * 60 * 1000;
                    
                    return (
                      <React.Fragment key={message.id}>
                        {isFirstMessageOfDay && (
                          <div className="flex justify-center my-4">
                            <Badge variant="outline" className="bg-background">
                              {new Date(message.timestamp).toLocaleDateString(undefined, { 
                                weekday: 'long', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </Badge>
                          </div>
                        )}
                        
                        <div className={`flex ${isConsecutiveFromSameUser ? 'mt-1' : 'mt-4'}`}>
                          {(!isConsecutiveFromSameUser) ? (
                            <Avatar className="h-8 w-8 mr-2 mt-0.5 flex-shrink-0">
                              <AvatarImage src={message.sender.profileImage} />
                              <AvatarFallback>{message.sender.username.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="w-10" /> // Spacer for alignment
                          )}
                          
                          <div className="flex-1">
                            {(!isConsecutiveFromSameUser) && (
                              <div className="flex items-center mb-1">
                                <div className="font-medium text-sm">
                                  {message.sender.username}
                                  {message.sender.isAdmin && (
                                    <Badge variant="outline" className="ml-2 text-[10px] px-1 py-0">
                                      admin
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground ml-2">
                                  {formatMessageTime(new Date(message.timestamp))}
                                </div>
                              </div>
                            )}
                            
                            <div className="space-y-1">
                              {message.isPinned && (
                                <div className="text-xs font-medium text-muted-foreground flex items-center mb-1">
                                  <span className="mr-1">📌</span> Pinned message
                                </div>
                              )}
                              
                              <div className="bg-muted px-3 py-2 rounded-md text-sm">
                                {message.content}
                              </div>
                              
                              {message.attachments && message.attachments.length > 0 && (
                                <div className="mt-2">
                                  {message.attachments.map((attachment, i) => (
                                    <div key={i} className="rounded-md overflow-hidden mt-1">
                                      {attachment.type === 'image' && (
                                        <img 
                                          src={attachment.url} 
                                          alt="Attachment" 
                                          className="max-w-xs max-h-60 object-cover rounded-md"
                                        />
                                      )}
                                      {attachment.type === 'video' && (
                                        <video 
                                          src={attachment.url} 
                                          controls 
                                          className="max-w-xs max-h-60 object-cover rounded-md"
                                        />
                                      )}
                                      {attachment.type === 'link' && (
                                        <div className="border rounded-md p-2 max-w-xs">
                                          <div className="text-xs text-blue-500">{attachment.url}</div>
                                          {attachment.thumbnail && (
                                            <img 
                                              src={attachment.thumbnail} 
                                              alt="Link preview" 
                                              className="h-20 mt-1 rounded object-cover"
                                            />
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {message.reactions && message.reactions.length > 0 && (
                                <div className="flex mt-1 space-x-1">
                                  {message.reactions.map((reaction, i) => (
                                    <Badge 
                                      key={i} 
                                      variant="outline" 
                                      className="px-2 py-0 h-5 text-xs hover:bg-accent cursor-pointer"
                                    >
                                      {reaction.type === 'thumbsup' && <ThumbsUp className="h-3 w-3 mr-1" />}
                                      {reaction.type === 'heart' && <Heart className="h-3 w-3 mr-1" />}
                                      {reaction.type === 'clap' && '👏'}
                                      {reaction.type === 'surprised' && '😮'}
                                      {reaction.count}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}
                <div ref={messageEndRef} />
              </div>
            </ScrollArea>
            
            {/* Message input */}
            <div className="p-4 border-t">
              <form className="flex space-x-2" onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
                <Input 
                  placeholder="Type a message..." 
                  className="flex-1" 
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                />
                <Button type="submit" disabled={!messageText.trim()}>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <Users className="h-12 w-12 mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">No Group Selected</h3>
            <p className="text-muted-foreground mb-4 max-w-xs">
              Select a group from the sidebar or create a new group to start chatting
            </p>
            <Button onClick={() => setIsCreatingGroup(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Create Group
            </Button>
          </div>
        )}
      </div>
      
      {/* Mobile: No selection view */}
      {!selectedGroupId && (
        <div className="md:hidden flex flex-col items-center justify-center h-full flex-1 text-center p-4">
          <Users className="h-12 w-12 mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">Select a Group</h3>
          <p className="text-muted-foreground mb-4">
            Tap on a group to join the discussion
          </p>
          <Button onClick={() => setIsCreatingGroup(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Group
          </Button>
        </div>
      )}
      
      {/* Create Group Dialog */}
      <Dialog open={isCreatingGroup} onOpenChange={setIsCreatingGroup}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Discussion Group</DialogTitle>
            <DialogDescription>
              Create a new group to discuss matches, players, or any cricket topic
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Group Name</Label>
              <Input 
                id="name" 
                placeholder="Enter group name" 
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea 
                id="description" 
                placeholder="What's this group about?" 
                className="resize-none"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="groupType">Group Type</Label>
              <Select defaultValue="match" disabled={!!matchId || !!teamId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="match">Match Discussion</SelectItem>
                  <SelectItem value="team">Team Supporters</SelectItem>
                  <SelectItem value="general">General Discussion</SelectItem>
                  <SelectItem value="fantasy">Fantasy League</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch 
                id="private-group" 
                checked={isPrivateGroup}
                onCheckedChange={setIsPrivateGroup}
              />
              <Label htmlFor="private-group">Private Group</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatingGroup(false)}>Cancel</Button>
            <Button onClick={handleCreateGroup}>Create Group</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function MatchGroupDiscussionDialog({ matchId, teamId }: { matchId?: number, teamId?: number }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <MessageSquare className="h-4 w-4 mr-2" />
          Match Discussions
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle>Match Discussion Groups</DialogTitle>
          <DialogDescription>
            Join or create discussion groups for this match
          </DialogDescription>
        </DialogHeader>
        
        <div className="p-6 pt-2 h-[calc(90vh-10rem)]">
          <MatchDiscussionGroups matchId={matchId} teamId={teamId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}