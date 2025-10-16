'use client';

import { Typography, Box, Paper, List, ListItem, ListItemText, Link } from '@mui/material';

export default function HelpForm() {
  return (
    <Box position="relative">
      <Typography variant="h4" fontWeight="bold" mb={4}>
        Sanitation Permit Compliance Help Center
      </Typography>

      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h6" gutterBottom>
          🧾 Understanding the Sanitation Permit Process
        </Typography>

        <Typography variant="body1" color="text.secondary" mb={3}>
          The Sanitation Permit process ensures that all business establishments in Pasig City meet public health
          and environmental sanitation standards. Below is a step-by-step guide to help you understand how your
          online request is processed — from submission to approval.
        </Typography>

        <List sx={{ mb: 3 }}>
          <ListItem>
            <ListItemText
              primary="1️⃣ Online Request Submission"
              secondary="Start by creating an online request for a Sanitation Permit. Your assigned officer will review your checklist and add notes in the remarks section if any item needs to be included or excluded. Once reviewed, your request status will change to 'Processing'."
            />
          </ListItem>

          <ListItem>
            <ListItemText
              primary="2️⃣ Submission of Hard Copy Documents"
              secondary="After your request is marked as processing, please submit your physical documents to the City Health Department. These will be used to verify your application details."
            />
          </ListItem>

          <ListItem>
            <ListItemText
              primary="3️⃣ Verification Stage"
              secondary="During verification, officers will check if your business has submitted all the required documents. If there are missing or incomplete requirements, they will be noted in the remarks section — you can view these updates in your account."
            />
          </ListItem>

          <ListItem>
            <ListItemText
              primary="4️⃣ Compliance Stage"
              secondary="If your remarks indicate pending requirements, please comply as soon as possible. Once all required documents and corrections are submitted, your officer can proceed with the next steps — including approval and permit release."
            />
          </ListItem>

          <ListItem>
            <ListItemText
              primary="5️⃣ Approval and Release"
              secondary="After successful verification and compliance, your Sanitation Permit will be approved and marked as released. You can then download or print your official permit for display at your establishment."
            />
          </ListItem>
        </List>

        <Typography variant="body1" color="text.secondary" mb={3}>
          📄 For a detailed list of sanitation requirements and inspection standards, please refer to the official
          <Link
            href="https://assets.pasigcity.gov.ph/storage/attachments/pasig_city_health_department/633e8116ded771665040662EDITED%20CHO%20Environmental%20Sanitation%20Section.pdf"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ ml: 1, fontWeight: 'bold' }}
          >
            Sanitation Permit Requirements Checklist
          </Link>.
        </Typography>

        <Typography variant="body1" color="text.secondary" mb={3}>
          For questions or clarifications, you may contact the Pasig City Health Department, Environmental Sanitation
          Section, or return to your dashboard to track your request’s current progress. You may also visit the
          <Link
            href="https://pasigcity.gov.ph/"
            target="_blank"
            rel="noopener noreferrer"
            sx={{ ml: 0.5, fontWeight: 'bold' }}
          >
            Official Pasig City Website
          </Link>.
        </Typography>

        {/* Contact Information Section */}
        <Box mt={4}>
          <Typography variant="h6" gutterBottom>
            📞 Contact Information
          </Typography>

          <Typography variant="body2" color="text.secondary" mb={1}>
            For information, complaints, grievances, and/or suggestions, you may send us a message through the following:
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
            <strong>Email:</strong>{' '}
            <Link
              href="mailto:ugnayan@pasigcity.gov.ph"
              sx={{ color: 'primary.main', fontWeight: 'bold' }}
            >
              ugnayan@pasigcity.gov.ph
            </Link>
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ ml: 2, mt: 1 }}>
            <strong>Social Media:</strong>{' '}
            <Link
              href="https://www.facebook.com/OfficialUgnayanSaPasig"
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: 'primary.main', fontWeight: 'bold' }}
            >
              www.facebook.com/OfficialUgnayanSaPasig
            </Link>
          </Typography>

          <Typography variant="body2" color="text.secondary" sx={{ ml: 2, mt: 1 }}>
            <strong>Phone:</strong> 8643-1111 local 1211, 1212, or 1213
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
