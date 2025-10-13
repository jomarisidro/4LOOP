'use client';

import useSWR, { mutate } from 'swr';
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
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [isUploadingNewImage, setIsUploadingNewImage] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const storedId = localStorage.getItem('loggedUserId');
    if (storedId) setUserId(storedId);
  }, []);

  const { data } = useSWR(userId ? `/api/users/${userId}` : null, fetcher);
  const user = data?.user;

  useEffect(() => {
    if (user?.profilePicture) setPreview(user.profilePicture);
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      setMessage('❌ Invalid file type. Please upload a JPG, PNG, or WEBP image.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      setIsUploadingNewImage(true);
      setMessage('Preview ready. Confirm to save or cancel to discard.');
    };
    reader.readAsDataURL(file);
  };

  const confirmUpload = async () => {
    setUploading(true);
    setMessage('');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, imageData: preview }),
      });

      const result = await res.json();
      setUploading(false);

      if (result.success) {
        setMessage('✅ Profile picture updated successfully.');
        localStorage.setItem('profilePicture', preview);
        mutate(`/api/users/${userId}`);
        setIsUploadingNewImage(false);
        window.location.reload();
      } else {
        setMessage('❌ Upload failed: ' + result.error);
      }
    } catch (error) {
      setUploading(false);
      setMessage('❌ Upload error: ' + error.message);
    }
  };

  const cancelUpload = () => {
    setPreview(user?.profilePicture || null);
    setIsUploadingNewImage(false);
    setMessage('Upload canceled.');
  };

  const email = user?.email || '';
  const officerName = user?.name || 'Officer';

  return (
    <aside className="w-64 bg-white border-r p-6 shadow flex flex-col items-center">
      <div className="flex flex-col items-center mb-6">
        {/* Profile Image Upload Area */}
        <label className="cursor-pointer relative group">
          {preview ? (
            <div className="w-28 h-28 rounded-full overflow-hidden border border-gray-300 shadow-sm group-hover:opacity-80 transition">
              <img
                src={preview}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-28 h-28 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 group-hover:bg-gray-300 transition">
              <span className="text-xs text-center px-2">Click to upload image</span>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={uploading}
            className="hidden"
          />
        </label>

        {/* Confirm / Cancel Buttons */}
        {isUploadingNewImage && (
          <div className="flex gap-2 mt-2">
            <button
              onClick={confirmUpload}
              disabled={uploading}
              className={`px-2 py-1 rounded text-white text-sm transition ${
                uploading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {uploading ? 'Uploading...' : 'Confirm'}
            </button>

            <button
              onClick={cancelUpload}
              disabled={uploading}
              className={`px-2 py-1 rounded text-white text-sm transition ${
                uploading
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-gray-400 hover:bg-gray-500'
              }`}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Message */}
        {message && <p className="text-xs mt-2 text-center text-gray-600">{message}</p>}

        {/* Email */}
        <p className="text-sm text-gray-500 mt-2">{email}</p>
        {/* Officer Name */}
        <p className="font-semibold text-gray-800">{officerName}</p>
      </div>

      {/* Navigation */}
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
