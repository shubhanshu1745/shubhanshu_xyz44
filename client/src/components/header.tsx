import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Home,
  MessageCircle,
  PlusSquare,
  Compass,
  Heart,
  Search as SearchIcon,
  MoreHorizontal,
  TrendingUp,
  User,
  Settings,
  BookOpen,
  Video
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreatePostModal } from "./create-post-modal";

export function Header() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleCreatePost = () => {
    setIsCreatePostModalOpen(true);
  };

  return (
    <header className="cricket-nav-bg text-white fixed top-0 left-0 right-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/">
            <h1 className="text-xl font-bold font-sans cursor-pointer">
              <span className="cricket-accent">Cric</span>
              <span className="text-white">Social</span>
            </h1>
          </Link>
        </div>
        
        {/* Search Bar - Desktop */}
        <div className="hidden md:block flex-grow max-w-md mx-4">
          <div className="relative">
            <Input 
              type="text"
              className="bg-white/10 border-0 rounded-lg pl-10 pr-4 w-full text-sm focus:outline-none text-white placeholder:text-white/70" 
              placeholder="Search players, matches, or posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-white/70" />
          </div>
        </div>
        
        {/* Nav Icons */}
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className={location === "/" ? "text-[#FFC107]" : "text-white hover:text-[#FFC107]"}>
              <Home className="h-5 w-5" />
              <span className="sr-only">Home</span>
            </Button>
          </Link>
          
          <Link href="/chat">
            <Button variant="ghost" size="icon" className={location === "/chat" ? "text-[#FFC107]" : "text-white hover:text-[#FFC107] hidden md:flex"}>
              <MessageCircle className="h-5 w-5" />
              <span className="sr-only">Messages</span>
            </Button>
          </Link>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:text-[#FFC107]"
            onClick={handleCreatePost}
          >
            <PlusSquare className="h-5 w-5" />
            <span className="sr-only">Create Post</span>
          </Button>
          
          <Link href="/matches">
            <Button variant="ghost" size="icon" className={location === "/matches" ? "text-[#FFC107]" : "text-white hover:text-[#FFC107]"}>
              <Compass className="h-5 w-5" />
              <span className="sr-only">Explore</span>
            </Button>
          </Link>
          
          <Button variant="ghost" size="icon" className="text-white hover:text-[#FFC107]">
            <Heart className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>
          
          {/* More Button with Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white hover:text-[#FFC107]">
                <MoreHorizontal className="h-5 w-5" />
                <span className="sr-only">More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <Link href="/stats">
                <DropdownMenuItem className="cursor-pointer">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  <span>Player Stats</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/reels">
                <DropdownMenuItem className="cursor-pointer">
                  <Video className="mr-2 h-4 w-4" />
                  <span>Reels</span>
                </DropdownMenuItem>
              </Link>
              <Link href="/teams">
                <DropdownMenuItem className="cursor-pointer">
                  <BookOpen className="mr-2 h-4 w-4" />
                  <span>Teams</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <Link href="/suggestions">
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Suggestions</span>
                </DropdownMenuItem>
              </Link>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* User Profile Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full border-2 border-[#2E8B57]">
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={user?.profileImage || "https://github.com/shadcn.png"} 
                    alt={user?.username || "User profile"} 
                  />
                  <AvatarFallback className="bg-[#2E8B57] text-white">{user?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Link href={`/profile/${user?.username}`}>
                <DropdownMenuItem className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-500">
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <CreatePostModal 
        open={isCreatePostModalOpen} 
        onClose={() => setIsCreatePostModalOpen(false)}
      />
    </header>
  );
}
