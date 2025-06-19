import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { User } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Camera, X, Trophy, User as UserIcon } from "lucide-react";

// Extended user type to include extra fields for the edit profile feature
type ExtendedUserProfile = Omit<User, "password"> & {
  name?: string;
  website?: string;
};

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: ExtendedUserProfile;
}

export function EditProfileDialog({ 
  open, 
  onOpenChange, 
  profile 
}: EditProfileDialogProps) {
  // Use fullName from User type, but fallback to name for display
  const [name, setName] = useState(profile.fullName || profile.name || "");
  const [bio, setBio] = useState(profile.bio || "");
  const [location, setLocation] = useState(profile.location || "");
  const [website, setWebsite] = useState(profile.website || "");
  const [profileImage, setProfileImage] = useState<string | null>(profile.profileImage);
  
  // Cricket-specific fields
  const [isPlayer, setIsPlayer] = useState(profile.isPlayer || false);
  const [isCoach, setIsCoach] = useState(profile.isCoach || false);
  const [preferredRole, setPreferredRole] = useState(profile.preferredRole || "");
  const [battingStyle, setBattingStyle] = useState(profile.battingStyle || "");
  const [bowlingStyle, setBowlingStyle] = useState(profile.bowlingStyle || "");
  const [favoriteTeam, setFavoriteTeam] = useState(profile.favoriteTeam || "");
  const [favoritePlayer, setFavoritePlayer] = useState(profile.favoritePlayer || "");
  
  // For image upload
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(profile.profileImage);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload/profile', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      return await response.json();
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      let profileImageUrl = profileImage;
      
      // If there is a new image file, upload it first
      if (imageFile) {
        try {
          const uploadResult = await uploadImageMutation.mutateAsync(imageFile);
          profileImageUrl = uploadResult.url;
        } catch (error) {
          console.error('Image upload failed:', error);
          throw new Error('Failed to upload profile image');
        }
      }
      
      // Set the updated profile data
      const updatedProfile = {
        fullName: name,
        bio,
        location,
        website,
        profileImage: profileImageUrl,
        isPlayer,
        isCoach,
        preferredRole: preferredRole || null,
        battingStyle: battingStyle || null,
        bowlingStyle: bowlingStyle || null,
        favoriteTeam: favoriteTeam || null,
        favoritePlayer: favoritePlayer || null
      };
      
      // Make the API call to update the user profile
      return await apiRequest("PATCH", `/api/user`, updatedProfile);
    },
    onSuccess: () => {
      // Invalidate all queries that might use the profile data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: [`/api/users/${profile.username}`] });
      
      // Force a reload of the profile data from the server
      queryClient.refetchQueries({ queryKey: ["/api/user"] });
      queryClient.refetchQueries({ queryKey: [`/api/users/${profile.username}`] });
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully"
      });
      onOpenChange(false); // Close dialog on success
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-0 max-h-[90vh] overflow-auto">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-lg font-semibold">Edit Profile</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Profile Image */}
          <div className="flex flex-col items-center mb-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                {imagePreview ? (
                  <AvatarImage src={imagePreview} alt={profile.username} />
                ) : (
                  <AvatarFallback>{profile.username.charAt(0).toUpperCase()}</AvatarFallback>
                )}
              </Avatar>
              
              <div className="absolute bottom-0 right-0 flex space-x-1">
                <div className="relative">
                  <Button 
                    type="button" 
                    variant="secondary" 
                    size="icon" 
                    className="h-8 w-8 rounded-full shadow bg-white hover:bg-neutral-100"
                  >
                    <Camera className="h-4 w-4" />
                    <span className="sr-only">Upload new image</span>
                  </Button>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={handleImageChange}
                  />
                </div>
                
                {imagePreview && (
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="icon" 
                    className="h-8 w-8 rounded-full shadow hover:opacity-90"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Remove image</span>
                  </Button>
                )}
              </div>
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              Upload a profile picture to personalize your account
            </p>
          </div>
          
          {/* Profile Details Tabs */}
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic" className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="cricket" className="flex items-center gap-2">
                <Trophy className="h-4 w-4" />
                Cricket Profile
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="Your name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea 
                  id="bio" 
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)} 
                  placeholder="Tell people about yourself"
                  className="resize-none h-24"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location" 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)} 
                  placeholder="Your location"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input 
                  id="website" 
                  value={website} 
                  onChange={(e) => setWebsite(e.target.value)} 
                  placeholder="Your website URL"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="cricket" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPlayer"
                    checked={isPlayer}
                    onCheckedChange={setIsPlayer}
                  />
                  <Label htmlFor="isPlayer">I'm a Player</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isCoach"
                    checked={isCoach}
                    onCheckedChange={setIsCoach}
                  />
                  <Label htmlFor="isCoach">I'm a Coach</Label>
                </div>
              </div>
              
              {isPlayer && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="preferredRole">Preferred Role</Label>
                    <Select value={preferredRole} onValueChange={setPreferredRole}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="batsman">Batsman</SelectItem>
                        <SelectItem value="bowler">Bowler</SelectItem>
                        <SelectItem value="all-rounder">All-rounder</SelectItem>
                        <SelectItem value="wicket-keeper">Wicket-keeper</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="battingStyle">Batting Style</Label>
                    <Select value={battingStyle} onValueChange={setBattingStyle}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select batting style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="right-handed">Right-handed</SelectItem>
                        <SelectItem value="left-handed">Left-handed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bowlingStyle">Bowling Style</Label>
                    <Select value={bowlingStyle} onValueChange={setBowlingStyle}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select bowling style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="right-arm-fast">Right-arm Fast</SelectItem>
                        <SelectItem value="left-arm-fast">Left-arm Fast</SelectItem>
                        <SelectItem value="right-arm-medium">Right-arm Medium</SelectItem>
                        <SelectItem value="left-arm-medium">Left-arm Medium</SelectItem>
                        <SelectItem value="right-arm-spin">Right-arm Spin</SelectItem>
                        <SelectItem value="left-arm-spin">Left-arm Spin</SelectItem>
                        <SelectItem value="right-arm-wrist-spin">Right-arm Wrist Spin</SelectItem>
                        <SelectItem value="left-arm-wrist-spin">Left-arm Wrist Spin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="favoriteTeam">Favorite Team</Label>
                <Input 
                  id="favoriteTeam" 
                  value={favoriteTeam} 
                  onChange={(e) => setFavoriteTeam(e.target.value)} 
                  placeholder="e.g., India, Mumbai Indians"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="favoritePlayer">Favorite Player</Label>
                <Input 
                  id="favoritePlayer" 
                  value={favoritePlayer} 
                  onChange={(e) => setFavoritePlayer(e.target.value)} 
                  placeholder="e.g., Virat Kohli, MS Dhoni"
                />
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end pt-4 border-t space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={updateProfileMutation.isPending}
              className="bg-[#FF5722] hover:bg-[#E64A19] text-white"
            >
              {updateProfileMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}