/// <reference types="vite-plugin-pwa/client" />

import { useEffect } from "react";
import { registerSW } from "virtual:pwa-register";
import { toast } from "sonner";

export default function PwaStatus() {
  useEffect(() => {
    const updateServiceWorker = registerSW({
      immediate: true,
      onNeedRefresh() {
        toast("A new POS version is ready.", {
          description: "Reload to apply the update.",
          duration: Infinity,
          action: {
            label: "Reload",
            onClick: () => void updateServiceWorker(true),
          },
        });
      },
      onOfflineReady() {
        toast.success("POS is ready to work offline.");
      },
    });

    const handleOnline = () => {
      toast.success("Connection restored.");
    };
    const handleOffline = () => {
      toast.warning("You are offline. Changes may not sync until connection is restored.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (!navigator.onLine) {
      handleOffline();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return null;
}
