import { Home, Search, PlusSquare, Heart, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { CreatePostModal } from "./create-post-modal";

export function MobileNav() {
  const { user } = useAuth();
  const [location] = useLocation();
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);

  const handleCreatePost = () => {
    setIsCreatePostModalOpen(true);
  };

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 py-2 z-50">
        <div className="flex justify-around items-center">
          <Link href="/">
            <Button 
              variant="ghost" 
              size="icon" 
              className={location === "/" ? "text-primary" : "text-neutral-600"}
            >
              <Home className="h-6 w-6" />
              <span className="sr-only">Home</span>
            </Button>
          </Link>
          
          <Button variant="ghost" size="icon" className="text-neutral-600">
            <Search className="h-6 w-6" />
            <span className="sr-only">Search</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-neutral-600"
            onClick={handleCreatePost}
          >
            <PlusSquare className="h-6 w-6" />
            <span className="sr-only">Create</span>
          </Button>
          
          <Button variant="ghost" size="icon" className="text-neutral-600">
            <Heart className="h-6 w-6" />
            <span className="sr-only">Notifications</span>
          </Button>
          
          <Link href={`/profile/${user?.username}`}>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-7 w-7">
                <AvatarImage 
                  src={user?.profileImage || "https://github.com/shadcn.png"} 
                  alt={user?.username || "User profile"} 
                />
                <AvatarFallback>{user?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
              </Avatar>
              <span className="sr-only">Profile</span>
            </Button>
          </Link>
        </div>
      </nav>
      
      <CreatePostModal 
        open={isCreatePostModalOpen} 
        onClose={() => setIsCreatePostModalOpen(false)} 
      />
    </>
  );
}
