
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPlayerMatchSchema } from "@shared/schema";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";

export function AddMatchDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const form = useForm({
    resolver: zodResolver(createPlayerMatchSchema),
    defaultValues: {
      matchName: "",
      matchDate: new Date().toISOString().split("T")[0],
      venue: "",
      opponent: "",
      matchType: "T20",
      result: "In Progress"
    }
  });

  const onSubmit = async (data: any) => {
    try {
      const response = await fetch(`/api/users/${user?.username}/matches`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error("Failed to add match");

      await queryClient.invalidateQueries([`/api/users/${user?.username}/matches`]);
      
      toast({
        title: "Success",
        description: "Match added successfully",
      });
      
      setOpen(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add match",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default">Add Match</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Match</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="matchName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Match Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Friendly Match vs Team X" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="matchDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Match Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="venue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Venue</FormLabel>
                  <FormControl>
                    <Input placeholder="Match location" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="opponent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opponent</FormLabel>
                  <FormControl>
                    <Input placeholder="Opponent team name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="matchType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Match Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select match type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="T20">T20</SelectItem>
                      <SelectItem value="ODI">ODI</SelectItem>
                      <SelectItem value="Test">Test</SelectItem>
                      <SelectItem value="Practice">Practice</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full">Add Match</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
