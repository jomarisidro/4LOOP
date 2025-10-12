'use client';

import { getSanitationOnlineRequest } from '@/app/services/OnlineRequest';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Typography,
  Box,
  Button,
  Stack,
  CircularProgress,
  Paper,
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

export default function ComplianceForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['compliance-requests'],
    queryFn: async () => {
      const onlinerequest = await getSanitationOnlineRequest();
      const allRequests = [...(onlinerequest?.data || [])];
      const pending = allRequests.filter((req) => req.status === 'pending2');
      const uniqueRequests = Array.from(
        new Map(pending.map((req) => [req._id, req])).values()
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

  const handleEncode = async (_id) => {
    const compliance = requests.find((req) => req._id === _id);
    if (!compliance) return;

    try {
      localStorage.setItem('complianceRequestId', _id);
      router.push(`/officers/workbench/complianceonlinerequest?id=${_id}`);
    } catch (err) {
      console.error('❌ Failed to navigate for compliance:', err);
    }

    // Optimistically remove from list
    setRequests((prev) => prev.filter((req) => req._id !== _id));

    // Trigger background refetch for consistency
    queryClient.invalidateQueries(['compliance-requests']);
  };

  const handleSort = (key) => {
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  };

  // 🔍 Search + filter
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

  const searchFields = [
    { value: 'businessName', label: 'Business Name' },
    { value: 'bidNumber', label: 'BID Number' },
    { value: 'requestType', label: 'Request Type' },
    { value: 'businessNickname', label: 'Trade Name' },
    { value: 'businessType', label: 'Business Type' },
    { value: 'businessAddress', label: 'Address' },
  ];

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
      <Button
        variant="outlined"
        color="secondary"
        onClick={() => router.push('/officers/workbench')}
        sx={{ mb: 2 }}
      >
        ← Back to Workbench
      </Button>

      <Typography variant="h6" fontWeight="bold" mb={3}>
        🧾 Requests Awaiting Compliance
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

      {/* ⏳ Loading */}
      {isLoading && (
        <Stack alignItems="center" mt={4}>
          <CircularProgress />
          <Typography mt={2}>Loading compliance requests...</Typography>
        </Stack>
      )}

      {/* ❌ Error */}
      {isError && (
        <Typography color="error" mt={2}>
          Error loading requests: {error?.message || 'Unknown error'}
        </Typography>
      )}

      {/* 📊 Table */}
      {!isLoading && !isError && (
        <TableContainer component={Paper}>
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
                  <TableRow key={req._id} hover>
                    <TableCell>{req.requestType}</TableCell>
                    <TableCell>{req.bidNumber}</TableCell>
                    <TableCell>{req.businessName}</TableCell>
                    <TableCell>{req.businessNickname}</TableCell>
                    <TableCell>{req.businessType}</TableCell>
                    <TableCell>{req.businessAddress}</TableCell>
                    <TableCell>
                      {new Date(req.createdAt).toLocaleString('en-PH')}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        onClick={() => handleEncode(req._id)}
                      >
                        Encode
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No requests awaiting compliance.
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
