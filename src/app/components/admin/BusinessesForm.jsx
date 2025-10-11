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
} from '@mui/material';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAddOwnerBusiness } from '@/app/services/BusinessService';

export default function BusinessesForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['business-list'],
    queryFn: () => getAddOwnerBusiness(),
  });

  const [businesses, setBusinesses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState('businessName');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [newId, setNewId] = useState(null);
  const [newBusiness, setNewBusiness] = useState({});

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

  const filteredBusinesses = businesses
    .filter((business) => {
      const value = business[searchField];
      if (!value) return false;
      return String(value).toLowerCase().includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => {
      if (!sortField) return 0;
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

  return (
    <Paper elevation={2} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom><b>Business Details</b></Typography>

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
            {filteredBusinesses.map((business) => (
              <TableRow key={business._id}>
                {fields.map(({ field }) => (
                  <TableCell key={field}>
                    {newId === business._id && field !== 'createdAt' && field !== 'updatedAt' ? (
                      <TextField
                        fullWidth
                        value={newBusiness[field] || business[field] || ''}
                        onChange={(e) =>
                          setNewBusiness({ ...newBusiness, [field]: e.target.value })
                        }
                      />
                    ) : field === 'createdAt' || field === 'updatedAt' ? (
                      new Date(business[field]).toLocaleString('en-PH')
                    ) : (
                      business[field]
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
