// 'use client';

// import { useRouter, useSearchParams } from 'next/navigation';
// import { useQuery } from '@tanstack/react-query';
// import {
//   Typography,
//   Box,
//   TextField,
//   Button,
//   CircularProgress,
//   Stack,
//   MenuItem,
// } from '@mui/material';
// import { useState } from 'react';

// export default function TicketInspectionForm() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const bidNumber = searchParams.get('bidNumber');

//   const [formData, setFormData] = useState({
//     newRequestType: '',
//     newRequirements: '',
//     newRemarks: '',
//     newInspectionType: 'routine',
//     newInspectionStage: 'inform',
//     newViolationType: '',
//     newViolation: '',
//   });

//   const {
//     data: business,
//     isLoading,
//     isError,
//     error,
//   } = useQuery({
//     queryKey: ['business', bidNumber],
//     queryFn: async () => {
//       const res = await fetch(`/api/business/${bidNumber}`);
//       if (!res.ok) throw new Error(`Failed with status ${res.status}`);
//       return res.json();
//     },
//     enabled: !!bidNumber,
//   });

//   const handleChange = (field) => (e) => {
//     setFormData((prev) => ({ ...prev, [field]: e.target.value }));
//   };

//   const handleSubmit = async (status) => {
//     try {
//       const res = await fetch('/api/ticket', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           ...formData,
//           status,
//           newBidNumber: business.bidNumber,
//           newBusinessName: business.businessName,
//           newBusinessType: business.businessType,
//           newContactPerson: business.contactPerson,
//           newContactNumber: business.contactNumber,
//           newLandmark: business.landmark,
//         }),
//       });

//       if (!res.ok) throw new Error(`Server responded with ${res.status}`);

//       const result = await res.json();
//       console.log('✅ Ticket created:', result);

//       if (status === 'submitted') {
//         router.push('/officers/workbench/verifications');
//       } else {
//         alert('Draft saved');
//       }
//     } catch (err) {
//       console.error('❌ Ticket creation failed:', err);
//     }
//   };

//   const handleBack = () => {
//     router.push('/officers/inspections');
//   };

//   if (isLoading) {
//     return (
//       <Box mt={4} textAlign="center">
//         <CircularProgress />
//         <Typography mt={2}>Loading business details...</Typography>
//       </Box>
//     );
//   }

//   if (isError || !business || business.error) {
//     return (
//       <Box mt={4} textAlign="center">
//         <Typography color="error">❌ Failed to load business: {error?.message}</Typography>
//       </Box>
//     );
//   }

//   return (
//     <Box p={4}>
//       <Button variant="outlined" onClick={handleBack} sx={{ mb: 2 }}>
//         ← Back to Business List
//       </Button>

//       <Typography variant="h5" fontWeight="bold" mb={2}>
//         🧾 Create Inspection Ticket
//       </Typography>

//       <Stack spacing={1} mb={3}>
//         <Typography><strong>BID Number:</strong> {business.bidNumber}</Typography>
//         <Typography><strong>Business Name:</strong> {business.businessName}</Typography>
//         <Typography><strong>Business Type:</strong> {business.businessType}</Typography>
//         <Typography><strong>Contact Person:</strong> {business.contactPerson}</Typography>
//         <Typography><strong>Contact Number:</strong> {business.contactNumber}</Typography>
//         <Typography><strong>Landmark:</strong> {business.landmark}</Typography>
//       </Stack>

//       <Stack spacing={2}>
//         <TextField
//           label="Request Type"
//           fullWidth
//           value={formData.newRequestType}
//           onChange={handleChange('newRequestType')}
//         />
//         <TextField
//           label="Requirements"
//           fullWidth
//           value={formData.newRequirements}
//           onChange={handleChange('newRequirements')}
//         />
//         <TextField
//           label="Remarks"
//           multiline
//           rows={3}
//           fullWidth
//           value={formData.newRemarks}
//           onChange={handleChange('newRemarks')}
//         />
//         <TextField
//           label="Violation Type"
//           fullWidth
//           value={formData.newViolationType}
//           onChange={handleChange('newViolationType')}
//         />
//         <TextField
//           label="Violation"
//           fullWidth
//           value={formData.newViolation}
//           onChange={handleChange('newViolation')}
//         />
//         <TextField
//           select
//           label="Inspection Type"
//           value={formData.newInspectionType}
//           onChange={handleChange('newInspectionType')}
//         >
//           <MenuItem value="routine">Routine</MenuItem>
//           <MenuItem value="follow-up">Follow-up</MenuItem>
//           <MenuItem value="complaint">Complaint</MenuItem>
//         </TextField>
//         <TextField
//           select
//           label="Inspection Stage"
//           value={formData.newInspectionStage}
//           onChange={handleChange('newInspectionStage')}
//         >
//           <MenuItem value="inform">Inform</MenuItem>
//           <MenuItem value="verify">Verify</MenuItem>
//           <MenuItem value="resolve">Resolve</MenuItem>
//         </TextField>

//         <Stack direction="row" spacing={2} mt={2}>
//           <Button variant="outlined" onClick={() => handleSubmit('draft')}>
//             Save as Draft
//           </Button>
//           <Button variant="contained" color="primary" onClick={() => handleSubmit('submitted')}>
//             Submit Ticket
//           </Button>
//         </Stack>
//       </Stack>
//     </Box>
//   );
// }
