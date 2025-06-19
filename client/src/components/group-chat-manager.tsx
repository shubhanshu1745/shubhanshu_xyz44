import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getQueryFn, apiRequest } from "@/lib/queryClient";
import { Users, Plus, UserPlus, Settings, Crown, Shield, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface GroupMember {
  id: number;
  username: string;
  fullName: string;
  profileImage: string;
  role: 'admin' | 'moderator' | 'member';
  joinedAt: string;
  isActive: boolean;
}

interface GroupChat {
  id: number;
  name: string;
  description: string;
  imageUrl: string;
  memberCount: number;
  isPrivate: boolean;
  createdBy: number;
  createdAt: string;
  members: GroupMember[];
  recentActivity: string;
}

interface GroupChatManagerProps {
  className?: string;
}

export function GroupChatManager({ className = "" }: GroupChatManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupChat | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: groupChats = [] } = useQuery<GroupChat[]>({
    queryKey: ["/api/groups"],
    queryFn: getQueryFn()
  });

  const { data: suggestedUsers = [] } = useQuery({
    queryKey: ["/api/users/suggested"],
    queryFn: getQueryFn()
  });

  const createGroupMutation = useMutation({
    mutationFn: async (groupData: any) => {
      return await apiRequest("POST", "/api/groups", groupData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      setIsCreateOpen(false);
      setNewGroupName("");
      setNewGroupDescription("");
      setIsPrivate(false);
      toast({
        title: "Group created",
        description: "Your group chat has been created successfully"
      });
    }
  });

  const joinGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      return await apiRequest("POST", `/api/groups/${groupId}/join`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({
        title: "Joined group",
        description: "You have successfully joined the group"
      });
    }
  });

  const leaveGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      return await apiRequest("DELETE", `/api/groups/${groupId}/leave`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups"] });
      toast({
        title: "Left group",
        description: "You have left the group"
      });
    }
  });

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    
    createGroupMutation.mutate({
      name: newGroupName,
      description: newGroupDescription,
      isPrivate
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-3 w-3 text-yellow-500" />;
      case 'moderator':
        return <Shield className="h-3 w-3 text-blue-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <span>Group Chats</span>
        </h3>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              Create
            </Button>
          </DialogTrigger>
          
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Group Chat</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="groupName">Group Name</Label>
                <Input
                  id="groupName"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Enter group name"
                  maxLength={50}
                />
              </div>
              
              <div>
                <Label htmlFor="groupDescription">Description (Optional)</Label>
                <Textarea
                  id="groupDescription"
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="What's this group about?"
                  maxLength={200}
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="private"
                  checked={isPrivate}
                  onCheckedChange={setIsPrivate}
                />
                <Label htmlFor="private">Private Group</Label>
              </div>
              
              <Button
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim() || createGroupMutation.isPending}
                className="w-full"
              >
                {createGroupMutation.isPending ? "Creating..." : "Create Group"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {groupChats.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>No group chats yet</p>
            <p className="text-sm">Create or join a group to get started</p>
          </div>
        ) : (
          groupChats.map((group) => (
            <div
              key={group.id}
              className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
              onClick={() => setSelectedGroup(group)}
            >
              <div className="flex items-start space-x-3">
                <div className="relative">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={group.imageUrl || ""} alt={group.name} />
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {group.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {group.isPrivate && (
                    <div className="absolute -top-1 -right-1 h-4 w-4 bg-gray-800 rounded-full flex items-center justify-center">
                      <AlertCircle className="h-2.5 w-2.5 text-white" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium truncate">{group.name}</h4>
                    <span className="text-xs text-gray-500">
                      {group.memberCount} members
                    </span>
                  </div>
                  
                  {group.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                      {group.description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">
                      {group.recentActivity}
                    </span>
                    
                    <div className="flex -space-x-1">
                      {group.members.slice(0, 3).map((member) => (
                        <Avatar key={member.id} className="h-5 w-5 border border-white">
                          <AvatarImage src={member.profileImage || ""} alt={member.username} />
                          <AvatarFallback className="text-xs">
                            {member.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {group.memberCount > 3 && (
                        <div className="h-5 w-5 bg-gray-200 rounded-full border border-white flex items-center justify-center">
                          <span className="text-xs text-gray-600">+</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Group Details Dialog */}
      {selectedGroup && (
        <Dialog open={!!selectedGroup} onOpenChange={() => setSelectedGroup(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedGroup.imageUrl || ""} alt={selectedGroup.name} />
                  <AvatarFallback>{selectedGroup.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span>{selectedGroup.name}</span>
                {selectedGroup.isPrivate && <Badge variant="secondary">Private</Badge>}
              </DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="members">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="info">Info</TabsTrigger>
              </TabsList>
              
              <TabsContent value="members" className="space-y-3 mt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {selectedGroup.memberCount} members
                  </span>
                  <Button size="sm" variant="outline">
                    <UserPlus className="h-3 w-3 mr-1" />
                    Invite
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedGroup.members.map((member) => (
                    <div key={member.id} className="flex items-center space-x-3 p-2 rounded">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.profileImage || ""} alt={member.username} />
                        <AvatarFallback>
                          {member.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium truncate">
                            {member.fullName || member.username}
                          </span>
                          {getRoleIcon(member.role)}
                        </div>
                        <p className="text-sm text-gray-500">@{member.username}</p>
                      </div>
                      
                      {member.isActive && (
                        <div className="h-2 w-2 bg-green-500 rounded-full" />
                      )}
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="info" className="space-y-4 mt-4">
                {selectedGroup.description && (
                  <div>
                    <Label>Description</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedGroup.description}
                    </p>
                  </div>
                )}
                
                <div>
                  <Label>Created</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(selectedGroup.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    onClick={() => joinGroupMutation.mutate(selectedGroup.id)}
                    disabled={joinGroupMutation.isPending}
                  >
                    Join Group
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => leaveGroupMutation.mutate(selectedGroup.id)}
                    disabled={leaveGroupMutation.isPending}
                  >
                    Leave Group
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}