import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { useNotifications } from "@/lib/notifications";
import { useAuth } from "@/lib/auth";
import { relativeTime } from "@/lib/constants";

export const Route = createFileRoute("/notifications")({ component: NotificationsPage });

function NotificationsPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { notifications, markAsRead, markAllAsRead, loading } = useNotifications();

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [user, authLoading, navigate]);

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

  const handleNotificationClick = async (notification: any) => {
    await markAsRead(notification.id);
    if (notification.link) {
      navigate({ to: notification.link as any });
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read);
  const readNotifications = notifications.filter(n => n.read);

  return (
    <DashboardLayout>
      <div className="max-w-[800px]">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-white text-[28px] font-[Unbounded]">Notifications</h1>
          {unreadNotifications.length > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-[#A1A1A1] hover:text-white text-[14px] font-[Proza_Libre] transition"
            >
              Mark all as read
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="shimmer rounded-[16px] h-[100px]" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-[16px] p-12 text-center">
            <div className="text-6xl mb-4">🔔</div>
            <h3 className="text-white text-[18px] mb-2">No notifications yet</h3>
            <p className="text-[#A1A1A1] text-[14px] font-[Proza_Libre]">
              When you get notifications, they'll show up here
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {unreadNotifications.length > 0 && (
              <div>
                <h2 className="text-white text-[16px] font-[Proza_Libre] mb-3">New</h2>
                <div className="flex flex-col gap-2">
                  {unreadNotifications.map(notification => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className="w-full text-left bg-[#1A1A1A] border border-[#2A2A2A] rounded-[16px] p-5 hover:border-[#E2E2E2] transition"
                    >
                      <div className="flex gap-4">
                        <div className="text-3xl flex-shrink-0">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="text-white text-[16px] font-[Proza_Libre] font-medium">
                              {notification.title}
                            </h3>
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                          </div>
                          <p className="text-[#A1A1A1] text-[14px] font-[Proza_Libre] leading-[1.6]">
                            {notification.message}
                          </p>
                          <p className="text-[#666] text-[12px] font-[Proza_Libre] mt-2">
                            {relativeTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {readNotifications.length > 0 && (
              <div>
                <h2 className="text-white text-[16px] font-[Proza_Libre] mb-3">Earlier</h2>
                <div className="flex flex-col gap-2">
                  {readNotifications.map(notification => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className="w-full text-left bg-[#0A0A0A] border border-[#2A2A2A] rounded-[16px] p-5 hover:border-[#E2E2E2] transition"
                    >
                      <div className="flex gap-4">
                        <div className="text-3xl flex-shrink-0 opacity-50">{getNotificationIcon(notification.type)}</div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[#A1A1A1] text-[16px] font-[Proza_Libre] font-medium mb-1">
                            {notification.title}
                          </h3>
                          <p className="text-[#666] text-[14px] font-[Proza_Libre] leading-[1.6]">
                            {notification.message}
                          </p>
                          <p className="text-[#555] text-[12px] font-[Proza_Libre] mt-2">
                            {relativeTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
