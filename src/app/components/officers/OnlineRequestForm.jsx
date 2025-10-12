'use client';

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Typography,
  Box,
  Paper,
  Button,
  Stack,
  CircularProgress,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TableSortLabel,
  TextField,
  MenuItem,
} from '@mui/material';
import { getSanitationOnlineRequest } from '@/app/services/OnlineRequest';

export default function OnlineRequestsForm() {
  const router = useRouter();

  // 🧩 Fetch all online requests
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['online-request'],
    queryFn: async () => {
      const onlinerequest = await getSanitationOnlineRequest();
      const allRequests = [...(onlinerequest?.data || [])];
      // Only include those with "submitted" status
      return allRequests.filter((req) => req.status === 'submitted');
    },
    refetchInterval: 5000, // live updates every 5 seconds
  });

  // 🧠 State for search and sorting
  const [requests, setRequests] = useState([]);
  const [searchField, setSearchField] = useState('businessName');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  useEffect(() => {
    if (data) setRequests(data);
  }, [data]);

  const handleOpenRequest = (_id) => {
    if (!_id) return;
    router.push(`/officers/workbench/acceptedonlinerequest?id=${_id}`);
  };

  // 🔍 Search logic
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const value = req?.[searchField]?.toString().toLowerCase() ?? '';
      return value.includes(searchTerm.toLowerCase());
    });
  }, [requests, searchField, searchTerm]);

  // 🔽 Sorting logic
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

  const handleSort = (key) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  };

  const searchFields = [
    { value: 'businessName', label: 'Business Name' },
    { value: 'bidNumber', label: 'BID Number' },
    { value: 'requestType', label: 'Request Type' },
    { value: 'businessNickname', label: 'Trade Name' },
    { value: 'businessType', label: 'Business Type' },
    { value: 'businessAddress', label: 'Address' },
  ];

  // 🧾 Columns configuration
  const columns = [
    { key: 'requestType', label: 'Request Type' },
    { key: 'bidNumber', label: 'BID Number' },
    { key: 'businessName', label: 'Business Name' },
    { key: 'businessNickname', label: 'Trade Name' },
    { key: 'businessType', label: 'Business Type' },
    { key: 'businessAddress', label: 'Address' },
    { key: 'createdAt', label: 'Submitted On' },
    { key: 'actions', label: 'Action' },
  ];

  return (
    <Box p={3}>
      {/* 🔙 Back Button */}
      <Button variant="outlined" onClick={() => router.push('/officers/workbench')} sx={{ mb: 2 }}>
        ← Back
      </Button>

      {/* 🚀 Quick Navigation */}
      <Stack direction="row" spacing={2} sx={{ position: 'absolute', top: 16, right: 16 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => router.push('/officers/workbench/verification')}
        >
          Go to Verifications
        </Button>
      </Stack>

      {/* 🧾 Title */}
      <Typography variant="h6" fontWeight="bold" mb={3} mt={5}>
        📄 View Online Requests
      </Typography>

      {/* 🔍 Search Controls */}
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
          label={`Search by ${searchFields.find((f) => f.value === searchField)?.label}`}
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
        />
      </Stack>

      {/* ⏳ Loading State */}
      {isLoading && (
        <Stack alignItems="center" mt={4}>
          <CircularProgress />
          <Typography variant="body2" mt={2}>
            Loading online requests...
          </Typography>
        </Stack>
      )}

      {/* ❌ Error State */}
      {isError && (
        <Typography color="error" mt={2}>
          Error fetching requests: {error?.message || 'Unknown error'}
        </Typography>
      )}

      {/* 📋 Data Table */}
      {!isLoading && !isError && (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    {col.key !== 'actions' ? (
                      <TableSortLabel
                        active={sortConfig.key === col.key}
                        direction={sortConfig.key === col.key ? sortConfig.direction : 'asc'}
                        onClick={() => handleSort(col.key)}
                      >
                        {col.label}
                      </TableSortLabel>
                    ) : (
                      col.label
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {sortedRequests.length > 0 ? (
                sortedRequests.map((req) => (
                  <TableRow key={req._id || Math.random()} hover>
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
                    <TableCell>
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => handleOpenRequest(req._id)}
                      >
                        Open
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No matching online requests found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
