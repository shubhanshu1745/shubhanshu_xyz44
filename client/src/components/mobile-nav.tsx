import { Home, PlusSquare, Trophy, Users, MessageCircle, Film, UserPlus } from "lucide-react";
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
      <nav className="md:hidden fixed bottom-0 left-0 right-0 cricket-nav-bg shadow-lg py-3 z-50">
        <div className="flex justify-around items-center">
          <Link href="/">
            <Button 
              variant="ghost" 
              size="icon" 
              className={location === "/" ? "text-[#FFC107]" : "text-white hover:text-[#FFC107]"}
            >
              <Home className="h-6 w-6" />
              <span className="sr-only">Home</span>
            </Button>
          </Link>
          
          <Link href="/matches">
            <Button 
              variant="ghost" 
              size="icon" 
              className={location === "/matches" ? "text-[#FFC107]" : "text-white hover:text-[#FFC107]"}
            >
              <Trophy className="h-6 w-6" />
              <span className="sr-only">Matches</span>
            </Button>
          </Link>
          
          <Link href="/reels">
            <Button 
              variant="ghost" 
              size="icon" 
              className={location === "/reels" ? "text-[#FFC107]" : "text-white hover:text-[#FFC107]"}
            >
              <Film className="h-6 w-6" />
              <span className="sr-only">Reels</span>
            </Button>
          </Link>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:text-[#FFC107]"
            onClick={handleCreatePost}
          >
            <PlusSquare className="h-6 w-6" />
            <span className="sr-only">Create</span>
          </Button>
          
          <Link href="/suggestions">
            <Button 
              variant="ghost" 
              size="icon" 
              className={location === "/suggestions" ? "text-[#FFC107]" : "text-white hover:text-[#FFC107]"}
            >
              <UserPlus className="h-6 w-6" />
              <span className="sr-only">Suggestions</span>
            </Button>
          </Link>
          
          <Link href={`/profile/${user?.username}`}>
            <Button 
              variant="ghost" 
              size="icon" 
              className={location.startsWith(`/profile/${user?.username}`) ? "text-[#FFC107] rounded-full" : "text-white hover:text-[#FFC107] rounded-full"}
            >
              <Avatar className="h-7 w-7 border-2 border-[#2E8B57]">
                <AvatarImage 
                  src={user?.profileImage || "https://github.com/shadcn.png"} 
                  alt={user?.username || "User profile"} 
                />
                <AvatarFallback className="bg-[#2E8B57] text-white">{user?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
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
