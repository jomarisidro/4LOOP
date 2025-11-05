"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  TextField,
  Button,
  CircularProgress,
  Box,
  Typography,
} from "@mui/material";
import { useMutation } from "@tanstack/react-query";
import { updateUserPassword } from "@/app/services/UserService"; // ✅ Correct service

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function ChangePasswordForm() {
  const router = useRouter();
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const storedId = localStorage.getItem("loggedUserId");
    if (storedId) setUserId(storedId);
  }, []);

  const { data } = useSWR(userId ? `/api/users/${userId}` : null, fetcher);
  const user = data?.user;

  const [oldPass, setOldPass] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [error, setError] = useState("");

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      updateUserPassword(userId, {
        action: "changePassword",
        currentPassword: oldPass,
        newPassword: password,
      }),
    onSuccess: () => {
      alert("✅ Password updated successfully!");
      router.push("/businessaccount");
    },
    onError: (error) => {
      const errMsg = error.response?.data?.error || "Failed to update password";
      setError(errMsg);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!oldPass || !password || !confirmPass)
      return setError("All fields are required.");

    if (password !== confirmPass)
      return setError("Passwords do not match.");

    mutate();
  };

  if (!user) return <CircularProgress />;

  return (
    <Box className="w-full flex items-center justify-center min-h-screen p-4">
      <Box className="bg-white shadow-lg rounded-xl p-8 w-full max-w-md">
        <Typography variant="h5" className="text-center font-semibold mb-6">
          Change Password
        </Typography>

        <TextField
          label="Email"
          value={user.email}
          fullWidth
          disabled
          margin="normal"
        />

        <TextField
          label="Old Password"
          type="password"
          value={oldPass}
          onChange={(e) => setOldPass(e.target.value)}
          fullWidth
          margin="normal"
        />

        <TextField
          label="New Password"
          type="password"
          placeholder="Must include uppercase, lowercase, number & symbol."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          margin="normal"
        />

        <TextField
          label="Confirm Password"
          type="password"
          value={confirmPass}
          onChange={(e) => setConfirmPass(e.target.value)}
          fullWidth
          margin="normal"
        />

        {error && (
          <Typography color="error" variant="caption" className="mt-2 block">
            {error}
          </Typography>
        )}

        <Button
          variant="contained"
          fullWidth
          disabled={isPending}
          onClick={handleSubmit}
          className="mt-4"
        >
          {isPending ? "Updating..." : "Update Password"}
        </Button>
      </Box>
    </Box>
  );
}
