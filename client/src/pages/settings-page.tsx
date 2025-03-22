import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { SettingsDialog } from "@/components/settings-dialog";

export default function SettingsPage() {
  const { user } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(true);

  // If the user closes the settings dialog, navigate back
  useEffect(() => {
    if (!isSettingsOpen) {
      window.history.back();
    }
  }, [isSettingsOpen]);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <p>Please login to view settings</p>
      </div>
    );
  }

  return (
    <div className="mt-16 pt-8 min-h-screen">
      <SettingsDialog 
        open={isSettingsOpen} 
        onOpenChange={setIsSettingsOpen}
      />
    </div>
  );
}