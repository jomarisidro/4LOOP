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
  const id = searchParams.get('id');
  const printRef = useRef<HTMLDivElement>(null);

  // Query for business
  const {
    data: business,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['business', id],
    queryFn: async () => {
      const res = await fetch(`/api/business/${id}`);
      if (!res.ok) throw new Error(`Failed with status ${res.status}`);
      return res.json();
    },
    enabled: !!id,
  });

  // Query for ticket (inspection info)
  const {
    data: ticket,
    isLoading: ticketLoading,
    isError: ticketError,
  } = useQuery({
    queryKey: ['ticket', id],
    queryFn: async () => {
      const res = await fetch(`/api/ticket/${id}`);
      if (!res.ok) throw new Error(`Failed with status ${res.status}`);
      return res.json();
    },
    enabled: !!id,
  });

  const handlePrint = () => {
    if (!printRef.current) return;
    const printContents = printRef.current.innerHTML;
    const originalContents = document.body.innerHTML;
    document.body.innerHTML = printContents;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  if (isLoading) {
    return (
      <Box mt={4} textAlign="center">
        <CircularProgress />
        <Typography mt={2}>Loading business details...</Typography>
      </Box>
    );
  }

  if (isError || !business || business.error) {
    return (
      <Box mt={4} textAlign="center">
        <Typography color="error">
          ❌ Failed to load business: {error?.message}
        </Typography>
      </Box>
    );
  }

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
        {/* Header with logos */}
        <Box
          display="grid"
          gridTemplateColumns="1fr 2fr 1fr"
          alignItems="center"
          mb={2}
        >
          {/* Left logos */}
          <Box display="flex" alignItems="center" gap={5} justifyContent="flex-start" pl={15}>
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
            <Typography variant="body2">ENVIRONMENTAL SANITATION SECTION</Typography>
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
            <strong>BID NUMBER:</strong> {business.bidNumber || '________________'}
          </Typography>
        </Box>

        {/* Business Info */}
        <Box mt={2}>
          <Typography variant="body1">IS HEREBY GRANTED TO</Typography>

          <Box mt={2}>
            <Typography variant="h6" align="center" sx={{ borderBottom: '1px solid #000' }}>
              {business.businessName}
            </Typography>
            <Typography variant="caption" display="block" align="center">
              BUSINESS NAME
            </Typography>
          </Box>

          <Box mt={3}>
            <Typography variant="h6" align="center" sx={{ borderBottom: '1px solid #000' }}>
              {business.businessAddress}
            </Typography>
            <Typography variant="caption" display="block" align="center">
              BUSINESS ADDRESS
            </Typography>
          </Box>
        </Box>

        {/* Dates */}
        <Stack direction="row" spacing={2} mt={4} justifyContent="space-between">
          <Typography>
            <strong>DATE ISSUED:</strong> {new Date().toLocaleDateString('en-PH')}
          </Typography>
          <Typography>
            <strong>VALID UNTIL DECEMBER 31,</strong> {new Date().getFullYear()}
          </Typography>
        </Stack>

        {/* Legal Text */}
        <Box mt={4}>
          <Typography variant="body2" align="justify" paragraph sx={{textIndent: '2em'}}>
            This Sanitary Permit is instantly issued to covered Establishments as mandated and provided for by
            the Code on Sanitation of the Philippines (P.D. 856), City Ordinance No. 53 Series of 2022,
            amending Sanitation Code of Pasig City (City Ordinance No. 15 Series of 2008) accordingly, R.A. 11032,
            the Ease of Doing Business and Efficient Delivery of Government Services in furtherance of
            R.A. 9485 or the Anti-Red Tape Act of 2007, the Joint Memorandum Circular (JMC No.01 Series of 2021) 
            of the Anti-Red Tape Authority (ARTA), DILG, DTI and DICT and the Citizen's Charter of Pasig City.
          </Typography>
          <Typography variant="body2" align="justify" paragraph sx={{textIndent: '2em'}}>
            This permit is issued on the condition that all applicable Minimum Sanitary Requirements
            (MSR) shall be strictly complied. Likewise, this Permit shall not exempt the Grantee from
            compliance with other requirements from other Government Agencies and Offices, including
            the Local Government Unit and its instrumentalities.
          </Typography>
          <Typography variant="body2" align="justify" paragraph sx={{textIndent: '2em'}}>
            Accordingly, the Penal Provisions of aforesaid Laws and Ordinances shall be in full effect
            and applied, for any violations and non-compliance to the provisions of the said Laws and
            Ordinances. The issuance of this Sanitary Permit is non-transferable and is subject to
            inspection.
          </Typography>
        </Box>

        {/* Signatories */}
        <Stack direction="row" justifyContent="space-between" mt={6}>
          <Box textAlign="center">
            <Typography variant="body2" mb={6}>
              RECOMMENDING APPROVAL:
            </Typography>
            <Typography variant="body1" sx={{ borderTop: '1px solid #000' }}>
              NORATA R. DANCEL, MD, DPPS
            </Typography>
            <Typography variant="caption">OIC, Environmental Sanitation Section</Typography>
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

        {/* Inspected by section */}
        <Box mb={4}>
          <Typography variant="body2" gutterBottom fontWeight="bold">
            INSPECTED BY:
          </Typography>
          <Typography variant="body2">
            Name of Sanitary Inspector:{' '}
            {ticket?.officerInCharge
              ? `${ticket.officerInCharge.firstName || ''} ${ticket.officerInCharge.lastName || ''}`.trim()
              : '____________________'}{' '}
            &nbsp;&nbsp;
            Signature: ____________________ &nbsp;&nbsp;
            Date/Time Inspected:{' '}
            {ticket?.inspectionDate
              ? new Date(ticket.inspectionDate).toLocaleString('en-PH')
              : '____________________'}
          </Typography>
        </Box>

        {/* Footer messages */}
        <Typography
          variant="caption"
          align="center"
          display="block"
          fontWeight="bold"
        >
          “A GAME CHANGER IN CONDUCTING BUSINESS TRANSACTIONS IN PASIG CITY”
        </Typography>
        <Typography variant="caption" align="center" display="block">
          This Sanitary Permit is NON-TRANSFERABLE and shall be DISPLAYED IN PUBLIC VIEW.
        </Typography>
        <Typography variant="caption" align="center" display="block">
          THIS PERMIT IS SUBJECT FOR INSPECTION
        </Typography>
      </Box>

      <Button
        variant="contained"
        color="primary"
        sx={{ mt: 4 }}
        onClick={handlePrint}
        className="no-print"
      >
        🖨️ Print Permit
      </Button>
    </Box>
  );
}
