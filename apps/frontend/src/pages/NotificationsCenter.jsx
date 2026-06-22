import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';

function NotificationsCenter() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, job_match, system
  const [unreadCount, setUnreadCount] = useState(0);

  const mountedRef = useRef(true);
  const abortRef = useRef(null);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const params = {
        limit: 50,
        skip: 0,
      };

      if (filter === 'unread') {
        params.isRead = 'false';
      } else if (filter !== 'all') {
        params.type = filter;
      }

      const res = await API.get('/notifications', {
        params,
        signal: abortRef.current.signal,
      });

      if (!mountedRef.current) return;

      setNotifications(res.data?.data?.notifications || []);
      setUnreadCount(res.data?.data?.stats?.unreadCount || 0);
    } catch (err) {
      if (err?.code !== 'ERR_CANCELED') {
        console.error('Error fetching notifications:', err);
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [user, filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = useCallback(async (notificationId) => {
    try {
      await API.patch(`/notifications/${notificationId}/read`);
      if (mountedRef.current) {
        setNotifications(prev =>
          prev.map(n =>
            n._id === notificationId ? { ...n, isRead: true } : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  const handleMarkAllAsRead = useCallback(async () => {
    try {
      await API.patch('/notifications/read-all');
      if (mountedRef.current) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, isRead: true }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }, []);

  const handleDelete = useCallback(async (notificationId) => {
    try {
      await API.delete(`/notifications/${notificationId}`);
      if (mountedRef.current) {
        setNotifications(prev =>
          prev.filter(n => n._id !== notificationId)
        );
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, []);

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'job_match':
        return '💼';
      case 'new_opportunity':
        return '⭐';
      case 'inquiry':
        return '💬';
      case 'message':
        return '✉️';
      case 'alert':
        return '🔔';
      default:
        return '📢';
    }
  };

  return (
    <main className="min-h-screen bg-navy-900 text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-navy-800/95 backdrop-blur border-b border-gray-700 p-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Notifikasyon</h1>
            {unreadCount > 0 && (
              <p className="text-xs text-yellow-400">{unreadCount} pa li</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs px-3 py-1 rounded bg-yellow-400/20 text-yellow-400 hover:bg-yellow-400/30 transition"
            >
              Make tout yo li
            </button>
          )}
        </div>
      </div>

      {/* Filter */}
      <div className="sticky top-16 z-10 bg-navy-800/80 backdrop-blur border-b border-gray-700 p-3 overflow-x-auto">
        <div className="max-w-2xl mx-auto flex gap-2">
          {['all', 'unread', 'job_match', 'alert', 'system'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded text-xs font-medium whitespace-nowrap transition ${
                filter === f
                  ? 'bg-yellow-400 text-black'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {f === 'all' && 'Tout'}
              {f === 'unread' && 'Pa Li'}
              {f === 'job_match' && 'Travay'}
              {f === 'alert' && 'Alèt'}
              {f === 'system' && 'Sistèm'}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-4">
        {loading && (
          <div className="text-center py-8 text-gray-400">
            Ap chaje notifikasyon yo...
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-gray-400">Pa gen notifikasyon</p>
          </div>
        )}

        {!loading && notifications.length > 0 && (
          <div className="space-y-2">
            {notifications.map(notification => (
              <div
                key={notification._id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 rounded-lg border transition cursor-pointer ${
                  notification.isRead
                    ? 'border-gray-700 bg-gray-800/30 hover:bg-gray-800/50'
                    : 'border-yellow-400/50 bg-yellow-400/10 hover:bg-yellow-400/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm">{notification.title}</h3>
                      {!notification.isRead && (
                        <div className="w-2 h-2 rounded-full bg-yellow-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-300 mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleDateString('ht')}
                      </span>
                      {notification.category && (
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300">
                          {notification.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(notification._id);
                    }}
                    className="text-gray-400 hover:text-red-400 transition"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default NotificationsCenter;
