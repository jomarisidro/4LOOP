'use client';

import {
  Typography,
  Paper,
  Stack,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  TableHead,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';

import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getAddOwnerBusiness } from '@/app/services/BusinessService';

export default function BusinessesForm() {
  const router = useRouter();

  const { data } = useQuery({
    queryKey: ['business-list'],
    queryFn: () => getAddOwnerBusiness(),
  });

  const [businesses, setBusinesses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('businessName');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    if (data?.data) {
      setBusinesses(data.data);
    }
  }, [data]);

  const fields = [
    { label: 'BID Number', field: 'bidNumber' },
    { label: 'Name of Company', field: 'businessName' },
    { label: 'Trade Name', field: 'businessNickname' },
    { label: 'Line of Business', field: 'businessType' },
    { label: 'Business Address', field: 'businessAddress' },
    { label: 'Landmark', field: 'landmark' },
    { label: 'Contact Person', field: 'contactPerson' },
    { label: 'Contact Number', field: 'contactNumber' },
    { label: 'Status', field: 'status' },
    { label: 'Date Created', field: 'createdAt' },
    { label: 'Date Updated', field: 'updatedAt' },
  ];

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredBusinesses = useMemo(() => {
    let result = [...businesses];

    // 🔍 Search filter (instant)
    if (searchTerm) {
      result = result.filter((business) => {
        const value = business[searchField];
        return value
          ? String(value).toLowerCase().includes(searchTerm.toLowerCase())
          : false;
      });
    }

    // ↕️ Sorting
    if (sortField) {
      result.sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (valA == null) return 1;
        if (valB == null) return -1;
        if (typeof valA === 'string') {
          return sortDirection === 'asc'
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      });
    }

    return result;
  }, [businesses, searchTerm, searchField, sortField, sortDirection]);

  // Pagination
  const startIndex = (page - 1) * limit;
  const paginatedBusinesses = filteredBusinesses.slice(
    startIndex,
    startIndex + limit
  );

  const total = filteredBusinesses.length;
  const totalPages = Math.ceil(total / limit);

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        <b>Business Details</b>
      </Typography>

      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
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
          label={`Search by ${fields.find((f) => f.field === searchField)?.label}`}
          variant="outlined"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1); // Reset to first page when typing
          }}
        />

        <FormControl sx={{ width: 120 }}>
          <InputLabel>Rows per page</InputLabel>
          <Select
            value={limit}
            label="Rows per page"
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
          >
            {[10, 20, 30, 50].map((size) => (
              <MenuItem key={size} value={size}>
                {size}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>

      <Typography variant="body2" sx={{ mb: 1, fontStyle: 'italic' }}>
        Showing {startIndex + 1}–{Math.min(startIndex + limit, total)} of {total}{' '}
        businesses
      </Typography>

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
            {paginatedBusinesses.map((business) => (
              <TableRow key={business._id}>
                {fields.map(({ field }) => (
                  <TableCell key={field}>
                    {field === 'createdAt' || field === 'updatedAt'
                      ? new Date(business[field]).toLocaleString('en-PH')
                      : business[field]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination Controls */}
      <Stack
        direction="row"
        spacing={2}
        justifyContent="flex-end"
        alignItems="center"
        sx={{ mt: 2 }}
      >
        <Typography variant="body2">
          Page {page} of {totalPages || 1}
        </Typography>

        <Box>
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            style={{ marginRight: '8px' }}
          >
            Prev
          </button>
          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </Box>
      </Stack>
    </Paper>
  );
}
