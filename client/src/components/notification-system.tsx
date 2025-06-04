import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

export interface Notification {
  id: string;
  type: 'trade' | 'signal' | 'scaling' | 'error' | 'info';
  title: string;
  message: string;
  data?: any;
  timestamp: number;
  read: boolean;
}

interface NotificationSystemProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
  onMarkRead: (id: string) => void;
  className?: string;
}

export function NotificationSystem({ 
  notifications, 
  onDismiss, 
  onMarkRead,
  className 
}: NotificationSystemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  // Auto-show panel when new notifications arrive
  useEffect(() => {
    if (unreadCount > 0) {
      setIsOpen(true);
    }
  }, [unreadCount]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'trade':
        return 'fas fa-exchange-alt text-blue-400';
      case 'signal':
        return 'fas fa-signal text-green-400';
      case 'scaling':
        return 'fas fa-arrow-up text-yellow-400';
      case 'error':
        return 'fas fa-exclamation-triangle text-red-400';
      default:
        return 'fas fa-info-circle text-gray-400';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'trade':
        return 'border-blue-500/50 bg-blue-500/10';
      case 'signal':
        return 'border-green-500/50 bg-green-500/10';
      case 'scaling':
        return 'border-yellow-500/50 bg-yellow-500/10';
      case 'error':
        return 'border-red-500/50 bg-red-500/10';
      default:
        return 'border-gray-500/50 bg-gray-500/10';
    }
  };

  const sortedNotifications = [...notifications].sort((a, b) => b.timestamp - a.timestamp);
  const recentNotifications = sortedNotifications.slice(0, 5);

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative bg-gray-800 border-gray-600 hover:bg-gray-700"
      >
        <i className="fas fa-bell" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 w-5 h-5 text-xs flex items-center justify-center p-0"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notifications Panel */}
      {isOpen && (
        <Card className="absolute top-12 right-0 w-96 max-h-96 bg-gray-800 border-gray-700 shadow-xl z-50">
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Notifications</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => notifications.forEach(n => onMarkRead(n.id))}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <i className="fas fa-times" />
                </Button>
              </div>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {recentNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <i className="fas fa-bell-slash text-3xl mb-3 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="space-y-2 p-2">
                {recentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 rounded-lg border transition-all ${
                      notification.read 
                        ? 'bg-gray-700/50 border-gray-600' 
                        : getNotificationColor(notification.type)
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <i className={getNotificationIcon(notification.type)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <h4 className={`font-medium text-sm ${
                            notification.read ? 'text-gray-300' : 'text-white'
                          }`}>
                            {notification.title}
                          </h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDismiss(notification.id)}
                            className="text-gray-400 hover:text-white p-1 h-auto"
                          >
                            <i className="fas fa-times text-xs" />
                          </Button>
                        </div>
                        <p className={`text-sm mt-1 ${
                          notification.read ? 'text-gray-400' : 'text-gray-200'
                        }`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                          </span>
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onMarkRead(notification.id)}
                              className="text-xs text-blue-400 hover:text-blue-300 h-auto p-1"
                            >
                              Mark read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 5 && (
            <div className="p-3 border-t border-gray-700 text-center">
              <span className="text-xs text-gray-400">
                Showing {Math.min(5, notifications.length)} of {notifications.length} notifications
              </span>
            </div>
          )}
        </Card>
      )}

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 space-y-2 z-50 max-w-sm">
        {recentNotifications.slice(0, 3).filter(n => !n.read).map((notification) => (
          <Card
            key={`toast-${notification.id}`}
            className={`p-4 border shadow-lg animate-in slide-in-from-right ${
              getNotificationColor(notification.type)
            }`}
          >
            <div className="flex items-start space-x-3">
              <i className={getNotificationIcon(notification.type)} />
              <div className="flex-1">
                <h4 className="font-medium text-white text-sm">{notification.title}</h4>
                <p className="text-gray-200 text-sm mt-1">{notification.message}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDismiss(notification.id)}
                className="text-gray-400 hover:text-white p-1 h-auto"
              >
                <i className="fas fa-times text-xs" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Hook for managing notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep only last 50

    // Auto-dismiss after 5 seconds for non-error notifications
    if (notification.type !== 'error') {
      setTimeout(() => {
        dismissNotification(newNotification.id);
      }, 5000);
    }

    return newNotification.id;
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return {
    notifications,
    addNotification,
    dismissNotification,
    markAsRead,
    markAllAsRead,
    clearAll
  };
}
