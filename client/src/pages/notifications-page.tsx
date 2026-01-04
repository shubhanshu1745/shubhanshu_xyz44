import { Header } from "@/components/header";
import { MobileNav } from "@/components/mobile-nav";
import { Notifications } from "@/components/notifications";
import { FollowRequests } from "@/components/follow-requests";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="pt-16 pb-20 md:pb-0">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Activity</h1>
            
            <Tabs defaultValue="notifications" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="notifications">Notifications</TabsTrigger>
                <TabsTrigger value="requests">Follow Requests</TabsTrigger>
              </TabsList>
              
              <TabsContent value="notifications" className="mt-6">
                <Notifications />
              </TabsContent>
              
              <TabsContent value="requests" className="mt-6">
                <FollowRequests />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
      <MobileNav />
    </div>
  );
}