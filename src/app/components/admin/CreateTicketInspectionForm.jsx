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

export default function InspectionTicketForm() {
  const router = useRouter();

  const { data, refetch } = useQuery({
    queryKey: ['business-list'],
    queryFn: () => getAddOwnerBusiness(),
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredBusinesses, setFilteredBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [openConfirm, setOpenConfirm] = useState(false);

  // active ticket + business lock
  const [activeTicket, setActiveTicket] = useState(null);
  const [activeBusinessId, setActiveBusinessId] = useState(null);

  // inline form fields
  const [inspectionDate, setInspectionDate] = useState('');
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (data?.data) {
      setFilteredBusinesses(data.data);
    }
  }, [data]);

  useEffect(() => {
    if (data?.data) {
      const filtered = data.data.filter(
        (b) =>
          b.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          b.bidNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBusinesses(filtered);
    }
  }, [searchTerm, data]);

  const handleOpenConfirm = (business) => {
    setSelectedBusiness(business);
    setOpenConfirm(true);
  };

  const handleCloseConfirm = () => {
    setSelectedBusiness(null);
    setOpenConfirm(false);
  };

  const handleCreateTicket = async () => {
    if (!selectedBusiness) return;
    try {
      const response = await axios.post('/api/ticket', {
        businessId: selectedBusiness._id,
        inspectionDate: new Date().toISOString(),
        inspectionStatus: 'none',
      });

      const ticket = response.data.ticket;

      handleCloseConfirm();
      refetch();

      setActiveTicket(ticket);
      setActiveBusinessId(selectedBusiness._id);
    } catch (error) {
      console.error('Error creating inspection ticket:', error);
    }
  };

  const handleCancelInspection = async (ticketId) => {
    try {
      await axios.put(`/api/ticket/${ticketId}`, {
        inspectionStatus: 'none',
      });
      refetch();
      setActiveTicket(null);
      setActiveBusinessId(null);
    } catch (error) {
      console.error('Error cancelling inspection:', error);
    }
  };

  const handleSaveInspection = async () => {
    if (!activeTicket) return;
    try {
      await axios.put(`/api/ticket/${activeTicket._id}`, {
        inspectionStatus: 'pending',
        inspectionDate,
        remarks,
      });
      refetch();
      alert('Inspection details saved.');

      setInspectionDate('');
      setRemarks('');
      setActiveTicket(null);
      setActiveBusinessId(null);
    } catch (error) {
      console.error('Error saving inspection details:', error);
    }
  };

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
              <TableCell>Inspection Count (2025)</TableCell> {/* ✅ new */}
              <TableCell>Violation</TableCell> {/* ✅ new */}
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredBusinesses.map((business) => {
              const isDisabled =
                activeBusinessId && activeBusinessId !== business._id;
              return (
                <TableRow
                  key={business._id}
                  style={{
                    opacity: isDisabled ? 0.4 : 1,
                    pointerEvents: isDisabled ? 'none' : 'auto',
                  }}
                >
                  <TableCell>{business.bidNumber}</TableCell>
                  <TableCell>{business.businessName}</TableCell>
                  <TableCell>{business.businessType}</TableCell>
                  <TableCell>{business.contactPerson}</TableCell>
                  <TableCell>{business.inspectionStatus || 'none'}</TableCell>
                  <TableCell>{business.inspectionCountThisYear ?? 0}</TableCell> {/* ✅ show count */}
                  <TableCell>{business.recordedViolation || '-'}</TableCell> {/* ✅ show violation */}
                  <TableCell>
                    {business.inspectionStatus === 'pending' ? (
                      <Button
                        variant="contained"
                        size="small"
                        sx={{ backgroundColor: 'yellow', color: 'black', fontWeight: 'bold' }}
                        onClick={() => router.push('/officers/inspections/pendinginspections')}
                        disabled={isDisabled}
                      >
                        Pending Inspection
                      </Button>
                    ) : business.inspectionStatus === 'completed' ? (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleOpenConfirm(business)} // ✅ add click handler here
                      >
                        Create Inspection
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleOpenConfirm(business)}
                        disabled={isDisabled}
                      >
                        Create Inspection
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Confirmation Dialog */}
      <Dialog open={openConfirm} onClose={handleCloseConfirm}>
        <DialogTitle>Confirm Inspection</DialogTitle>
        <DialogContent>
          Are you sure you want to create an inspection for{' '}
          <strong>{selectedBusiness?.businessName}</strong>?
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirm}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateTicket}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Inline Inspection Form */}
      {activeTicket && (
        <Box mt={4} p={3} border="1px solid #ccc" borderRadius={2}>
          <Typography variant="h6" mb={2}>
            Inspection Form for {activeTicket.ticketNumber}
          </Typography>

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
            sx={{ mb: 2 }}
          />

          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveInspection}
            >
              Save Inspection
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => handleCancelInspection(activeTicket._id)}
            >
              Cancel Inspection
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
