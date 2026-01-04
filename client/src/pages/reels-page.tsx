import { ReelsFeed } from "@/components/reels";
import { MobileNav } from "@/components/mobile-nav";

export default function ReelsPage() {
  return (
    <div className="min-h-screen bg-black">
      <ReelsFeed />
      <MobileNav />
    </div>
  );
}
