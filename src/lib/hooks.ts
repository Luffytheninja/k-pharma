"use client";

// Custom hooks
import { useState, useEffect } from "react";
import { syncToCloud } from "./store";

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const currentOnline = navigator.onLine;
    setIsOnline(currentOnline);
    
    // Attempt an initial sync if starting online
    if (currentOnline) syncToCloud().catch(() => {});

    const handleOnline = () => {
      setIsOnline(true);
      syncToCloud().catch(() => {});
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}
