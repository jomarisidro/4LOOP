'use client';

import { useEffect, useState } from 'react';

export default function DashboardForm() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const userId = sessionStorage.getItem("userId") || localStorage.getItem("loggedUserId");
    const userRole = sessionStorage.getItem("userRole") || localStorage.getItem("loggedUserRole");

    if (!userId || !userRole) {
      setError("No user session found.");
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await fetch(`/api/users/${userId}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Failed to fetch user");
          return;
        }

        setUser(data.user);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Network error");
      }
    };

    fetchUser();
  }, []);

  return (
    <>
      <h1 className="text-2xl font-semibold mb-6">Welcome to Your Dashboard</h1>

      {error && (
        <div className="text-red-500 mb-4">
          Error: {error}
        </div>
      )}

      {user ? (
        <div>
          <h2 className="text-xl font-semibold mb-4">Hello, {user.name || user.email}</h2>
          <p><b>Role:</b> {user.role}</p>
          <p><b>Email:</b> {user.email}</p>
          <p><b>User ID:</b> {user._id}</p>
        </div>
      ) : (
        !error && <div>Loading user data...</div>
      )}
    </>
  );
}
