'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateOfficerForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [officers, setOfficers] = useState([]);

  // Fetch officers on mount
  useEffect(() => {
    const fetchOfficers = async () => {
      try {
        const res = await fetch('/api/users?role=officer');
        const data = await res.json();
        if (res.ok) {
          setOfficers(data.users || []);
        } else {
          console.error('Failed to fetch officers:', data.error);
        }
      } catch (err) {
        console.error('Error fetching officers:', err);
      }
    };
    fetchOfficers();
  }, []);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    // ✅ Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setMessage('❌ Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          role: 'officer', // enforce officer role
        }),
      });

      const data = await res.json();
      setLoading(false);

      if (!res.ok) {
        setMessage(`❌ Failed: ${data.error || 'Unknown error'}`);
        return;
      }

      setMessage('✅ Officer account created successfully.');

      // Refresh officer list
      setOfficers((prev) => [...prev, data.user]);

      // Reset form
      setFormData({
        fullName: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
    } catch (err) {
      setLoading(false);
      setMessage(`❌ Error: ${err.message}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 border rounded shadow">
      {/* Officers List FIRST */}
      <h2 className="text-xl font-semibold mb-4">Officers List</h2>
      {officers.length === 0 ? (
        <p className="text-gray-500">No officers found.</p>
      ) : (
        <ul className="divide-y border rounded mb-8">
          {officers.map((officer) => (
            <li key={officer._id} className="p-3 flex justify-between items-center">
              <div>
                <p className="font-medium">{officer.fullName}</p>
                <p className="text-sm text-gray-600">{officer.email}</p>
              </div>
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {officer.role}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Create Officer Form SECOND */}
      <h1 className="text-2xl font-semibold mb-4">Create Officer Account</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-6">
        <input
          type="text"
          name="fullName"
          placeholder="Full Name"
          value={formData.fullName}
          onChange={handleChange}
          required
          className="border p-2 rounded"
        />

        <input
          type="email"
          name="email"
          placeholder="Officer Email"
          value={formData.email}
          onChange={handleChange}
          required
          className="border p-2 rounded"
        />

        <input
          type="password"
          name="password"
          placeholder="Temporary Password"
          value={formData.password}
          onChange={handleChange}
          required
          minLength={8}
          className="border p-2 rounded"
        />

        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
          minLength={8}
          className="border p-2 rounded"
        />

        <button
          type="submit"
          disabled={loading}
          className={`px-4 py-2 rounded text-white transition ${
            loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Creating...' : 'Create Officer'}
        </button>
      </form>

      {message && <p className="mt-4 text-sm">{message}</p>}
    </div>
  );
}
