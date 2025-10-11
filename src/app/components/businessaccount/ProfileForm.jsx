'use client';
import { mutate } from 'swr';
import { useState, useEffect } from 'react';

export default function ProfileForm() {
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadConfirmed, setUploadConfirmed] = useState(false);
  const [isUploadingNewImage, setIsUploadingNewImage] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const userId = localStorage.getItem("loggedUserId");

    if (userId) {
      fetch(`/api/users/${userId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.user?.profilePicture) setPreview(data.user.profilePicture);
        });
    }
  }, []);

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

    const userId = localStorage.getItem("loggedUserId");

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

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Profile Picture</h1>

      <div className="flex flex-col items-center gap-4 mb-8">
        {preview ? (
          <img src={preview} alt="Preview" className="w-32 h-32 rounded-full border shadow object-cover" />
        ) : (
          <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
            No Image
          </div>
        )}

        <label
          className={`px-4 py-2 rounded text-white transition cursor-pointer ${
            uploading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          Choose Image
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={uploading}
            className="hidden"
          />
        </label>

        {isUploadingNewImage && (
          <div className="flex gap-4">
            <button
              onClick={confirmUpload}
              disabled={uploading}
              className={`px-3 py-1 rounded text-white transition ${
                uploading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {uploading ? "Uploading..." : "Confirm"}
            </button>

            <button
              onClick={cancelUpload}
              disabled={uploading}
              className={`px-3 py-1 rounded text-white transition ${
                uploading ? "bg-gray-300 cursor-not-allowed" : "bg-gray-400 hover:bg-gray-500"
              }`}
            >
              Cancel
            </button>
          </div>
        )}

        {uploading && <p className="text-blue-500 text-sm">Uploading...</p>}
        {message && <p className="text-sm">{message}</p>}
      </div>
    </div>
  );
}
