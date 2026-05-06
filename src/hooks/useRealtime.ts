import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useRealtimeNotifications(onInsert?: () => void) {
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("system_notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "SystemNotification" },
        () => {
          onInsert?.();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [onInsert]);
}
