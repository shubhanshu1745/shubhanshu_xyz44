import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";
import { ChatList } from "@/components/chat-list";
import { ChatConversation } from "@/components/chat-conversation";

export default function ChatPage() {
  const isMobile = useIsMobile();
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [, params] = useRoute<{ id: string }>("/chat/:id");
  
  // Set active conversation from URL parameter
  useEffect(() => {
    if (params?.id) {
      const id = parseInt(params.id);
      if (!isNaN(id)) {
        setActiveConversationId(id);
      }
    } else {
      setActiveConversationId(null);
    }
  }, [params]);
  
  const handleBackToList = () => {
    setActiveConversationId(null);
  };
  
  // On mobile, show either conversation list or active conversation
  // On desktop, show both in a split view
  return (
    <div className="flex h-full">
      <div 
        className={`${
          isMobile && activeConversationId ? "hidden" : "flex-none w-full md:w-80 border-r"
        }`}
      >
        <ChatList />
      </div>
      
      <div 
        className={`${
          isMobile && !activeConversationId ? "hidden" : "flex-1"
        }`}
      >
        {activeConversationId ? (
          <ChatConversation 
            conversationId={activeConversationId} 
            onBack={handleBackToList} 
          />
        ) : (
          <div className="hidden md:flex items-center justify-center h-full text-muted-foreground">
            <p>Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    </div>
  );
}