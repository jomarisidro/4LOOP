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

  // 🧾 Fetch only completed requests
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['release-requests'],
    queryFn: async () => {
      const onlinerequest = await getSanitationOnlineRequest();
      const allRequests = [...(onlinerequest?.data || [])];
      const completed = allRequests.filter((req) => req.status === 'completed');
      const uniqueRequests = Array.from(
        new Map(completed.map((req) => [req._id, req])).values()
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
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    if (data) setRequests(data);
  }, [data]);

  // 🟢 Handle opening request for release
  const handleOpen = async (_id) => {
    const releaseRequest = requests.find((req) => req._id === _id);
    if (!releaseRequest) return;

    try {

      // ✅ store id consistently like in PermitApprovalForm
      localStorage.setItem('releaseRequestId', _id);
      router.push(`/officers/workbench/releaseofpermit?id=${_id}`);
    } catch (err) {
      console.error('❌ Failed to navigate for release:', err);
    }

    // Optional cleanup & refresh
    setRequests((prev) => prev.filter((req) => req._id !== _id));
    queryClient.invalidateQueries(['release-requests']);
  };

  // 🔽 Sorting logic
  const handleSort = (key) => {
    if (key === 'actions') return;
    setSortConfig((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  };

  // 🔍 Filter + search
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      const value = req?.[searchField]?.toString().toLowerCase() ?? '';
      return value.includes(searchTerm.toLowerCase());
    });
  }, [requests, searchField, searchTerm]);

  // 🔽 Sort results
  const sortedRequests = useMemo(() => {
    return [...filteredRequests].sort((a, b) => {
      if (!sortConfig.key) return 0;

      let aValue = a?.[sortConfig.key];
      let bValue = b?.[sortConfig.key];

      if (sortConfig.key === 'createdAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else {
        aValue = aValue?.toString().toLowerCase() ?? '';
        bValue = bValue?.toString().toLowerCase() ?? '';
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredRequests, sortConfig]);

  // 📄 Pagination logic
  const total = sortedRequests.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const paginatedRequests = sortedRequests.slice(startIndex, startIndex + limit);

  // 📋 Search field options
  const searchFields = [
    { value: 'businessName', label: 'Business Name' },
    { value: 'bidNumber', label: 'BID Number' },
    { value: 'requestType', label: 'Request Type' },
    { value: 'businessNickname', label: 'Trade Name' },
    { value: 'businessType', label: 'Business Type' },
    { value: 'businessAddress', label: 'Address' },
  ];

  // 🧱 Table columns
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
        🧾 Requests Awaiting Release of Permit
      </Typography>

      {/* 🔍 Search + Filter */}
      <Stack direction="row" spacing={2} mb={3} alignItems="center">
        <TextField
          select
          label="Search Field"
          value={searchField}
          onChange={(e) => {
            setSearchField(e.target.value);
            setPage(1);
          }}
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
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          fullWidth
        />

        <TextField
          select
          label="Rows per page"
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
          sx={{ width: 160 }}
        >
          {[10, 20, 30, 50].map((num) => (
            <MenuItem key={num} value={num}>
              {num}
            </MenuItem>
          ))}
        </TextField>
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

      {/* 📊 Table */}
      {!isLoading && !isError && (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  {columns.map((col) => (
                    <TableCell
                      key={col.key}
                      sx={{
                        fontWeight: 'bold',
                        cursor: col.key === 'actions' ? 'default' : 'pointer',
                      }}
                      onClick={
                        col.key === 'actions'
                          ? undefined
                          : () => handleSort(col.key)
                      }
                    >
                      {col.key !== 'actions' ? (
                        <TableSortLabel
                          active={sortConfig.key === col.key}
                          direction={
                            sortConfig.key === col.key
                              ? sortConfig.direction
                              : 'asc'
                          }
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
                {paginatedRequests.length > 0 ? (
                  paginatedRequests.map((req) => (
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
                          onClick={() => handleOpen(req._id)}
                        >
                          Open Request
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} align="center">
                      No completed requests awaiting release.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* 📄 Pagination */}
          {!isLoading && !isError && total > 0 && (
            <Stack
              direction="row"
              spacing={2}
              justifyContent="flex-end"
              alignItems="center"
              sx={{ mt: 2 }}
            >
              <Typography variant="body2" sx={{ mr: 2 }}>
                Page {page} of {totalPages || 1}
              </Typography>

              <Button
                variant="outlined"
                size="small"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                sx={{ mr: 1 }}
              >
                Prev
              </Button>
              <Button
                variant="outlined"
                size="small"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
              >
                Next
              </Button>
            </Stack>
          )}
        </>
      )}
    </Box>
  );
}
