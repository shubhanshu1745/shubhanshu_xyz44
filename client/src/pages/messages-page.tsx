import { MessagesContainer } from "@/components/enhanced-messages";
import { GroupChatManager } from "@/components/group-chat-manager";
import { SocialAnalytics } from "@/components/social-analytics";
import { Header } from "@/components/header";

export default function MessagesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="pt-16">
        <div className="container mx-auto max-w-7xl px-4 py-6">
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Group Chat Manager */}
            <div className="lg:col-span-1">
              <GroupChatManager className="sticky top-20" />
            </div>
            
            {/* Main Messages Container */}
            <div className="lg:col-span-2">
              <MessagesContainer />
            </div>
            
            {/* Social Analytics */}
            <div className="lg:col-span-1">
              <SocialAnalytics className="sticky top-20" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}