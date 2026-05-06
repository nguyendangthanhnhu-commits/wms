"use client";

import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useRealtimeNotifications } from "@/hooks/useRealtime";
import { useNotificationStore } from "@/stores/notificationStore";

export function NotificationBell() {
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);

  useRealtimeNotifications(() => {
    setUnreadCount(unreadCount + 1);
  });

  return (
    <Button type="button" variant="outline" size="icon" className="relative">
      <Bell className="size-4" />
      {unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </Button>
  );
}
