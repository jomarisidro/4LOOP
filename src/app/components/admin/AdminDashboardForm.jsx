'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';
import {
  LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

export default function AdminDashboardForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [renewalData, setRenewalData] = useState([]);
  const [newBusinessData, setNewBusinessData] = useState([]);
  const [totalForecastData, setTotalForecastData] = useState([]);
  const [comparisonData, setComparisonData] = useState([]);
  const [error, setError] = useState("");

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  // ✅ All hooks must come before any return
  useEffect(() => {
    const role = localStorage.getItem("loggedUserRole");
    const userId = localStorage.getItem("loggedUserId");

    if (role === "admin" && userId) {
      setIsAdmin(true);
    } else {
      router.push("/login");
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    async function fetchAllData() {
  try {
    const [renewRes, newRes, totalRes, compRes] = await Promise.all([
      fetch(`${API_URL}/cache-renewals`),
      fetch(`${API_URL}/cache-new-business`),
      fetch(`${API_URL}/cache-total-forecast`),
      fetch(`${API_URL}/cache-comparison`)
    ]);

    if (!renewRes.ok || !newRes.ok || !totalRes.ok || !compRes.ok) {
      throw new Error("One or more endpoints failed to load.");
    }

    const renewJson = await renewRes.json();
    const newJson = await newRes.json();
    const totalJson = await totalRes.json();
    const compJson = await compRes.json();

    setRenewalData(renewJson.data || []);
    setNewBusinessData(newJson.data || []);
    setTotalForecastData(totalJson.data || []);
    setComparisonData(compJson.data || []);
  } catch (err) {
    console.error(err);
    setError("Failed to fetch predictions. Please check your Flask API.");
  } finally {
    setLoading(false);
  }
}


    // only run after admin check done
    if (isAdmin) {
      fetchAllData();
    }
  }, [isAdmin]); // depend on isAdmin

  // ✅ Now safe to return conditionally below
  if (loading) {
    return (
      <Box mt={4} textAlign="center">
        <CircularProgress />
        <Typography mt={2}>Checking access...</Typography>
      </Box>
    );
  }

  if (!isAdmin) return null;

  if (error) return <p className="text-center text-red-600 mt-10">{error}</p>;

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* 1️⃣ Renewal & New Business Trend */}
      <div className="bg-white shadow-lg rounded-2xl p-4">
        <h2 className="text-xl font-bold mb-4">Renewal and New Business Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={comparisonData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="registrationYear" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="Renewals" stroke="#4f46e5" />
            <Line type="monotone" dataKey="NewBusiness" stroke="#10b981" />
          </LineChart>
        </ResponsiveContainer>
        {comparisonData.length === 0 && <p className="text-gray-500 mt-3 text-center">No predictions available.</p>}
      </div>

      {/* 2️⃣ Total Forecast */}
      <div className="bg-white shadow-lg rounded-2xl p-4">
        <h2 className="text-xl font-bold mb-4">Total Forecast</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={totalForecastData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="registrationYear" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="TotalForecast" fill="#6366f1" />
          </BarChart>
        </ResponsiveContainer>
        {totalForecastData.length === 0 && <p className="text-gray-500 mt-3 text-center">No predictions available.</p>}
      </div>

      {/* 3️⃣ Renewal Prediction */}
      <div className="bg-white shadow-lg rounded-2xl p-4">
        <h2 className="text-xl font-bold mb-4">Renewal Predictions by Year</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={renewalData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="registrationYear" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Renewals" fill="#22c55e" />
            <Bar dataKey="NonRenewals" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
        {renewalData.length === 0 && <p className="text-gray-500 mt-3 text-center">No predictions available.</p>}
      </div>

      {/* 4️⃣ New Business Prediction */}
      <div className="bg-white shadow-lg rounded-2xl p-4">
        <h2 className="text-xl font-bold mb-4">New Business Predictions</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={newBusinessData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="registrationYear" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="NewBusiness" stroke="#f59e0b" />
          </LineChart>
        </ResponsiveContainer>
        {newBusinessData.length === 0 && <p className="text-gray-500 mt-3 text-center">No predictions available.</p>}
      </div>
    </div>
  );
}
