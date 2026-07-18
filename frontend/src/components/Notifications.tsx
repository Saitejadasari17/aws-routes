"use client";

import { useNotifications } from "@/lib/notifications";

const colors: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  success: { bg: "bg-green-50", border: "border-l-[#037f0c]", text: "text-[#037f0c]", icon: "✓" },
  error: { bg: "bg-red-50", border: "border-l-[#d13212]", text: "text-[#d13212]", icon: "✕" },
  info: { bg: "bg-blue-50", border: "border-l-[#0972d3]", text: "text-[#0972d3]", icon: "ℹ" },
  warning: { bg: "bg-yellow-50", border: "border-l-[#f89256]", text: "text-[#8a6d3b]", icon: "⚠" },
};

export default function Notifications() {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-[48px] right-4 z-[100] space-y-2 w-[420px]">
      {notifications.map((n) => {
        const style = colors[n.type] || colors.info;
        return (
          <div
            key={n.id}
            className={`${style.bg} ${style.border} border-l-4 border border-[#d5dbdb] rounded px-4 py-3 shadow-sm flex items-start gap-2 animate-in`}
          >
            <span className={`${style.text} font-bold`}>{style.icon}</span>
            <span className="text-sm flex-1">{n.message}</span>
            <button
              onClick={() => removeNotification(n.id)}
              className="text-gray-400 hover:text-gray-600 text-sm"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
