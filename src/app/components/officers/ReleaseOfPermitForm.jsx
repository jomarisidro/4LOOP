'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  Typography,
  Box,
  Button,
  CircularProgress,
  Divider,
  Stack,
} from '@mui/material';
import { useRef } from 'react';

export default function ReleaseOfPermitForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const businessId = searchParams.get('id');
const printRef = useRef(null);

  // ✅ Fetch business data
  const {
    data: business,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['business', businessId],
    queryFn: async () => {
      const res = await fetch(`/api/business/${businessId}`);
      if (!res.ok) throw new Error(`Failed to fetch business (${res.status})`);
      return res.json();
    },
    enabled: !!businessId,
  });
console.log("🆔 businessId:", businessId);

  // ✅ Handle print and release
  const handleReleaseAndPrint = async () => {
    try {
      await fetch(`/api/business/${businessId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStatus: 'released' }),
      });
    } catch (err) {
      console.warn('⚠️ Failed to update release status:', err);
    }

    if (!printRef.current) return;
    const printContents = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      alert('Please allow popups for this site to print.');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Sanitary Permit</title>
          <style>
            @media print {
              body {
                margin: 30px;
                font-family: serif;
                background: white;
              }
            }
            img { max-width: 100px; height: auto; }
          </style>
        </head>
        <body>${printContents}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // ✅ Loading
  if (isLoading) {
    return (
      <Box mt={4} textAlign="center">
        <CircularProgress />
        <Typography mt={2}>Loading permit details...</Typography>
      </Box>
    );
  }

  // ❌ Error
  if (isError || !business || business.error) {
    return (
      <Box mt={4} textAlign="center">
        <Typography color="error">
          ❌ Failed to load business: {error?.message || business?.error}
        </Typography>
      </Box>
    );
  }

  // ✅ Safe destructuring
  const businessName = business.businessName || business.name || '________________';
  const businessAddress =
    business.businessAddress || business.address || '________________';
  const bidNumber = business.bidNumber || business.bid || '________________';
  const ticket = business.latestTicket || {};
  const officer =
    ticket.officerInCharge || ticket.inspector || ticket.inspectedBy || {};
  const officerName =
    `${officer.firstName || ''} ${officer.lastName || ''}`.trim() ||
    '____________________';
  const inspectionDate = ticket.inspectionDate
    ? new Date(ticket.inspectionDate).toLocaleString('en-PH')
    : '____________________';

  return (
    <Box p={4}>
      <Button
        variant="outlined"
        color="secondary"
        sx={{ mb: 2 }}
        onClick={() => router.push('/officers/workbench/release')}
        className="no-print"
      >
        ↩️ Back to Verification Request Lists
      </Button>

      {/* Printable Permit */}
      <Box
        ref={printRef}
        className="permit-print"
        sx={{
          padding: 6,
          backgroundColor: '#fff',
          fontFamily: 'serif',
          border: '1px solid #000',
        }}
      >
        {/* Header */}
        <Box
          display="grid"
          gridTemplateColumns="1fr 2fr 1fr"
          alignItems="center"
          mb={2}
        >
          {/* Left logos */}
          <Box
            display="flex"
            alignItems="center"
            gap={5}
            justifyContent="flex-start"
            pl={15}
          >
            <img
              src="/pasig-seal.png"
              alt="Pasig City Seal"
              style={{ width: '100px', height: '100px', objectFit: 'contain' }}
            />
            <img
              src="/pasig-logo.png"
              alt="Pasig City Logo"
              style={{ width: '110px', height: '110px', objectFit: 'contain' }}
            />
          </Box>

          {/* Center text */}
          <Box textAlign="center">
            <Typography variant="body2">REPUBLIC OF THE PHILIPPINES</Typography>
            <Typography variant="body2">CITY OF PASIG</Typography>
            <Typography variant="body2">CITY HEALTH DEPARTMENT</Typography>
            <Typography variant="body2">
              ENVIRONMENTAL SANITATION SECTION
            </Typography>
          </Box>

          {/* Right logo */}
          <Box display="flex" justifyContent="center">
            <img
              src="/pasig-env.png"
              alt="Pasig Environmental Logo"
              style={{ width: '100px', height: '100px', objectFit: 'contain' }}
            />
          </Box>
        </Box>

        {/* Title */}
        <Typography
          variant="h5"
          align="center"
          fontWeight="bold"
          gutterBottom
          sx={{ textDecoration: 'underline' }}
        >
          SANITARY PERMIT TO OPERATE
        </Typography>

        {/* BID Number */}
        <Box mt={3} mb={2}>
          <Typography>
            <strong>BID NUMBER:</strong> {bidNumber}
          </Typography>
        </Box>

        {/* Business Info */}
        <Box mt={2}>
          <Typography variant="body1">IS HEREBY GRANTED TO</Typography>

          <Box mt={2}>
            <Typography
              variant="h6"
              align="center"
              sx={{ borderBottom: '1px solid #000' }}
            >
              {businessName}
            </Typography>
            <Typography variant="caption" display="block" align="center">
              BUSINESS NAME
            </Typography>
          </Box>

          <Box mt={3}>
            <Typography
              variant="h6"
              align="center"
              sx={{ borderBottom: '1px solid #000' }}
            >
              {businessAddress}
            </Typography>
            <Typography variant="caption" display="block" align="center">
              BUSINESS ADDRESS
            </Typography>
          </Box>
        </Box>

        {/* Dates */}
        <Stack direction="row" spacing={2} mt={4} justifyContent="space-between">
          <Typography>
            <strong>DATE ISSUED:</strong>{' '}
            {new Date().toLocaleDateString('en-PH')}
          </Typography>
          <Typography>
            <strong>VALID UNTIL DECEMBER 31,</strong>{' '}
            {new Date().getFullYear()}
          </Typography>
        </Stack>

        {/* Legal Text (if needed, unchanged) */}

        {/* Signatories */}
        <Stack direction="row" justifyContent="space-between" mt={6}>
          <Box textAlign="center">
            <Typography variant="body2" mb={6}>
              RECOMMENDING APPROVAL:
            </Typography>
            <Typography variant="body1" sx={{ borderTop: '1px solid #000' }}>
              NORATA R. DANCEL, MD, DPPS
            </Typography>
            <Typography variant="caption">
              OIC, Environmental Sanitation Section
            </Typography>
          </Box>

          <Box textAlign="center">
            <Typography variant="body2" mb={6}>
              APPROVED:
            </Typography>
            <Typography variant="body1" sx={{ borderTop: '1px solid #000' }}>
              JOSEPH R. PANALIGAN, MD, MHA
            </Typography>
            <Typography variant="caption">City Health Officer</Typography>
          </Box>
        </Stack>

        <Divider sx={{ my: 4 }} />

        {/* Inspected by */}
        <Box mb={4}>
          <Typography variant="body2" gutterBottom fontWeight="bold">
            INSPECTED BY:
          </Typography>
          <Typography variant="body2">
            Name of Sanitary Inspector: {officerName} &nbsp;&nbsp;
            Signature: ____________________ &nbsp;&nbsp; Date/Time Inspected:{' '}
            {inspectionDate}
          </Typography>
        </Box>

        {/* Footer */}
        <Typography
          variant="caption"
          align="center"
          display="block"
          fontWeight="bold"
        >
          “A GAME CHANGER IN CONDUCTING BUSINESS TRANSACTIONS IN PASIG CITY”
        </Typography>
        <Typography variant="caption" align="center" display="block">
          This Sanitary Permit is NON-TRANSFERABLE and shall be DISPLAYED IN
          PUBLIC VIEW.
        </Typography>
        <Typography variant="caption" align="center" display="block">
          THIS PERMIT IS SUBJECT FOR INSPECTION
        </Typography>
      </Box>

      {/* Print Button */}
      <Button
        variant="contained"
        color="primary"
        sx={{ mt: 4 }}
        onClick={handleReleaseAndPrint}
        className="no-print"
      >
        🖨️ Print Permit
      </Button>
    </Box>
  );
}
