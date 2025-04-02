import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Save, Edit2 } from "lucide-react";

// Define the cricket profile attributes schema
const cricketProfileSchema = z.object({
  // Basic player info
  isPlayer: z.boolean().default(false),
  isCoach: z.boolean().default(false),
  isFan: z.boolean().default(true),
  preferredRole: z.enum(["batsman", "bowler", "all_rounder", "wicket_keeper", "fan", "coach", "umpire"]).default("fan"),
  
  // Cricket-specific attributes
  battingStyle: z.enum(["right_handed", "left_handed", "switch_hitter"]).optional().nullable(),
  bowlingStyle: z.enum([
    "right_arm_fast", "right_arm_medium", "right_arm_off_break", "right_arm_leg_break", 
    "left_arm_fast", "left_arm_medium", "left_arm_orthodox", "left_arm_chinaman"
  ]).optional().nullable(),
  position: z.enum([
    "opener", "top_order", "middle_order", "lower_order", "tail_ender", "not_applicable"
  ]).default("not_applicable"),
  
  // Preferences
  favoriteTeam: z.string().optional().nullable(),
  favoriteTournament: z.string().optional().nullable(),
  favoritePlayer: z.string().optional().nullable(),
  
  // Experience and interests
  playingExperience: z.enum(["beginner", "amateur", "club", "domestic", "international", "none"]).default("none"),
  cricketInterests: z.array(z.string()).default([]),
  preferredFormats: z.array(z.enum(["test", "odi", "t20", "t10", "first_class", "list_a"])).default([]),
});

type CricketProfileData = z.infer<typeof cricketProfileSchema>;

interface CricketProfileEditorProps {
  userId?: number;
  initialData?: Partial<CricketProfileData>;
  onSuccess?: () => void;
  onCancel?: () => void;
  mode?: "edit" | "create";
}

