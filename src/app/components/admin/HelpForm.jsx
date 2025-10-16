'use client';

import { Typography, Box, Paper, Link, Divider } from '@mui/material';

export default function HelpForm() {
  return (
    <Box position="relative">
      <Typography variant="h4" fontWeight="bold" mb={4}>
        Admin Help Center
      </Typography>

      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h6" gutterBottom>
          🧾 Sanitation Permit Compliance Overview
        </Typography>

        <Typography variant="body1" color="text.secondary" mb={3}>
          As an admin, it’s important to ensure that all submitted business
          applications follow the proper sanitation standards before final
          approval. Review officer reports, compliance statuses, and supporting
          documents carefully during verification and approval.
        </Typography>

        <Typography variant="body1" color="text.secondary" mb={3}>
          You may review the official{' '}
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
          Section for full details on required compliance documents and
          standards.
        </Typography>

        <Typography variant="body1" color="text.secondary" mb={3}>
          Ensure that officers’ remarks and compliance updates are properly
          reflected in the system so that business owners can monitor their
          progress and submit the necessary documents to proceed with permit
          issuance.
        </Typography>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h6" gutterBottom>
          🛠️ Developer Support
        </Typography>

        <Typography variant="body2" color="text.secondary">
          For technical concerns, system errors, or troubleshooting assistance,
          please contact the development team:
        </Typography>

        <Box mt={2}>
          <Typography variant="body2">
            <strong>Development Group:</strong> 4LOOP
          </Typography>
          <Typography variant="body2">
            <strong>Representative:</strong> Jomar Isidro
          </Typography>
          <Typography variant="body2">
            <strong>Contact Number:</strong> 09466016992
          </Typography>
          <Typography variant="body2">
            <strong>Email:</strong> jomar.isidro@my.jru.edu
          </Typography>
        </Box>
        <Divider sx={{ my: 4 }} />
      </Paper>
    </Box>
  );
}
