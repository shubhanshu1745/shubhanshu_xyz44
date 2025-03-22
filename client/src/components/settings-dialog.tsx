import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest, getQueryFn } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { 
  Bell,
  Shield,
  Lock,
  UserCog,
  Languages,
  HelpCircle,
  LogOut
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

// User settings interface
interface UserSettings {
  id?: number;
  username?: string;
  email?: string;
  privateAccount?: boolean;
  activityStatus?: boolean;
  tagSettings?: string;
  mentionSettings?: string;
  postNotifications?: boolean;
  commentNotifications?: boolean;
  followNotifications?: boolean;
  messageNotifications?: boolean;
  cricketUpdates?: boolean;
  language?: string;
  profileImage?: string;
  bio?: string;
  isVerified?: boolean;
  isPlayer?: boolean;
}

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { toast } = useToast();
  const { logoutMutation } = useAuth();
  const queryClient = useQueryClient();
  
  // Account settings
  // Fetch current user data
  const { data: currentUser, isLoading } = useQuery<UserSettings>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "throw" }),
  });
  
  // Account settings
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Privacy settings
  const [privateAccount, setPrivateAccount] = useState(false);
  const [activityStatus, setActivityStatus] = useState(true);
  const [tagSettings, setTagSettings] = useState("everyone");
  const [mentionSettings, setMentionSettings] = useState("everyone");
  
  // Notification settings
  const [postNotifications, setPostNotifications] = useState(true);
  const [commentNotifications, setCommentNotifications] = useState(true);
  const [followNotifications, setFollowNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [cricketUpdates, setCricketUpdates] = useState(true);
  
  // Language settings
  const [language, setLanguage] = useState("english");
  
  // Update form fields when user data is loaded
  useEffect(() => {
    if (currentUser) {
      setUsername(currentUser.username || "");
      setEmail(currentUser.email || "");
      
      // Set privacy settings (these would normally come from the user object)
      setPrivateAccount(currentUser.privateAccount || false);
      setActivityStatus(currentUser.activityStatus !== false); // Default to true
      setTagSettings(currentUser.tagSettings || "everyone");
      setMentionSettings(currentUser.mentionSettings || "everyone");
      
      // Set notification settings
      setPostNotifications(currentUser.postNotifications !== false); // Default to true
      setCommentNotifications(currentUser.commentNotifications !== false);
      setFollowNotifications(currentUser.followNotifications !== false);
      setMessageNotifications(currentUser.messageNotifications !== false);
      setCricketUpdates(currentUser.cricketUpdates !== false);
      
      // Set language preference
      setLanguage(currentUser.language || "english");
    }
  }, [currentUser]);
  
  const updatePasswordMutation = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match");
      }
      
      return await apiRequest("POST", "/api/change-password", {
        oldPassword,
        newPassword
      });
    },
    onSuccess: () => {
      toast({
        title: "Password updated",
        description: "Your password has been changed successfully."
      });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update password. Please check your current password and try again.",
        variant: "destructive"
      });
    }
  });
  
  const updatePrivacyMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PATCH", "/api/user/privacy", {
        privateAccount,
        activityStatus,
        tagSettings,
        mentionSettings
      });
    },
    onSuccess: () => {
      toast({
        title: "Privacy settings updated",
        description: "Your privacy settings have been updated successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update privacy settings. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  const updateNotificationsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PATCH", "/api/user/notifications", {
        postNotifications,
        commentNotifications,
        followNotifications,
        messageNotifications,
        cricketUpdates
      });
    },
    onSuccess: () => {
      toast({
        title: "Notification settings updated",
        description: "Your notification settings have been updated successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update notification settings. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  const updateLanguageMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PATCH", "/api/user/language", {
        language
      });
    },
    onSuccess: () => {
      toast({
        title: "Language updated",
        description: "Your language preference has been updated successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update language preference. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  const handleLogout = () => {
    logoutMutation.mutate();
    onOpenChange(false);
  };
  
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    updatePasswordMutation.mutate();
  };
  
  const handlePrivacySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePrivacyMutation.mutate();
  };
  
  const handleNotificationsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateNotificationsMutation.mutate();
  };
  
  const updateAccountMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PATCH", "/api/user", {
        username,
        email
      });
    },
    onSuccess: () => {
      // Invalidate queries that might use this data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      toast({
        title: "Account updated",
        description: "Your account information has been updated successfully."
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update account information. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateAccountMutation.mutate();
  };

  const handleLanguageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateLanguageMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 max-h-[90vh] overflow-auto">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-lg font-semibold">Settings</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="account" className="w-full">
          <div className="flex border-b">
            <TabsList className="h-auto flex flex-col items-start bg-transparent p-0 w-1/3 border-r">
              <TabsTrigger 
                value="account" 
                className="w-full justify-start px-4 py-3 data-[state=active]:bg-neutral-100 rounded-none border-l-2 border-l-transparent data-[state=active]:border-l-[#FF5722]"
              >
                <UserCog className="h-4 w-4 mr-2" />
                Account
              </TabsTrigger>
              <TabsTrigger 
                value="privacy" 
                className="w-full justify-start px-4 py-3 data-[state=active]:bg-neutral-100 rounded-none border-l-2 border-l-transparent data-[state=active]:border-l-[#FF5722]"
              >
                <Shield className="h-4 w-4 mr-2" />
                Privacy
              </TabsTrigger>
              <TabsTrigger 
                value="security" 
                className="w-full justify-start px-4 py-3 data-[state=active]:bg-neutral-100 rounded-none border-l-2 border-l-transparent data-[state=active]:border-l-[#FF5722]"
              >
                <Lock className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger 
                value="notifications" 
                className="w-full justify-start px-4 py-3 data-[state=active]:bg-neutral-100 rounded-none border-l-2 border-l-transparent data-[state=active]:border-l-[#FF5722]"
              >
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger 
                value="language" 
                className="w-full justify-start px-4 py-3 data-[state=active]:bg-neutral-100 rounded-none border-l-2 border-l-transparent data-[state=active]:border-l-[#FF5722]"
              >
                <Languages className="h-4 w-4 mr-2" />
                Language
              </TabsTrigger>
              <TabsTrigger 
                value="help" 
                className="w-full justify-start px-4 py-3 data-[state=active]:bg-neutral-100 rounded-none border-l-2 border-l-transparent data-[state=active]:border-l-[#FF5722]"
              >
                <HelpCircle className="h-4 w-4 mr-2" />
                Help & Support
              </TabsTrigger>
              <div className="w-full px-4 py-4 border-t mt-auto">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 px-0"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log Out
                </Button>
              </div>
            </TabsList>
            
            <div className="w-2/3 p-4">
              <TabsContent value="account" className="m-0">
                <h3 className="text-lg font-medium mb-4">Account Information</h3>
                <form className="space-y-4" onSubmit={handleAccountSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input 
                      id="username" 
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)} 
                      placeholder="Your username"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="Your email"
                    />
                  </div>
                  
                  <div className="pt-4 border-t mt-4">
                    <h4 className="font-medium mb-2">Connected Accounts</h4>
                    <p className="text-sm text-neutral-500 mb-4">
                      Connect your social media accounts to enhance your CricSocial experience
                    </p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white mr-3">F</div>
                          <span>Facebook</span>
                        </div>
                        <Button variant="outline" size="sm">Connect</Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center text-white mr-3">X</div>
                          <span>Twitter/X</span>
                        </div>
                        <Button variant="outline" size="sm">Connect</Button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-yellow-500 rounded-full flex items-center justify-center text-white mr-3">I</div>
                          <span>Instagram</span>
                        </div>
                        <Button variant="outline" size="sm">Connect</Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button 
                      type="submit"
                      className="bg-[#FF5722] hover:bg-[#E64A19] text-white"
                      disabled={updateAccountMutation.isPending}
                    >
                      {updateAccountMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Save Changes
                    </Button>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="privacy" className="m-0">
                <h3 className="text-lg font-medium mb-4">Privacy Settings</h3>
                <form className="space-y-4" onSubmit={handlePrivacySubmit}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Private Account</p>
                      <p className="text-sm text-neutral-500">
                        When your account is private, only people you approve can see your posts
                      </p>
                    </div>
                    <Switch 
                      checked={privateAccount} 
                      onCheckedChange={setPrivateAccount} 
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Activity Status</p>
                      <p className="text-sm text-neutral-500">
                        Allow accounts you follow to see when you were last active
                      </p>
                    </div>
                    <Switch 
                      checked={activityStatus} 
                      onCheckedChange={setActivityStatus} 
                    />
                  </div>
                  
                  <div className="space-y-2 pt-4 border-t mt-4">
                    <Label>Who can tag you</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          id="tag-everyone" 
                          name="tag-settings" 
                          value="everyone" 
                          checked={tagSettings === "everyone"}
                          onChange={() => setTagSettings("everyone")}
                        />
                        <Label htmlFor="tag-everyone" className="cursor-pointer">Everyone</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          id="tag-following" 
                          name="tag-settings" 
                          value="following" 
                          checked={tagSettings === "following"}
                          onChange={() => setTagSettings("following")}
                        />
                        <Label htmlFor="tag-following" className="cursor-pointer">People you follow</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          id="tag-nobody" 
                          name="tag-settings" 
                          value="nobody" 
                          checked={tagSettings === "nobody"}
                          onChange={() => setTagSettings("nobody")}
                        />
                        <Label htmlFor="tag-nobody" className="cursor-pointer">No one</Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Who can mention you</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          id="mention-everyone" 
                          name="mention-settings" 
                          value="everyone" 
                          checked={mentionSettings === "everyone"}
                          onChange={() => setMentionSettings("everyone")}
                        />
                        <Label htmlFor="mention-everyone" className="cursor-pointer">Everyone</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input 
                          type="radio" 
                          id="mention-following" 
                          name="mention-settings" 
                          value="following" 
                          checked={mentionSettings === "following"}
                          onChange={() => setMentionSettings("following")}
                        />
                        <Label htmlFor="mention-following" className="cursor-pointer">People you follow</Label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button 
                      type="submit"
                      className="bg-[#FF5722] hover:bg-[#E64A19] text-white"
                      disabled={updatePrivacyMutation.isPending}
                    >
                      {updatePrivacyMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Save Privacy Settings
                    </Button>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="security" className="m-0">
                <h3 className="text-lg font-medium mb-4">Security Settings</h3>
                <form className="space-y-4" onSubmit={handlePasswordChange}>
                  <div className="space-y-2">
                    <Label htmlFor="oldPassword">Current Password</Label>
                    <Input 
                      id="oldPassword" 
                      type="password"
                      value={oldPassword} 
                      onChange={(e) => setOldPassword(e.target.value)} 
                      placeholder="Enter your current password"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input 
                      id="newPassword" 
                      type="password"
                      value={newPassword} 
                      onChange={(e) => setNewPassword(e.target.value)} 
                      placeholder="Enter new password"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <Input 
                      id="confirmPassword" 
                      type="password"
                      value={confirmPassword} 
                      onChange={(e) => setConfirmPassword(e.target.value)} 
                      placeholder="Confirm new password"
                    />
                  </div>
                  
                  <div className="pt-4 border-t mt-4">
                    <h4 className="font-medium mb-3">Two-Factor Authentication</h4>
                    <p className="text-sm text-neutral-500 mb-4">
                      Add an extra layer of security to your account
                    </p>
                    <Button variant="outline">Enable Two-Factor Authentication</Button>
                  </div>
                  
                  <div className="pt-4 border-t mt-4">
                    <h4 className="font-medium mb-3">Login Activity</h4>
                    <p className="text-sm text-neutral-500 mb-4">
                      Review your recent login activity
                    </p>
                    <Button variant="outline">View Login Activity</Button>
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <Button 
                      type="submit"
                      className="bg-[#FF5722] hover:bg-[#E64A19] text-white"
                      disabled={updatePasswordMutation.isPending || !oldPassword || !newPassword || !confirmPassword}
                    >
                      {updatePasswordMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Update Password
                    </Button>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="notifications" className="m-0">
                <h3 className="text-lg font-medium mb-4">Notification Settings</h3>
                <form className="space-y-4" onSubmit={handleNotificationsSubmit}>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Post Notifications</p>
                        <p className="text-sm text-neutral-500">
                          Receive notifications when accounts you follow post new content
                        </p>
                      </div>
                      <Switch 
                        checked={postNotifications} 
                        onCheckedChange={setPostNotifications} 
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Comment Notifications</p>
                        <p className="text-sm text-neutral-500">
                          Receive notifications when someone comments on your posts
                        </p>
                      </div>
                      <Switch 
                        checked={commentNotifications} 
                        onCheckedChange={setCommentNotifications} 
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Follow Notifications</p>
                        <p className="text-sm text-neutral-500">
                          Receive notifications when someone follows you
                        </p>
                      </div>
                      <Switch 
                        checked={followNotifications} 
                        onCheckedChange={setFollowNotifications} 
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Message Notifications</p>
                        <p className="text-sm text-neutral-500">
                          Receive notifications for new messages
                        </p>
                      </div>
                      <Switch 
                        checked={messageNotifications} 
                        onCheckedChange={setMessageNotifications} 
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Cricket Updates</p>
                        <p className="text-sm text-neutral-500">
                          Receive notifications about cricket matches and updates
                        </p>
                      </div>
                      <Switch 
                        checked={cricketUpdates} 
                        onCheckedChange={setCricketUpdates} 
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end pt-4 border-t mt-4">
                    <Button 
                      type="submit"
                      className="bg-[#FF5722] hover:bg-[#E64A19] text-white"
                      disabled={updateNotificationsMutation.isPending}
                    >
                      {updateNotificationsMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Save Notification Settings
                    </Button>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="language" className="m-0">
                <h3 className="text-lg font-medium mb-4">Language Settings</h3>
                <form className="space-y-4" onSubmit={handleLanguageSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="language">Select Language</Label>
                    <select 
                      id="language" 
                      value={language} 
                      onChange={(e) => setLanguage(e.target.value)}
                      className="w-full border rounded-md p-2"
                    >
                      <option value="english">English</option>
                      <option value="hindi">Hindi</option>
                      <option value="bengali">Bengali</option>
                      <option value="urdu">Urdu</option>
                      <option value="tamil">Tamil</option>
                      <option value="telugu">Telugu</option>
                      <option value="marathi">Marathi</option>
                    </select>
                  </div>
                  
                  <div className="flex justify-end pt-4 border-t mt-4">
                    <Button 
                      type="submit"
                      className="bg-[#FF5722] hover:bg-[#E64A19] text-white"
                      disabled={updateLanguageMutation.isPending}
                    >
                      {updateLanguageMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : null}
                      Save Language Setting
                    </Button>
                  </div>
                </form>
              </TabsContent>
              
              <TabsContent value="help" className="m-0">
                <h3 className="text-lg font-medium mb-4">Help & Support</h3>
                
                <div className="space-y-4">
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium mb-2">Help Center</h4>
                    <p className="text-sm text-neutral-500 mb-3">
                      Find answers to common questions and learn how to use CricSocial features.
                    </p>
                    <Button variant="outline" size="sm">Visit Help Center</Button>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium mb-2">Report a Problem</h4>
                    <p className="text-sm text-neutral-500 mb-3">
                      Let us know if you're experiencing issues with the app.
                    </p>
                    <Button variant="outline" size="sm">Report Problem</Button>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium mb-2">Privacy Policy</h4>
                    <p className="text-sm text-neutral-500 mb-3">
                      Learn how we collect and use your information.
                    </p>
                    <Button variant="outline" size="sm">View Privacy Policy</Button>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium mb-2">Terms of Service</h4>
                    <p className="text-sm text-neutral-500 mb-3">
                      Read the terms and conditions for using CricSocial.
                    </p>
                    <Button variant="outline" size="sm">View Terms</Button>
                  </div>
                  
                  <div className="border rounded-md p-4">
                    <h4 className="font-medium mb-2">Community Guidelines</h4>
                    <p className="text-sm text-neutral-500 mb-3">
                      Learn about acceptable behavior on CricSocial.
                    </p>
                    <Button variant="outline" size="sm">View Guidelines</Button>
                  </div>
                </div>
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}