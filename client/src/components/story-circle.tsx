import { User } from "@shared/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "wouter";

interface StoryCircleProps {
  user: Partial<User>;
  hasStory?: boolean;
}

export function StoryCircle({ user, hasStory = true }: StoryCircleProps) {
  return (
    <Link href={`/profile/${user.username}`}>
      <div className="flex flex-col items-center cursor-pointer">
        <div className={`${hasStory ? 'bg-gradient-to-tr from-[#1A73E8] via-[#4CAF50] to-[#FF5722]' : 'bg-neutral-200'} mb-1 p-[2px] rounded-full`}>
          <div className="bg-white p-0.5 rounded-full">
            <Avatar className="h-16 w-16">
              <AvatarImage 
                src={user.profileImage || "https://github.com/shadcn.png"} 
                alt={user.username || "User"} 
                className="object-cover"
              />
              <AvatarFallback>{(user.username || "U").charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
          </div>
        </div>
        <span className="text-xs">{user.username}</span>
      </div>
    </Link>
  );
}
