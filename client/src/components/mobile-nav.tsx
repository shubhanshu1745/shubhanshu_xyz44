import { 
  Home, 
  PlusSquare, 
  Trophy, 
  Users, 
  MessageCircle, 
  Film, 
  UserPlus, 
  TrendingUp, 
  MoreHorizontal 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { CreatePostModal } from "./create-post-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:text-[#FFC107]"
            onClick={handleCreatePost}
          >
            <PlusSquare className="h-6 w-6" />
            <span className="sr-only">Create</span>
          </Button>
          
          <Link href="/stats">
            <Button 
              variant="ghost" 
              size="icon" 
              className={location === "/stats" ? "text-[#FFC107]" : "text-white hover:text-[#FFC107]"}
            >
              <TrendingUp className="h-6 w-6" />
              <span className="sr-only">Stats</span>
            </Button>
          </Link>
          
          {/* More dropdown for mobile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-white hover:text-[#FFC107]"
              >
                <MoreHorizontal className="h-6 w-6" />
                <span className="sr-only">More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 mt-1 cricket-nav-bg border-gray-700">
              <Link href="/reels">
                <DropdownMenuItem className="cursor-pointer text-white hover:bg-[#1F3B4D]/50">
                  <Film className="mr-2 h-4 w-4" />
                  <span>Reels</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/suggestions">
                <DropdownMenuItem className="cursor-pointer text-white hover:bg-[#1F3B4D]/50">
                  <UserPlus className="mr-2 h-4 w-4" />
                  <span>Suggestions</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/teams">
                <DropdownMenuItem className="cursor-pointer text-white hover:bg-[#1F3B4D]/50">
                  <Users className="mr-2 h-4 w-4" />
                  <span>Teams</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/chat">
                <DropdownMenuItem className="cursor-pointer text-white hover:bg-[#1F3B4D]/50">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  <span>Messages</span>
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
          
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
