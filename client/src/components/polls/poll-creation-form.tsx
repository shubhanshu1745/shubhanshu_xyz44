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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { X, Plus, Calendar } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

// Define the poll creation schema
const pollFormSchema = z.object({
  question: z.string().min(5, "Question must be at least 5 characters"),
  pollType: z.enum(["match_prediction", "player_performance", "team_selection", "general"]),
  matchId: z.coerce.number().positive().optional(),
  playerId: z.coerce.number().positive().optional(),
  teamId: z.coerce.number().positive().optional(),
  endTime: z.date().optional(),
  options: z.array(
    z.object({
      option: z.string().min(1, "Option text is required"),
      imageUrl: z.string().url().optional().or(z.literal("")),
    })
  ).min(2, "At least 2 options are required").max(6, "Maximum 6 options allowed"),
});

type PollFormData = z.infer<typeof pollFormSchema>;

interface PollCreationFormProps {
  matchId?: number;
  playerId?: number;
  teamId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PollCreationForm({
  matchId,
  playerId,
  teamId,
  onSuccess,
  onCancel,
}: PollCreationFormProps) {
  const { toast } = useToast();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with default values
  const form = useForm<PollFormData>({
    resolver: zodResolver(pollFormSchema),
    defaultValues: {
      question: "",
      pollType: "general",
      matchId: matchId,
      playerId: playerId,
      teamId: teamId,
      endTime: undefined,
      options: [{ option: "", imageUrl: "" }, { option: "", imageUrl: "" }],
    },
  });

  // Poll creation mutation
  const createPollMutation = useMutation({
    mutationFn: (data: PollFormData) => {
      return apiRequest("/api/polls", {
        method: "POST",
        data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/polls"] });
      toast({
        title: "Poll created",
        description: "Your poll has been created successfully",
      });
      form.reset();
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create poll. Please try again.",
        variant: "destructive",
      });
      console.error("Poll creation error:", error);
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const onSubmit = (data: PollFormData) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to create polls",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    // Filter out any empty options
    const validOptions = data.options.filter(option => option.option.trim() !== "");
    if (validOptions.length < 2) {
      toast({
        title: "Validation error",
        description: "At least 2 valid options are required",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Create clean data for submission
    const cleanData = {
      ...data,
      options: validOptions,
    };

    createPollMutation.mutate(cleanData);
  };

  const addOption = () => {
    const currentOptions = form.getValues("options");
    if (currentOptions.length < 6) {
      form.setValue("options", [...currentOptions, { option: "", imageUrl: "" }]);
    }
  };

  const removeOption = (index: number) => {
    const currentOptions = form.getValues("options");
    if (currentOptions.length > 2) {
      form.setValue(
        "options",
        currentOptions.filter((_, i) => i !== index)
      );
    } else {
      toast({
        title: "Minimum options",
        description: "At least 2 options are required",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Create a New Poll</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter your poll question"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="pollType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Poll Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a poll type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="match_prediction">Match Prediction</SelectItem>
                        <SelectItem value="player_performance">Player Performance</SelectItem>
                        <SelectItem value="team_selection">Team Selection</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Select the type of poll you want to create
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>
                      When should this poll close? Leave blank for no end date.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            <div>
              <FormLabel className="block mb-3">Poll Options</FormLabel>
              {form.getValues("options").map((_, index) => (
                <div key={index} className="flex items-start space-x-2 mb-3">
                  <FormField
                    control={form.control}
                    name={`options.${index}.option`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder={`Option ${index + 1}`} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeOption(index)}
                    className="mt-1"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {form.getValues("options").length < 6 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addOption}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex justify-end space-x-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Poll"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}