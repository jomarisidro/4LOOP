'use client';

import useSWR from 'swr';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const navItems = [
  { label: 'Dashboard', path: '/officers' },
  { label: 'Workbench', path: '/officers/workbench' },
  { label: 'Inspections', path: '/officers/inspections' },
  { label: 'Businesses', path: '/officers/businesses' },
  { label: 'Profile Settings', path: '/officers/profile' },
  { label: 'Help', path: '/officers/help' },
  { label: 'Logout', path: '/officers/logout' },
];

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((res) => res.json());

export default function Sidebar() {
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const storedId = localStorage.getItem('loggedUserId');
    if (storedId) setUserId(storedId);
  }, []);

  const { data, error } = useSWR(
    userId ? `/api/users/${userId}` : null,
    fetcher
  );

  const user = data?.user;
  const profileImage = user?.profilePicture || null;
  const email = user?.email || '';
  const officerName = user?.name || 'Officer';

  return (
    <aside className="w-64 bg-white border-r p-6 shadow flex flex-col items-center">
      <div className="flex flex-col items-center mb-6">
        {!user ? (
          <div className="w-20 h-20 rounded-full bg-gray-100 animate-pulse" />
        ) : profileImage ? (
          <img
            src={profileImage}
            alt="Profile"
            width={80}
            height={80}
            className="rounded-full border border-gray-300 shadow-sm object-cover"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
            No Image
          </div>
        )}

        {/* Email first */}
        <p className="text-sm text-gray-500 mt-2">{email}</p>
        {/* Officer/Name second */}
        <p className="font-semibold text-gray-800">{officerName}</p>
      </div>

      <nav className="w-full space-y-4">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.path}
            className="block text-lg text-gray-700 hover:text-blue-600 px-4 py-1 transition"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
