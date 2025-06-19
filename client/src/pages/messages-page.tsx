import { MessagesContainer } from "@/components/enhanced-messages";
import { Header } from "@/components/header";

export default function MessagesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="pt-16">
        <MessagesContainer />
      </div>
    </div>
  );
}