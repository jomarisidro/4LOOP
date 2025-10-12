'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Typography,
  TextField,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { getAddOwnerBusiness } from '@/app/services/BusinessService';
import axios from 'axios';

function formatViolationCode(code) {
  if (!code) return '';
  return code
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}


export default function CreateTicketInspectionForm() {
  const router = useRouter();
  const currentYear = new Date().getFullYear();

  // Fetch all businesses
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['business-list'],
    queryFn: () => getAddOwnerBusiness(),
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [inspectionCounts, setInspectionCounts] = useState({}); // { businessId: count }
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [inspectionDate, setInspectionDate] = useState('');
  const [remarks, setRemarks] = useState('');

  // Filter businesses by search
  useEffect(() => {
    if (data?.data) setFilteredBusinesses(data.data);
  }, [data]);

useEffect(() => {
  if (data?.data) {
    const filtered = data.data.filter((b) => {
      const matchesSearch =
        b.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.bidNumber.toLowerCase().includes(searchTerm.toLowerCase());

      // Apply the new business visibility rules:
      const isEligible =
        (b.requestType === 'new' && b.onlineRequest?.status === 'completed') ||
        (b.requestType === 'renewal');

      return matchesSearch && isEligible;
    });

    setFilteredBusinesses(filtered);
  }
}, [searchTerm, data]);


  // Fetch inspection info for each business
  // Fetch inspection + violation info for each business
  useEffect(() => {
  async function fetchInspectionInfo() {
    if (!data?.data) return;

    const info = {};
    await Promise.all(
      data.data.map(async (b) => {
        try {
          const ticketRes = await axios.get(`/api/ticket?businessId=${b._id}&year=${currentYear}`);
          const tickets = ticketRes.data || [];

          const completedCount = tickets.filter(t => t.inspectionStatus === 'completed').length;
          const hasPending = tickets.some(t => t.inspectionStatus === 'pending');

          const violationRes = await axios.get(`/api/violation?businessId=${b._id}`);
          const violations = violationRes.data || [];
          const activeViolation = violations.find(v => v.status === 'pending');

          info[b._id] = {
            completedCount,
            hasPending,
        violation: activeViolation
  ? `${formatViolationCode(activeViolation.code)} — ₱${activeViolation.penalty.toLocaleString()} (${activeViolation.status})`
  : null,


          };
        } catch {
          info[b._id] = { completedCount: 0, hasPending: false, violation: null };
        }
      })
    );

    setInspectionCounts(info);
  }

  fetchInspectionInfo();
}, [data, currentYear, refetch]);




  const handleOpenConfirm = (business) => {
    setSelectedBusiness(business);
    setOpenConfirm(true);
    setInspectionDate(new Date().toISOString().split('T')[0]);
    setRemarks('');
  };

  const handleCloseConfirm = () => {
    setSelectedBusiness(null);
    setOpenConfirm(false);
    setInspectionDate('');
    setRemarks('');
  };

  const handleSaveInspection = async () => {
    if (!selectedBusiness || !inspectionDate) return;

    try {
      await axios.post(
        '/api/ticket',
        {
          businessId: selectedBusiness._id,
          inspectionDate,
          remarks,
          inspectionStatus: 'pending',
        },
        { withCredentials: true }
      );

      alert('✅ Inspection ticket created and saved!');
      handleCloseConfirm();
      refetch();
    } catch (error) {
      console.error('Error saving inspection:', error.response?.data || error);
      alert('❌ Failed to save inspection.');
    }
  };

  const handleViewStatus = async (business) => {
    try {
      const res = await axios.get(`/api/ticket?businessId=${business._id}`);
      const tickets = res.data || [];

      if (!tickets.length) {
        alert('❌ No tickets found for this business.');
        return;
      }

      // Navigate to the first pending or latest completed inspection
      const ticketToView =
        tickets.find((t) => t.inspectionStatus === 'pending') ||
        tickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];

      if (!ticketToView?._id) {
        alert('❌ No valid inspection ticket found.');
        return;
      }

      router.push(
        `/officers/inspections/pendinginspections/inspectingcurrentbusiness?id=${ticketToView._id}`
      );
    } catch (err) {
      console.error('Error fetching tickets:', err);
      alert('⚠️ Failed to load ticket status.');
    }
  };

  if (isLoading) return <Typography>Loading businesses…</Typography>;

  return (
    <Box p={4}>
      <Typography variant="h6" fontWeight="bold" mb={2}>
        🧾 Select Business for Inspection
      </Typography>

      <Button
        variant="outlined"
        onClick={() => router.push('/officers/inspections')}
        sx={{ mb: 3 }}
      >
        ← Back to Inspections Workbench
      </Button>

      <TextField
        label="Search Business"
        variant="outlined"
        fullWidth
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>BID Number</TableCell>
              <TableCell>Business Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Inspection Count ({currentYear})</TableCell>
              <TableCell>Violation</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredBusinesses.map((business) => {
              const inspectionInfo = inspectionCounts[business._id] || { completedCount: 0, hasPending: false };
              const completedInspections = inspectionInfo.completedCount;
              const pendingTicketExists = inspectionInfo.hasPending;
              const reachedLimit = completedInspections >= 2;


              return (
                <TableRow key={business._id}>
                  <TableCell>{business.bidNumber}</TableCell>
                  <TableCell>{business.businessName}</TableCell>
                  <TableCell>{business.businessType}</TableCell>
                  <TableCell>{business.contactPerson}</TableCell>
                  <TableCell>{business.inspectionStatus || 'none'}</TableCell>
                  <TableCell>{completedInspections}</TableCell>
                  <TableCell>
                    {inspectionCounts[business._id]?.violation
                      ? `⚠️ ${inspectionCounts[business._id].violation}`
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => {
                          if (pendingTicketExists) handleViewStatus(business);
                          else if (!reachedLimit) handleOpenConfirm(business);
                        }}
                        disabled={pendingTicketExists || reachedLimit}
                        color={pendingTicketExists ? 'warning' : 'primary'}
                      >
                        {pendingTicketExists
                          ? 'Pending Inspection'
                          : reachedLimit
                            ? 'Max Inspections'
                            : 'Create Inspection'}
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        color="info"
                        onClick={() => handleViewStatus(business)}
                      >
                        View Status
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Inline Inspection Form */}
      <Dialog open={!!selectedBusiness} onClose={handleCloseConfirm}>
        <DialogTitle>Inspection Form for {selectedBusiness?.businessName}</DialogTitle>
        <DialogContent>
          <TextField
            label="Inspection Date"
            type="date"
            fullWidth
            InputLabelProps={{ shrink: true }}
            value={inspectionDate}
            onChange={(e) => setInspectionDate(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Remarks"
            fullWidth
            multiline
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirm}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveInspection}
            disabled={!inspectionDate}
          >
            Save Inspection
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
