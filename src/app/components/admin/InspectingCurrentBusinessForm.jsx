'use client';

import {
  Typography,
  Box,
  Button,
  FormControlLabel,
  Checkbox,
  TextField,
} from '@mui/material';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// Utility to format inspection number into ordinal (1st, 2nd, 3rd, etc.)
function formatOrdinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function InspectingCurrentBusinessForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id'); // ✅ get ticket id from query string
  const queryClient = useQueryClient();

  const { data: ticket, isLoading, isError } = useQuery({
    queryKey: ['ticket', id],
    queryFn: async () => {
      const res = await axios.get(`/api/ticket/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const [checklist, setChecklist] = useState({
    sanitaryPermit: null,
    healthCert: null,
    displaySanitary: null,
    displayHealth: null,
  });
  const [remarks, setRemarks] = useState('');

  const handleChecklistChange = (field, value) => {
    setChecklist((prev) => ({ ...prev, [field]: value }));
  };

  const handleCompleteInspection = async () => {
    try {
      const year = new Date().getFullYear();

      // 🔎 Check existing inspections for this business in the current year
      const res = await axios.get(
        `/api/ticket?businessId=${ticket.business._id}&year=${year}`
      );
      const inspectionsThisYear = res.data || [];

      // Decide inspection number
      const inspectionNumber =
        inspectionsThisYear.length === 0
          ? 1
          : inspectionsThisYear.length + 1;

      await axios.put(`/api/ticket/${id}`, {
        inspectionStatus: 'completed',
        remarks,
        checklist,
        inspectionNumber,
      });

      queryClient.invalidateQueries(['pending-inspections']);
      router.push('/officers/inspections/pendinginspections');
    } catch (err) {
      console.error('❌ Error completing inspection:', err);
    }
  };

  if (!id) {
    return <Typography color="error">❌ No ticket ID provided</Typography>;
  }

  if (isLoading) {
    return <Typography>Loading ticket...</Typography>;
  }

  if (isError || !ticket) {
    return <Typography color="error">❌ Failed to load ticket</Typography>;
  }

  return (
    <Box p={4}>
      <Button
        variant="outlined"
        onClick={() => router.push('/officers/inspections/pendinginspections')}
        sx={{ mb: 2 }}
      >
        ← Back
      </Button>

      <Typography variant="h6" fontWeight="bold" mb={2}>
        Inspection Checklist for Ticket #{ticket.ticketNumber}
      </Typography>

      {/* Show inspection number if available */}
      {ticket.inspectionNumber && (
        <Typography variant="subtitle1" mb={2}>
          This is the {formatOrdinal(ticket.inspectionNumber)} inspection for {new Date().getFullYear()}.
        </Typography>
      )}

      {/* Checklist items */}
      <Box mb={2}>
        <Typography>No Sanitary Permit To Operate</Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={checklist.sanitaryPermit === 'compliant'}
              onChange={() => handleChecklistChange('sanitaryPermit', 'compliant')}
            />
          }
          label="Compliant"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={checklist.sanitaryPermit === 'non-compliant'}
              onChange={() => handleChecklistChange('sanitaryPermit', 'non-compliant')}
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
              onChange={() => handleChecklistChange('healthCert', 'compliant')}
            />
          }
          label="Compliant"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={checklist.healthCert === 'non-compliant'}
              onChange={() => handleChecklistChange('healthCert', 'non-compliant')}
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
              onChange={() => handleChecklistChange('displaySanitary', 'compliant')}
            />
          }
          label="Compliant"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={checklist.displaySanitary === 'non-compliant'}
              onChange={() => handleChecklistChange('displaySanitary', 'non-compliant')}
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
              onChange={() => handleChecklistChange('displayHealth', 'compliant')}
            />
          }
          label="Compliant"
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={checklist.displayHealth === 'non-compliant'}
              onChange={() => handleChecklistChange('displayHealth', 'non-compliant')}
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
        <Button variant="contained" color="primary" onClick={handleCompleteInspection}>
          Complete Inspection
        </Button>
        <Button
          variant="outlined"
          color="error"
          onClick={() => router.push('/officers/inspections/pendinginspections')}
        >
          Cancel
        </Button>
      </Box>
    </Box>
  );
}
