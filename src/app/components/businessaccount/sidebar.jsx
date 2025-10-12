'use client';

import useSWR, { mutate } from 'swr';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const navItems = [
  { label: 'Dashboard', path: '/businessaccount' },
  { label: 'Businesses', path: '/businessaccount/businesses' },
  { label: 'Make a Request', path: '/businessaccount/request' },
  { label: 'Pending Request', path: '/businessaccount/pending' },
  { label: 'Completed Request', path: '/businessaccount/completed' },
  { label: 'Help', path: '/businessaccount/help' },
  { label: 'Logout', path: '/businessaccount/logout' },
];

const fetcher = (url) =>
  fetch(url, { credentials: 'include' }).then((res) => res.json());

export default function Sidebar() {
  const [userId, setUserId] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadConfirmed, setUploadConfirmed] = useState(false);
  const [isUploadingNewImage, setIsUploadingNewImage] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const storedId = localStorage.getItem("loggedUserId");
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

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setMessage("❌ Invalid file type. Please upload a JPG, PNG, or similar image.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
      setIsUploadingNewImage(true);
      setUploadConfirmed(false);
      setMessage("Preview ready. Confirm to save or cancel to discard.");
    };
    reader.readAsDataURL(file);
  };

  const confirmUpload = async () => {
    setUploading(true);
    setMessage("");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, imageData: preview }),
      });

      const result = await res.json();
      setUploading(false);

      if (result.success) {
        setMessage("✅ Profile picture updated successfully.");
        localStorage.setItem("profilePicture", preview);
        mutate(`/api/users/${userId}`);
        setUploadConfirmed(true);
        setIsUploadingNewImage(false);
        window.location.reload();
      } else {
        setMessage("❌ Upload failed: " + result.error);
      }
    } catch (error) {
      setUploading(false);
      setMessage("❌ Upload error: " + error.message);
    }
  };

  const cancelUpload = () => {
    setPreview(null);
    setUploadConfirmed(false);
    setIsUploadingNewImage(false);
    setMessage("Upload canceled.");
    window.location.reload();
  };

  const businessNickname = user?.businessNickname || user?.name || "Welcome!";
  const email = user?.email || "";
  const role =
    user?.role === 'business'
      ? 'Business Account'
      : user?.role === 'officer'
      ? 'Sanitation Officer'
      : user?.role === 'admin'
      ? 'Admin'
      : 'User';

  return (
    <aside className="w-64 bg-white border-r p-6 shadow flex flex-col items-center">
      <div className="flex flex-col items-center mb-6">
        {/* 👤 Profile Image with Upload Trigger */}
        <label className="cursor-pointer relative group">
          {preview ? (
            <img
              src={preview}
              alt="Profile"
              width={80}
              height={80}
              className="rounded-full border border-gray-300 shadow-sm object-cover group-hover:opacity-80 transition"
            />
          ) : (
            <label className="cursor-pointer group relative">
  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 group-hover:bg-gray-300 transition">
    <span className="text-xs text-center px-2">Click to upload image</span>
  </div>
  <input
    type="file"
    accept="image/*"
    onChange={handleImageChange}
    disabled={uploading}
    className="hidden"
  />
</label>

          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={uploading}
            className="hidden"
          />
        </label>

        {/* 📤 Confirm/Cancel Buttons */}
        {isUploadingNewImage && (
          <div className="flex gap-2 mt-2">
            <button
              onClick={confirmUpload}
              disabled={uploading}
              className={`px-2 py-1 rounded text-white text-sm transition ${
                uploading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {uploading ? "Uploading..." : "Confirm"}
            </button>

            <button
              onClick={cancelUpload}
              disabled={uploading}
              className={`px-2 py-1 rounded text-white text-sm transition ${
                uploading ? "bg-gray-300 cursor-not-allowed" : "bg-gray-400 hover:bg-gray-500"
              }`}
            >
              Cancel
            </button>
          </div>
        )}

        {/* 📣 Message */}
        {message && <p className="text-xs mt-2 text-center text-gray-600">{message}</p>}

        {/* 👤 Name, Email, and Role */}
        <p className="mt-3 font-semibold text-gray-800">{businessNickname}</p>
        <p className="text-sm text-gray-600">{email}</p>
        <p className="text-sm text-gray-500">{role}</p>
      </div>

      {/* 🧭 Navigation */}
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
