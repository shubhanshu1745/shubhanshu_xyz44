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
  Search as SearchIcon
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
    <header className="bg-white border-b border-neutral-200 fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 flex items-center justify-between h-14">
        {/* Logo */}
        <div className="flex items-center">
          <Link href="/">
            <h1 className="text-xl font-bold font-sans text-primary cursor-pointer">
              <span className="text-[#FF5722]">Cric</span>Social
            </h1>
          </Link>
        </div>
        
        {/* Search Bar - Desktop */}
        <div className="hidden md:block flex-grow max-w-md mx-4">
          <div className="relative">
            <Input 
              type="text"
              className="bg-neutral-100 rounded-lg pl-10 pr-4 w-full text-sm focus:outline-none" 
              placeholder="Search players, matches, or posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
          </div>
        </div>
        
        {/* Nav Icons */}
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className={location === "/" ? "text-primary" : "text-neutral-600"}>
              <Home className="h-5 w-5" />
              <span className="sr-only">Home</span>
            </Button>
          </Link>
          
          <Button variant="ghost" size="icon" className="text-neutral-600 hover:text-primary hidden md:flex">
            <MessageCircle className="h-5 w-5" />
            <span className="sr-only">Messages</span>
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-neutral-600 hover:text-primary"
            onClick={handleCreatePost}
          >
            <PlusSquare className="h-5 w-5" />
            <span className="sr-only">Create Post</span>
          </Button>
          
          <Button variant="ghost" size="icon" className="text-neutral-600 hover:text-primary">
            <Compass className="h-5 w-5" />
            <span className="sr-only">Explore</span>
          </Button>
          
          <Button variant="ghost" size="icon" className="text-neutral-600 hover:text-primary">
            <Heart className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage 
                    src={user?.profileImage || "https://github.com/shadcn.png"} 
                    alt={user?.username || "User profile"} 
                  />
                  <AvatarFallback>{user?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Link href={`/profile/${user?.username}`}>
                <DropdownMenuItem>
                  <span>Profile</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem>
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
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
