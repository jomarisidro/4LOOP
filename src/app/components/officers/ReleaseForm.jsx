'use client';
import { getSanitationOnlineRequest } from '@/app/services/OnlineRequest';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Typography,
  Box,
  Paper,
  Button,
  Stack,
  CircularProgress,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
} from '@mui/material';

export default function ReleaseForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['release-requests'],
    queryFn: async () => {
      const onlinerequest = await getSanitationOnlineRequest();
      const allRequests = [...(onlinerequest?.data || [])];
      const completed = allRequests.filter((req) => req.status === 'completed');
      const uniqueRequests = Array.from(
        new Map(completed.map((req) => [`${req._id}`, req])).values()
      );
      return uniqueRequests;
    },
    refetchInterval: 5000,
  });

  const [requests, setRequests] = useState([]);
  const [searchField, setSearchField] = useState('businessName');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({
    key: 'createdAt',
    direction: 'desc',
  });

  useEffect(() => {
    if (data) setRequests(data);
  }, [data]);

  const handleVerify = async (_id) => {
    const release = requests.find((req) => req._id === _id);
    if (!release) return;

    try {
      await fetch(`/api/officer/${_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });

      localStorage.setItem('releaseRequestId', _id);
      router.push(`/officers/workbench/releaseofpermit?id=${_id}`);
    } catch (err) {
      console.error('❌ Failed to update status:', err);
    }

    setRequests((prev) => prev.filter((req) => req._id !== _id));
    queryClient.invalidateQueries(['release-requests']);
  };

  // 🔍 Search
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const value = req?.[searchField]?.toString().toLowerCase() ?? '';
      return value.includes(searchTerm.toLowerCase());
    });
  }, [requests, searchField, searchTerm]);

  // 🔽 Sort
  const sortedRequests = useMemo(() => {
    return [...filteredRequests].sort((a, b) => {
      if (!sortConfig.key) return 0;
      const aValue = a?.[sortConfig.key]?.toString().toLowerCase() ?? '';
      const bValue = b?.[sortConfig.key]?.toString().toLowerCase() ?? '';
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredRequests, sortConfig]);

  const handleSortChange = (field) => {
    setSortConfig((prev) => ({
      key: field,
      direction:
        prev.key === field && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const searchFields = [
    { value: 'businessName', label: 'Business Name' },
    { value: 'bidNumber', label: 'BID Number' },
    { value: 'requestType', label: 'Request Type' },
    { value: 'businessNickname', label: 'Trade Name' },
    { value: 'businessType', label: 'Business Type' },
    { value: 'businessAddress', label: 'Address' },
  ];

  return (
    <Box p={3}>
      {/* 🔙 Back Button */}
      <Button
        variant="outlined"
        color="secondary"
        onClick={() => router.push('/officers/workbench')}
        sx={{ mb: 2 }}
      >
        ← Back to Workbench
      </Button>

      <Typography variant="h6" fontWeight="bold" mb={3}>
        🧾 Requests Awaiting to be Released
      </Typography>

      {/* 🔍 Search & Sort Controls */}
      <Stack direction="row" spacing={2} mb={3}>
        <TextField
          select
          label="Search Field"
          value={searchField}
          onChange={(e) => setSearchField(e.target.value)}
          sx={{ width: 220 }}
        >
          {searchFields.map((f) => (
            <MenuItem key={f.value} value={f.value}>
              {f.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label={`Search by ${
            searchFields.find((f) => f.value === searchField)?.label
          }`}
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
        />
      </Stack>

      {/* ⏳ Loading */}
      {isLoading && (
        <Stack alignItems="center" mt={4}>
          <CircularProgress />
          <Typography mt={2}>Loading release requests...</Typography>
        </Stack>
      )}

      {/* ❌ Error */}
      {isError && (
        <Typography color="error" mt={2}>
          Error loading requests: {error?.message || 'Unknown error'}
        </Typography>
      )}

      {/* 🗂️ Table */}
      {!isLoading && !isError && sortedRequests.length > 0 ? (
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                {[
                  { key: 'requestType', label: 'Request Type' },
                  { key: 'bidNumber', label: 'BID Number' },
                  { key: 'businessName', label: 'Company Name' },
                  { key: 'businessNickname', label: 'Trade Name' },
                  { key: 'businessType', label: 'Business Type' },
                  { key: 'businessAddress', label: 'Address' },
                  { key: 'createdAt', label: 'Submitted On' },
                ].map((col) => (
                  <TableCell key={col.key}>
                    <TableSortLabel
                      active={sortConfig.key === col.key}
                      direction={
                        sortConfig.key === col.key ? sortConfig.direction : 'asc'
                      }
                      onClick={() => handleSortChange(col.key)}
                    >
                      <b>{col.label}</b>
                    </TableSortLabel>
                  </TableCell>
                ))}
                <TableCell align="center">
                  <b>Action</b>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedRequests.map((req) => (
                <TableRow
                  key={req._id}
                  hover
                  sx={{
                    '&:hover': { backgroundColor: '#f9f9f9' },
                  }}
                >
                  <TableCell>{req.requestType}</TableCell>
                  <TableCell>{req.bidNumber}</TableCell>
                  <TableCell>{req.businessName}</TableCell>
                  <TableCell>{req.businessNickname}</TableCell>
                  <TableCell>{req.businessType}</TableCell>
                  <TableCell>{req.businessAddress}</TableCell>
                  <TableCell>
                    {req.createdAt
                      ? new Date(req.createdAt).toLocaleString('en-PH')
                      : 'N/A'}
                  </TableCell>
                  <TableCell align="center">
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleVerify(req._id)}
                    >
                      Open Request
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        !isLoading &&
        !isError && (
          <Typography mt={4} color="text.secondary">
            No completed requests awaiting release.
          </Typography>
        )
      )}
    </Box>
  );
}
