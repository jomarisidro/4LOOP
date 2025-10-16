'use client';

import { Typography, Box, Paper, Link, Divider } from '@mui/material';

export default function HelpForm() {
  return (
    <Box position="relative">
      <Typography variant="h4" fontWeight="bold" mb={4}>
        Officer Help Center
      </Typography>

      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h6" gutterBottom>
          🧾 Sanitation Permit Compliance Reminder
        </Typography>

        <Typography variant="body1" color="text.secondary" mb={3}>
          As an officer, please ensure that all business applications comply
          with the required sanitation standards before approval. Review each
          checklist carefully and provide clear remarks when a business needs to
          include or exclude certain requirements.
        </Typography>

        <Typography variant="body1" color="text.secondary" mb={3}>
          For reference, you may view the complete{' '}
          <Link
            href="https://assets.pasigcity.gov.ph/storage/attachments/pasig_city_health_department/633e8116ded771665040662EDITED%20CHO%20Environmental%20Sanitation%20Section.pdf"
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            sx={{ fontWeight: 'bold' }}
          >
            Sanitation Permit Requirements Checklist
          </Link>{' '}
          provided by the Pasig City Health Department, Environmental Sanitation
          Section.
        </Typography>

        <Typography variant="body1" color="text.secondary" mb={3}>
          Remember to record any compliance-related findings or missing
          documents under the remarks section. This helps applicants track their
          progress and understand what actions are required to proceed with
          approval.
        </Typography>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h6" gutterBottom>
          🛠️ Developer Support
        </Typography>
        <Typography variant="body2" color="text.secondary">
          For system errors, troubleshooting, or technical assistance, please
          contact the development team:
        </Typography>

        <Box mt={2}>
          <Typography variant="body2"><strong>Development Group:</strong> 4LOOP</Typography>
          <Typography variant="body2"><strong>Representative:</strong> Jomar Isidro</Typography>
          <Typography variant="body2"><strong>Contact Number:</strong> 09466016992</Typography>
          <Typography variant="body2"><strong>Email:</strong> jomar.isidro@my.jru.edu</Typography>
        </Box>
      </Paper>
    </Box>
  );
}