export function CricketProfileEditor({
  userId,
  initialData = {},
  onSuccess,
  onCancel,
  mode = "edit",
}: CricketProfileEditorProps) {
  const { toast } = useToast();
  const { user, refetchUser } = useUser();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Merge default values with initial data
  const defaultValues: CricketProfileData = {
    isPlayer: initialData.isPlayer ?? false,
    isCoach: initialData.isCoach ?? false,
    isFan: initialData.isFan ?? true,
    preferredRole: initialData.preferredRole ?? "fan",
    battingStyle: initialData.battingStyle ?? null,
    bowlingStyle: initialData.bowlingStyle ?? null,
    position: initialData.position ?? "not_applicable",
    favoriteTeam: initialData.favoriteTeam ?? null,
    favoriteTournament: initialData.favoriteTournament ?? null,
    favoritePlayer: initialData.favoritePlayer ?? null,
    playingExperience: initialData.playingExperience ?? "none",
    cricketInterests: initialData.cricketInterests ?? [],
    preferredFormats: initialData.preferredFormats ?? [],
  };

  // Initialize form with default values
  const form = useForm<CricketProfileData>({
    resolver: zodResolver(cricketProfileSchema),
    defaultValues,
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: CricketProfileData) => {
      return apiRequest(`/api/cricket-profile`, {
        method: "PATCH",
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      refetchUser();
      toast({
        title: "Profile updated",
        description: "Your cricket profile has been updated successfully",
      });
      setIsDialogOpen(false);
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
      console.error("Profile update error:", error);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: CricketProfileData) => {
    setIsSubmitting(true);
    updateProfileMutation.mutate(data);
  };

  // Format role text for display
  const formatRole = (role: string) => {
    return role
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const cricketInterestOptions = [
    "Batting Technique",
    "Bowling Strategy",
    "Match Analysis",
    "Cricket History",
    "Equipment Reviews",
    "Fantasy Cricket",
    "Cricket Statistics",
    "Coaching",
    "Umpiring",
    "Cricket Technology"
  ];

  return (
    <>
      {mode === "edit" ? (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Cricket Profile
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Cricket Profile</DialogTitle>
              <DialogDescription>
                Update your cricket-specific profile information.
              </DialogDescription>
            </DialogHeader>
            <CricketProfileForm
              form={form}
              onSubmit={onSubmit}
              isSubmitting={isSubmitting}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Complete Your Cricket Profile</h3>
            <CricketProfileForm
              form={form}
              onSubmit={onSubmit}
              isSubmitting={isSubmitting}
              onCancel={onCancel}
            />
          </CardContent>
        </Card>
      )}
    </>
  );
}

interface CricketProfileFormProps {
  form: any;
  onSubmit: (data: CricketProfileData) => void;
  isSubmitting: boolean;
  onCancel?: () => void;
}

function CricketProfileForm({
  form,
  onSubmit,
  isSubmitting,
  onCancel,
}: CricketProfileFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Role Selection */}
        <div className="space-y-4">
          <h4 className="font-medium">Your Cricket Role</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="isPlayer"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-md border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Player</FormLabel>
                    <FormDescription>
                      I play cricket
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isCoach"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-md border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Coach</FormLabel>
                    <FormDescription>
                      I coach cricket
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isFan"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between space-y-0 rounded-md border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Fan</FormLabel>
                    <FormDescription>
                      I'm a cricket fan
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
          
          <FormField
            control={form.control}
            name="preferredRole"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Primary Role</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your primary cricket role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="batsman">Batsman</SelectItem>
                    <SelectItem value="bowler">Bowler</SelectItem>
                    <SelectItem value="all_rounder">All-Rounder</SelectItem>
                    <SelectItem value="wicket_keeper">Wicket Keeper</SelectItem>
                    <SelectItem value="fan">Fan</SelectItem>
                    <SelectItem value="coach">Coach</SelectItem>
                    <SelectItem value="umpire">Umpire</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  Select the role that best describes you in cricket
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <Separator />
        
        {/* Conditionally show player attributes if isPlayer is true */}
        {form.watch("isPlayer") && (
          <div className="space-y-4">
            <h4 className="font-medium">Player Details</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="battingStyle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batting Style</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your batting style" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="right_handed">Right Handed</SelectItem>
                        <SelectItem value="left_handed">Left Handed</SelectItem>
                        <SelectItem value="switch_hitter">Switch Hitter</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="bowlingStyle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bowling Style</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your bowling style" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="right_arm_fast">Right Arm Fast</SelectItem>
                        <SelectItem value="right_arm_medium">Right Arm Medium</SelectItem>
                        <SelectItem value="right_arm_off_break">Right Arm Off-Break</SelectItem>
                        <SelectItem value="right_arm_leg_break">Right Arm Leg-Break</SelectItem>
                        <SelectItem value="left_arm_fast">Left Arm Fast</SelectItem>
                        <SelectItem value="left_arm_medium">Left Arm Medium</SelectItem>
                        <SelectItem value="left_arm_orthodox">Left Arm Orthodox</SelectItem>
                        <SelectItem value="left_arm_chinaman">Left Arm Chinaman</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batting Position</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your batting position" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="opener">Opener</SelectItem>
                        <SelectItem value="top_order">Top Order</SelectItem>
                        <SelectItem value="middle_order">Middle Order</SelectItem>
                        <SelectItem value="lower_order">Lower Order</SelectItem>
                        <SelectItem value="tail_ender">Tail Ender</SelectItem>
                        <SelectItem value="not_applicable">Not Applicable</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="playingExperience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Playing Experience</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your experience level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="amateur">Amateur</SelectItem>
                        <SelectItem value="club">Club Level</SelectItem>
                        <SelectItem value="domestic">Domestic/State Level</SelectItem>
                        <SelectItem value="international">International Level</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <Separator />
          </div>
        )}
        
        {/* Preferences */}
        <div className="space-y-4">
          <h4 className="font-medium">Cricket Preferences</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="favoriteTeam"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Favorite Team</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your favorite cricket team" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="favoritePlayer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Favorite Player</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your favorite cricket player" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="favoriteTournament"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Favorite Tournament</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your favorite tournament" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              "Saving..."
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Profile
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}