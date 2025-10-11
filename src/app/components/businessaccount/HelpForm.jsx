'use client';

import { Typography, Box, Paper, List, ListItem, ListItemText } from '@mui/material';

export default function HelpForm() {


  return (
    <Box position="relative">
    

      <Typography variant="h4" fontWeight="bold" mb={4}>
        Help Center
      </Typography>

      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h6" gutterBottom>
          📘 Need Assistance?
        </Typography>

        <Typography variant="body1" color="text.secondary" mb={3}>
          If you’re stuck, confused, or just want to know more about the request process—this page is here to support you. Explore the sections below to get guidance.
        </Typography>

        <List sx={{ mb: 3 }}>
          <ListItem>
            <ListItemText
              primary="🆕 New Business Requests"
              secondary="Steps for submitting, verifying, and checking approval timelines."
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="🔄 Renewal Requests"
              secondary="Guidance on permit numbers, uploading documents, and re-submissions."
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="🛡️ Compliance Issues"
              secondary="Reporting process, required evidence, and how compliance is reviewed."
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="✅ Completed & 📌 Pending Requests"
              secondary="Where to find status updates and what each label means."
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="⚙️ Profile Settings"
              secondary="Editing personal info, saving changes, and resetting fields."
            />
          </ListItem>
        </List>

        <Typography variant="body1" color="text.secondary">
          Need more help? You can contact the support team or return to your dashboard anytime.
        </Typography>
      </Paper>
    </Box>
  );
}
