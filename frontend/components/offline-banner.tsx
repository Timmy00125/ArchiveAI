"use client";

import { useEffect } from "react";
import { useAppStore } from "@/lib/store";
import { WifiOff } from "lucide-react";

export function OfflineBanner() {
  const online = useAppStore((s) => s.online);
  const setOnline = useAppStore((s) => s.setOnline);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    setOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setOnline]);

  if (online) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-destructive text-destructive-foreground text-center text-xs py-1.5 flex items-center justify-center gap-2">
      <WifiOff className="h-3 w-3" />
      You are offline. Some features may not work.
    </div>
  );
}
