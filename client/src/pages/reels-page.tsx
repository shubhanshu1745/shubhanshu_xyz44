import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { ReelsFeedEnhanced } from "@/components/reels";
import { MobileNav } from "@/components/mobile-nav";

export default function ReelsPage() {
  const [location] = useLocation();
  const [initialReelId, setInitialReelId] = useState<number | undefined>();
  const [feedType, setFeedType] = useState<"following" | "explore" | "trending">("following");

  // Parse URL params for deep linking
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reelId = params.get("id");
    const type = params.get("type");
    
    if (reelId) {
      setInitialReelId(parseInt(reelId));
    }
    if (type && ["following", "explore", "trending"].includes(type)) {
      setFeedType(type as any);
    }
  }, [location]);

  return (
    <div className="min-h-screen bg-black">
      <ReelsFeedEnhanced 
        initialReelId={initialReelId}
        initialType={feedType}
      />
      <MobileNav />
    </div>
  );
}
