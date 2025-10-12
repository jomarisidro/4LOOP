'use client';

import {
  Typography,
  Paper,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TableHead,
  TextField,
  MenuItem,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { getSanitationOnlineRequest } from '@/app/services/OnlineRequest';

export default function ViewPendingForm() {
  const { data } = useQuery({
    queryKey: ['pending-requests'],
    queryFn: async () => {
      const onlinerequest = await getSanitationOnlineRequest();
      const allRequests = [...(onlinerequest?.data || [])];

      // ✅ Include any pending status
      const pendingStatuses = ['pending', 'pending2', 'pending3'];
      const pending = allRequests.filter(req =>
        pendingStatuses.includes(req.status)
      );

      // ✅ Remove duplicates
      const uniqueRequests = Array.from(
        new Map(pending.map(req => [`${req._id}`, req])).values()
      );
      return uniqueRequests;
    },
    refetchInterval: 5000,
  });

  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('businessName');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');

  useEffect(() => {
    if (data) setRequests(data);
  }, [data]);

  const fields = [
    { label: 'BID Number', field: 'bidNumber' },
    { label: 'Company Name', field: 'businessName' },
    { label: 'Trade Name', field: 'businessNickname' },
    { label: 'Business Type', field: 'businessType' },
    { label: 'Address', field: 'businessAddress' },
    { label: 'Request Type', field: 'requestType' },
    { label: 'Status', field: 'status' },
    { label: 'Submitted On', field: 'createdAt' },
  ];

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // ✅ Filter by search term
  const filteredRequests = requests.filter((req) => {
    const value = req[searchField];
    if (!value) return false;
    const term = searchTerm.toLowerCase().trim();
    return String(value).toLowerCase().includes(term);
  });

  // ✅ Sort
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (!sortField) return 0;
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    } else if (sortField === 'createdAt') {
      return sortDirection === 'asc'
        ? new Date(aValue) - new Date(bValue)
        : new Date(bValue) - new Date(aValue);
    } else {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
  });

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        <b>Pending Requests</b>
      </Typography>

      {/* 🔍 Search Controls */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          select
          label="Search Field"
          value={searchField}
          onChange={(e) => setSearchField(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          {fields.map(({ label, field }) => (
            <MenuItem key={field} value={field}>
              {label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          fullWidth
          label={`Search by ${fields.find(f => f.field === searchField)?.label}`}
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </Box>

      {/* 📋 Table Display */}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {fields.map(({ label, field }) => (
                <TableCell
                  key={field}
                  onClick={() => handleSort(field)}
                  sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                >
                  {label}
                  {sortField === field && (sortDirection === 'asc' ? ' 🔼' : ' 🔽')}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {sortedRequests.length > 0 ? (
              sortedRequests.map((req) => (
                <TableRow key={req._id}>
                  {fields.map(({ field }) => (
                    <TableCell key={field}>
                      {field === 'createdAt'
                        ? new Date(req[field]).toLocaleString('en-PH')
                        : req[field]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={fields.length} align="center">
                  No pending requests found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
