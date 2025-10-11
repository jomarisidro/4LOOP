'use client';

import { useRouter } from 'next/navigation';
import {
  Typography,
  Box,
  Button,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Checkbox,
  FormControlLabel,
  TextField,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import axios from 'axios';

export default function PendingInspectionsForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: pendingData } = useQuery({
    queryKey: ['pending-inspections'],
    queryFn: async () => {
      const res = await axios.get('/api/ticket?status=pending');
      return res.data;
    },
  });

  const [activeTicket, setActiveTicket] = useState(null);
  const [checklist, setChecklist] = useState({
    sanitaryPermit: null,
    healthCert: null,
    displaySanitary: null,
    displayHealth: null,
  });
  const [remarks, setRemarks] = useState('');

  const handleBack = () => {
    router.push('/officers/inspections');
  };

  // Cancels inspection in backend (from table row)
  const handleCancelInspection = async (ticketId) => {
    try {
      await axios.put(`/api/ticket/${ticketId}`, {
        inspectionStatus: 'none',
      });
      queryClient.invalidateQueries(['pending-inspections']);
      setActiveTicket(null);
    } catch (err) {
      console.error('Error cancelling inspection:', err);
    }
  };

  // Completes inspection
  const handleCompleteInspection = async () => {
    if (!activeTicket) return;
    try {
      await axios.put(`/api/ticket/${activeTicket._id}`, {
        inspectionStatus: 'completed',
        remarks,
        checklist,
      });
      queryClient.invalidateQueries(['pending-inspections']);
      setActiveTicket(null);
      setChecklist({
        sanitaryPermit: null,
        healthCert: null,
        displaySanitary: null,
        displayHealth: null,
      });
      setRemarks('');
    } catch (err) {
      console.error('Error completing inspection:', err);
    }
  };

  const handleChecklistChange = (field, value) => {
    setChecklist((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Box position="relative" p={4}>
      <Button variant="outlined" onClick={handleBack} sx={{ mb: 2 }}>
        ← Back
      </Button>

      <Typography variant="h6" fontWeight="bold" mb={4}>
        🧾 Pending Inspection Tickets
      </Typography>

      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Ticket #</TableCell>
              <TableCell>BID #</TableCell>
              <TableCell>Business Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Remarks</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pendingData?.length > 0 ? (
              pendingData.map((ticket) => {
                const isDisabled =
                  activeTicket && activeTicket._id !== ticket._id;
                return (
                  <TableRow
                    key={ticket._id}
                    style={{
                      opacity: isDisabled ? 0.4 : 1,
                      pointerEvents: isDisabled ? 'none' : 'auto',
                    }}
                  >
                    <TableCell>{ticket.ticketNumber}</TableCell>
                    <TableCell>{ticket.business?.bidNumber}</TableCell>
                    <TableCell>{ticket.business?.businessName}</TableCell>
                    <TableCell>{ticket.inspectionType}</TableCell>
                    <TableCell>{ticket.remarks || '-'}</TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => setActiveTicket(ticket)}
                        sx={{ mr: 1 }}
                      >
                        Open
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleCancelInspection(ticket._id)}
                      >
                        Cancel Inspection
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6}>No pending inspections</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Inline Inspection Form */}
      {activeTicket && (
        <Box mt={4} p={3} border="1px solid #ccc" borderRadius={2}>
          <Typography variant="h6" mb={2}>
            Inspection Checklist for {activeTicket.ticketNumber}
          </Typography>

          {/* Checklist items */}
          <Box mb={2}>
            <Typography>No Sanitary Permit To Operate</Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={checklist.sanitaryPermit === 'compliant'}
                  onChange={() =>
                    handleChecklistChange('sanitaryPermit', 'compliant')
                  }
                />
              }
              label="Compliant"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={checklist.sanitaryPermit === 'non-compliant'}
                  onChange={() =>
                    handleChecklistChange('sanitaryPermit', 'non-compliant')
                  }
                />
              }
              label="Non-Compliant"
            />
          </Box>

          <Box mb={2}>
            <Typography>No Health Certificate Of Employees</Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={checklist.healthCert === 'compliant'}
                  onChange={() =>
                    handleChecklistChange('healthCert', 'compliant')
                  }
                />
              }
              label="Compliant"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={checklist.healthCert === 'non-compliant'}
                  onChange={() =>
                    handleChecklistChange('healthCert', 'non-compliant')
                  }
                />
              }
              label="Non-Compliant"
            />
          </Box>

          <Box mb={2}>
            <Typography>Failure To Display - Sanitary Permit</Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={checklist.displaySanitary === 'compliant'}
                  onChange={() =>
                    handleChecklistChange('displaySanitary', 'compliant')
                  }
                />
              }
              label="Compliant"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={checklist.displaySanitary === 'non-compliant'}
                  onChange={() =>
                    handleChecklistChange('displaySanitary', 'non-compliant')
                  }
                />
              }
              label="Non-Compliant"
            />
          </Box>

          <Box mb={2}>
            <Typography>Failure To Display - Health Certificate</Typography>
            <FormControlLabel
              control={
                <Checkbox
                  checked={checklist.displayHealth === 'compliant'}
                  onChange={() =>
                    handleChecklistChange('displayHealth', 'compliant')
                  }
                />
              }
              label="Compliant"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={checklist.displayHealth === 'non-compliant'}
                  onChange={() =>
                    handleChecklistChange('displayHealth', 'non-compliant')
                  }
                />
              }
              label="Non-Compliant"
            />
          </Box>

          {/* Remarks */}
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
              onClick={handleCompleteInspection}
            >
              Complete Inspection
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => setActiveTicket(null)} // ✅ UI-only cancel
            >
              Cancel
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
