import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useNotifications } from "@/lib/notifications";
import { relativeTime } from "@/lib/constants";

export function NotificationsDropdown() {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);

  const handleNotificationClick = async (notification: any) => {
    await markAsRead(notification.id);
    if (notification.link) {
      navigate({ to: notification.link as any });
    }
    setOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'connect_request_received':
        return '👋';
      case 'connect_request_accepted':
        return '✅';
      case 'friend_new_project':
        return '🚀';
      case 'project_invite':
        return '📨';
      case 'project_status_change':
        return '📊';
      default:
        return '🔔';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-[#A1A1A1] hover:text-white transition rounded-lg hover:bg-[#1A1A1A]"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-[380px] bg-[#0A0A0A] border border-[#2A2A2A] rounded-[12px] shadow-xl z-50 max-h-[500px] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-[#2A2A2A]">
              <h3 className="text-white text-[16px] font-[Unbounded]">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[#A1A1A1] hover:text-white text-[12px] font-[Proza_Libre] transition"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="overflow-y-auto flex-1">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="text-4xl mb-3">🔔</div>
                  <p className="text-[#A1A1A1] text-[14px] font-[Proza_Libre]">No notifications yet</p>
                </div>
              ) : (
                notifications.map(notification => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left p-4 border-b border-[#2A2A2A] hover:bg-[#1A1A1A] transition ${
                      !notification.read ? 'bg-[#1A1A1A]/50' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="text-2xl flex-shrink-0">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-white text-[14px] font-[Proza_Libre] font-medium">
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-[#A1A1A1] text-[13px] font-[Proza_Libre] mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-[#666] text-[11px] font-[Proza_Libre] mt-1">
                          {relativeTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 border-t border-[#2A2A2A] text-center">
                <button
                  onClick={() => {
                    navigate({ to: "/notifications" as any });
                    setOpen(false);
                  }}
                  className="text-[#A1A1A1] hover:text-white text-[13px] font-[Proza_Libre] transition"
                >
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
