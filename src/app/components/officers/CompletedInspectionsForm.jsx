'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Typography,
  TextField,
  Box,
  Stack,
  Button,
  Paper,
  MenuItem,
} from '@mui/material';

export default function CreateTicketInspectionForm() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    newBidNumber: '',
    newBusinessName: '',
    newBusinessType: '',
    newRequestType: '',
    newRequirements: '',
    newContactPerson: '',
    newContactNumber: '',
    newLandmark: '',
    newRemarks: '',
    newInspectionType: 'routine',
    newInspectionStage: 'inform',
    newViolationType: '',
    newViolation: '',
  });

  const handleChange = (field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleClear = () => {
    setFormData({
      newBidNumber: '',
      newBusinessName: '',
      newBusinessType: '',
      newRequestType: '',
      newRequirements: '',
      newContactPerson: '',
      newContactNumber: '',
      newLandmark: '',
      newRemarks: '',
      newInspectionType: 'routine',
      newInspectionStage: 'inform',
      newViolationType: '',
      newViolation: '',
    });
  };

  const handleSaveDraft = async () => {
    const draft = {
      ...formData,
      status: 'draft',
    };
    console.log('Saved as draft:', draft);
    // TODO: POST to /api/tickets with status: 'draft'
  };

  const handleSaveAndProceed = async () => {
    const ticket = {
      ...formData,
      status: 'submitted',
    };
    console.log('Saved and proceeding:', ticket);
    // TODO: POST to /api/tickets with status: 'submitted'
    router.push('/officers/workbench/verifications');
  };

  const handleBack = () => {
    router.push('/officers/inspections');
  };

  return (
    <Box position="relative" p={4}>
      <Button variant="outlined" onClick={handleBack} sx={{ mb: 2 }}>
        ← Back
      </Button>

      <Typography variant="h6" fontWeight="bold" mb={4}>
        🧾 Create Inspection Ticket
      </Typography>

      <Paper elevation={3} sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
        <Stack spacing={2}>
          <TextField
            label="Business ID"
            variant="outlined"
            fullWidth
            value={formData.newBidNumber}
            onChange={handleChange('newBidNumber')}
          />
          <TextField
            label="Business Name"
            variant="outlined"
            fullWidth
            value={formData.newBusinessName}
            onChange={handleChange('newBusinessName')}
          />
          <TextField
            label="Business Type"
            variant="outlined"
            fullWidth
            value={formData.newBusinessType}
            onChange={handleChange('newBusinessType')}
          />
          <TextField
            label="Request Type"
            variant="outlined"
            fullWidth
            value={formData.newRequestType}
            onChange={handleChange('newRequestType')}
          />
          <TextField
            label="Requirements Checklist"
            variant="outlined"
            multiline
            rows={3}
            fullWidth
            value={formData.newRequirements}
            onChange={handleChange('newRequirements')}
          />
          <TextField
            label="Contact Person"
            variant="outlined"
            fullWidth
            value={formData.newContactPerson}
            onChange={handleChange('newContactPerson')}
          />
          <TextField
            label="Contact Number"
            variant="outlined"
            fullWidth
            value={formData.newContactNumber}
            onChange={handleChange('newContactNumber')}
          />
          <TextField
            label="Landmark"
            variant="outlined"
            fullWidth
            value={formData.newLandmark}
            onChange={handleChange('newLandmark')}
          />
          <TextField
            label="Remarks"
            variant="outlined"
            multiline
            rows={4}
            fullWidth
            value={formData.newRemarks}
            onChange={handleChange('newRemarks')}
          />
          <TextField
            label="Inspection Type"
            select
            fullWidth
            value={formData.newInspectionType}
            onChange={handleChange('newInspectionType')}
          >
            {['routine', 'follow-up', 'complaint-based', 'reinspection'].map((type) => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Inspection Stage"
            select
            fullWidth
            value={formData.newInspectionStage}
            onChange={handleChange('newInspectionStage')}
          >
            {['inform', 'pending', 'completed'].map((stage) => (
              <MenuItem key={stage} value={stage}>{stage}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Violation Type"
            select
            fullWidth
            value={formData.newViolationType}
            onChange={handleChange('newViolationType')}
          >
            {['sanitation', 'waste disposal', 'pest control', 'structural', 'other'].map((type) => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </TextField>
          <TextField
            label="Violation Description"
            variant="outlined"
            multiline
            rows={2}
            fullWidth
            value={formData.newViolation}
            onChange={handleChange('newViolation')}
          />

          <Stack direction="row" spacing={2} justifyContent="flex-end" mt={2}>
            <Button variant="outlined" color="inherit" onClick={handleClear}>
              Clear
            </Button>
            <Button variant="contained" color="secondary" onClick={handleSaveDraft}>
              Save as Draft
            </Button>
            <Button variant="contained" color="primary" onClick={handleSaveAndProceed}>
              Save and Proceed
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
