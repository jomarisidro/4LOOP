'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HiBell } from 'react-icons/hi';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  CircularProgress,
} from '@mui/material';

export default function DashboardForm() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const open = Boolean(anchorEl);

  // ✅ Status to readable label mapping
  const statusLabels = {
    draft: 'Draft',
    submitted: 'Submitted',
    pending: 'Verifying',
    pending2: 'Compliance',
    pending3: 'Approval',
    completed: 'Approved',
  };

  // ✅ Fetch user data
  useEffect(() => {
    const userId =
      sessionStorage.getItem('userId') ||
      localStorage.getItem('loggedUserId');
    const userRole =
      sessionStorage.getItem('userRole') ||
      localStorage.getItem('loggedUserRole');

    if (!userId || !userRole) {
      setError('No user session found.');
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/users/${userId}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'Failed to fetch user');
          return;
        }

        setUser(data.user);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Network error');
      }
    };

    fetchUser();
  }, []);

  // ✅ Fetch notifications periodically (every 10 seconds)
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/notifications');
        const data = await res.json();
        if (res.ok) {
          setNotifications(data.notifications || []);
        }
      } catch (err) {
        console.error('Notification fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Notification menu handlers
  const handleBellClick = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  // ✅ Handle notification click with redirect
  const handleNotificationClick = (notif) => {
    handleMenuClose();
    if (!notif.status) return;

    const status = notif.status.toLowerCase();

    switch (status) {
      case 'pending':
      case 'pending2':
      case 'pending3':
        router.push('/businessaccount/pending');
        break;
      case 'completed':
        router.push('/businessaccount/completed');
        break;
      default:
        router.push('/businessaccount');
    }
  };

  return (
    <div className="relative">
      {/* --- Header Section with Bell --- */}
      <div className="flex justify-between items-center mb-6 px-4">
        <h1 className="text-2xl font-semibold">Welcome to Your Dashboard</h1>

        {/* 🔔 Notification Bell */}
        <div className="relative mr-4">
          <IconButton
            color="primary"
            onClick={handleBellClick}
            sx={{
              transform: 'scale(1.3)',
              '& .MuiBadge-badge': { top: 6, right: 6 },
            }}
          >
            <Badge badgeContent={notifications.length} color="error">
              <HiBell size={34} />
            </Badge>
          </IconButton>

          <Menu
            id="notification-menu"
            anchorEl={anchorEl}
            open={open}
            onClose={handleMenuClose}
            PaperProps={{
              style: {
                width: 360,
                maxHeight: 420,
                padding: '0.5rem 0',
              },
            }}
          >
            {loading ? (
              <MenuItem>
                <CircularProgress size={20} sx={{ mr: 2 }} /> Loading...
              </MenuItem>
            ) : notifications.length === 0 ? (
              <MenuItem>No new notifications</MenuItem>
            ) : (
              notifications.map((notif, i) => (
                <MenuItem
                  key={i}
                  onClick={() => handleNotificationClick(notif)}
                  sx={{
                    whiteSpace: 'normal',
                    lineHeight: 1.5,
                    fontSize: '1rem',
                    py: 1.5,
                    display: 'block',
                  }}
                >
               <div className="mb-1 text-sm text-gray-500">
  {/* ✅ Show BID Number if available */}
  {notif.bidNumber && (
    <span className="font-medium text-gray-600">
      {notif.bidNumber}
    </span>
  )}
</div>

<strong className="block mb-1 text-gray-800">
  {statusLabels[notif.status] || 'Update'}
</strong>

<span className="text-gray-700">
  {notif.message || 'New update available'}
</span>

                </MenuItem>
              ))
            )}
          </Menu>
        </div>
      </div>

      {/* --- Error --- */}
      {error && <div className="text-red-500 mb-4">Error: {error}</div>}
    </div>
  );
}
