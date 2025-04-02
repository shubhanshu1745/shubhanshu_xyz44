import { useState } from "react";
import { PollsList } from "@/components/polls/polls-list";
import { PollCreationForm } from "@/components/polls/poll-creation-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Plus, BarChart3 } from "lucide-react";
import { useUser } from "@/hooks/use-user";

export default function PollsPage() {
  const { user } = useUser();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Cricket Polls</h1>
          <p className="text-muted-foreground mt-1">
            Vote on cricket-related polls or create your own
          </p>
        </div>
        
        {user && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Poll
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px]">
              <PollCreationForm
                onSuccess={() => setIsDialogOpen(false)}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="mt-8">
        <PollsList showFilters={true} />
      </div>

      {!user && (
        <div className="bg-muted/50 border rounded-lg p-6 mt-10 text-center">
          <BarChart3 className="h-10 w-10 mx-auto mb-2 text-primary" />
          <h3 className="text-xl font-semibold mb-2">Join the conversation</h3>
          <p className="text-muted-foreground mb-4">
            Sign in to create polls and share your cricket opinions with the community
          </p>
          <Button variant="outline" asChild>
            <a href="/login">Sign In to Create Polls</a>
          </Button>
        </div>
      )}
    </div>
  );
}