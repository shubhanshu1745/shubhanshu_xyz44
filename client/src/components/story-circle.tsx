import { useState, memo } from "react";
import { User } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";

interface StoryCircleProps {
  user: Partial<User>;
  hasStory?: boolean;
  onClick?: () => void;
}

// Using memo to prevent unnecessary re-renders
export const StoryCircle = memo(({ user, hasStory = true, onClick }: StoryCircleProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Handle image loading to show a smooth transition
  const handleImageLoad = () => {
    setIsLoaded(true);
  };
  
  // If onClick is provided, make the component clickable, otherwise use Link
  const ContentContainer = onClick ? 
    ({ children }: { children: React.ReactNode }) => (
      <div onClick={onClick} className="flex flex-col items-center cursor-pointer">
        {children}
      </div>
    ) : 
    ({ children }: { children: React.ReactNode }) => (
      <Link href={`/profile/${user.username}`}>
        <div className="flex flex-col items-center cursor-pointer">
          {children}
        </div>
      </Link>
    );
  
  return (
    <ContentContainer>
      <div 
        className={`
          ${hasStory ? 'story-pulse' : ''}
          ${hasStory ? 'bg-gradient-to-tr from-[#FF5722] via-[#4CAF50] to-[#1A73E8]' : 'bg-neutral-200'} 
          mb-1 p-[2px] rounded-full transition-all duration-300 ease-in-out
          ${hasStory ? 'hover:scale-105' : 'hover:scale-102'}
        `}
      >
        <div className="bg-white p-0.5 rounded-full">
          <Avatar className={`h-16 w-16 transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
            <AvatarImage 
              src={user.profileImage || "https://github.com/shadcn.png"} 
              alt={user.username || "User"} 
              className="object-cover"
              onLoad={handleImageLoad}
            />
            <AvatarFallback 
              className={`bg-gradient-to-r from-[#2E8B57] to-[#4CAF50] text-white transition-opacity duration-300 ${isLoaded ? 'opacity-0' : 'opacity-100'}`}
            >
              {(user.username || "U").charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
      <span className="text-xs font-medium">{user.username}</span>
    </ContentContainer>
  );
});
