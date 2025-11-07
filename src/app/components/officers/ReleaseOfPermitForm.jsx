'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Typography, Box, Button, CircularProgress, Divider } from '@mui/material';
import { useRef, useEffect, useState, useCallback } from 'react';
import { useReactToPrint } from 'react-to-print';

export default function ReleaseOfPermitForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const businessId = searchParams.get('id');

  const printRef = useRef(null);
  const [isHydrated, setIsHydrated] = useState(false);

  const {
    data: business,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['business', businessId],
    queryFn: async () => {
      if (!businessId) throw new Error('No business ID found in URL.');
      const res = await fetch(`/api/business/${businessId}`);
      if (!res.ok) throw new Error(`Failed to fetch business (${res.status})`);
      return res.json();
    },
    enabled: !!businessId,
  });

  useEffect(() => {
    if (printRef.current) setIsHydrated(true);
  }, [business]);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: 'Sanitary Permit',
    removeAfterPrint: true,
    pageStyle: `
      @page { size: A4 landscape; margin: 10mm; }
      body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
      @media print { .no-print { display: none !important; } }
    `,
  });

  const handleReleaseAndPrint = useCallback(async () => {
    if (!businessId) return;

    try {
      const officerId = sessionStorage.getItem('userId') || localStorage.getItem('loggedUserId');
      const res = await fetch(`/api/business/${businessId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStatus: 'released', officerInCharge: officerId }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Failed to update release status:', text);
        return;
      }

      // Small delay to ensure DOM updates
      setTimeout(() => {
        if (printRef.current) handlePrint();
      }, 200);

    } catch (err) {
      console.error('Network/Server error during update:', err);
    }
  }, [businessId, handlePrint]);

  if (isLoading) return (
    <Box mt={4} textAlign="center">
      <CircularProgress />
      <Typography mt={2}>Loading permit details...</Typography>
    </Box>
  );

  if (isError || !business || business.error) return (
    <Box mt={4} textAlign="center">
      <Typography color="error">
        Failed to load business: {error?.message || business?.error}
      </Typography>
    </Box>
  );

  const businessName = business.businessName || business.name || '________________';
  const businessAddress = business.businessAddress || business.address || '________________';
  const bidNumber = business.bidNumber || business.bid || '________________';
  const officerName =
    business.officerInCharge?.fullName ||
    business.inspectionRecords?.[0]?.officerInCharge?.fullName ||
    '____________________';
  const inspectionDate = business.inspectionDate
    ? new Date(business.inspectionDate).toLocaleString('en-PH')
    : business.latestTicket?.inspectionDate
    ? new Date(business.latestTicket.inspectionDate).toLocaleString('en-PH')
    : '____________________';




return (
  <Box p={4}>
    {/* BACK BUTTON */}
    <Button
      variant="outlined"
      color="secondary"
      sx={{ mb: 2 }}
      onClick={() => {
        console.log('↩️ Returning to Verification Request Lists');
        router.push('/officers/workbench/release');
      }}
      className="no-print"
    >
      ↩️ Back to Verification Request Lists
    </Button>

    {/* PRINTABLE SECTION */}
    <Box
      ref={printRef}
      sx={{
        padding: 4,
        backgroundColor: '#fff',
        fontFamily: 'serif',
        border: '1px solid #000',
        transform: 'scale(0.85)',
        transformOrigin: 'top center',
        width: '100%',
      }}
    >
      {/* HEADER */}
      <Box
        display="grid"
        gridTemplateColumns="1fr 1.5fr 1fr"
        alignItems="center"
        justifyContent="center"
        mb={1}
        sx={{ width: '100%', textAlign: 'center' }}
      >
        <Box display="flex" justifyContent="flex-end" alignItems="center" gap={6} pr={2}>
          <img src="/pasig-seal.png" alt="Pasig City Seal" style={{ width: 100, height: 100, objectFit: 'contain' }} />
          <img src="/pasig-logo.png" alt="Pasig City Logo" style={{ width: 100, height: 100, objectFit: 'contain' }} />
        </Box>

        <Box textAlign="center">
          <Typography variant="body2">REPUBLIC OF THE PHILIPPINES</Typography>
          <Typography variant="body2">CITY OF PASIG</Typography>
          <Typography variant="body2">CITY HEALTH DEPARTMENT</Typography>
          <Typography variant="body2">ENVIRONMENTAL SANITATION SECTION</Typography>
        </Box>

        <Box display="flex" justifyContent="flex-start" alignItems="center" pl={2}>
          <img src="/pasig-env.png" alt="Pasig Environmental Logo" style={{ width: 100, height: 100, objectFit: 'contain' }} />
        </Box>
      </Box>

      {/* TITLE */}
      <Box textAlign="center" mt={1} mb={2}>
        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ textDecoration: 'underline' }}>
          SANITARY PERMIT TO OPERATE
        </Typography>
        <Typography variant="body1">IS HEREBY GRANTED TO</Typography>
      </Box>

      {/* BID Number */}
      <Box mt={2} mb={1}>
        <Typography>
          <strong>BID NUMBER:</strong> {bidNumber}
        </Typography>
      </Box>

      {/* BUSINESS INFO */}
      <Box mt={1}>
        <Box mt={1} display="flex" justifyContent="center">
          <Typography variant="h6" align="center" sx={{ borderBottom: '1px solid #000', fontSize: '1rem', width: '80%' }}>
            {businessName}
          </Typography>
        </Box>
        <Typography variant="caption" align="center" display="block">
          BUSINESS NAME
        </Typography>

        <Box mt={2} display="flex" justifyContent="center">
          <Typography variant="h6" align="center" sx={{ borderBottom: '1px solid #000', fontSize: '1rem', width: '80%' }}>
            {businessAddress}
          </Typography>
        </Box>
        <Typography variant="caption" align="center" display="block">
          BUSINESS ADDRESS
        </Typography>
      </Box>

      {/* DATES */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mt={3}>
        <Typography variant="body2">
          <strong>DATE ISSUED:</strong> {new Date().toLocaleDateString('en-PH')}
        </Typography>
        <Typography variant="body2" textAlign="right">
          <strong>VALID UNTIL DECEMBER 31,</strong> {new Date().getFullYear()}
        </Typography>
      </Box>

      {/* LEGAL TEXT */}
      <Box mt={3}>
        {[
          `This Sanitary Permit is issued to covered Establishments as mandated and provided for by the Code on Sanitation of the Philippines (PD. 856), City Ordinance No. 53 Series of 2022, amended Sanitation Code of Pasig City (Ordinance No. 46 Series of 2008) adopting R.A. 9482, the Ease of Doing Business and Efficient Delivery of Government Services in furtherance of R.A. 9485 (Anti Red Tape Act of 2007), R.A. 11032 (Ease of Doing Business Act), and Department of Health Administrative Order No. 2020-0020, and other related laws, rules and regulations, and the Joint Memorandum Circular (JMC No. 01 Series of 2021) of DILG and DOH re: Harmonization of Sanitation Policies and Guidelines.`,
          `This Permit is issued on the condition that all applicable Minimum Sanitary Requirements (MSR) shall be strictly complied. Likewise, this Permit shall not exempt the Grantee from compliance of other requirements from other Government Agencies and Offices, including the Local Government Unit and its ordinances.`,
          `Accordingly, the Penal Provisions of aforesaid Laws and Ordinances shall be in full effect and applied, for any violations and non-compliance to the provisions of the same. This Permit is non-transferable and shall be presented in the premises of this Sanitary Permit in times of inspection and monitoring.`,
        ].map((text, i) => (
          <Typography key={i} variant="body2" align="justify" paragraph>
            {'\u00A0'.repeat(8)} <span dangerouslySetInnerHTML={{ __html: text }} />
          </Typography>
        ))}
      </Box>

      {/* SIGNATORIES */}
      <Box display="flex" justifyContent="space-between" mt={4}>
        {/* Left Column */}
        <Box width="48%">
          <Typography variant="body2" fontWeight="bold" mb={2}>
            RECOMMENDING APPROVAL:
          </Typography>
          <Box display="flex" justifyContent="center">
            <Box sx={{ borderTop: '1px solid #000', px: 2, textAlign: 'center' }}>
              <Typography variant="body1" fontWeight="bold" sx={{ fontSize: '0.9rem', pt: 1 }}>
                NORATA R. DANCEL, MD, DPPS
              </Typography>
              <Typography variant="caption">
                OIC, Environmental Sanitation Section
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Right Column */}
        <Box width="48%">
          <Typography variant="body2" fontWeight="bold" mb={2}>
            APPROVED:
          </Typography>
          <Box display="flex" justifyContent="center">
            <Box sx={{ borderTop: '1px solid #000', px: 2, textAlign: 'center' }}>
              <Typography variant="body1" fontWeight="bold" sx={{ fontSize: '0.9rem', pt: 1 }}>
                JOSEPH R. PANALIGAN, MD, MHA
              </Typography>
              <Typography variant="caption">
                City Health Officer
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      {/* INSPECTED BY */}
      <Box mb={3}>
        <Typography variant="body2" gutterBottom fontWeight="bold">
          INSPECTED BY:
        </Typography>
        <Typography variant="body2">
          Name of Sanitary Inspector: {officerName} &nbsp;&nbsp;
          Signature: ____________________ &nbsp;&nbsp; Date/Time Inspected: {inspectionDate}
        </Typography>
      </Box>

      {/* FOOTER */}
      <Typography variant="caption" align="center" display="block" fontWeight="bold">
        “A GAME CHANGER IN CONDUCTING BUSINESS TRANSACTIONS IN PASIG CITY”
      </Typography>
      <Typography variant="caption" align="center" display="block">
        This Sanitary Permit is NON-TRANSFERABLE and shall be DISPLAYED IN PUBLIC VIEW.
      </Typography>
      <Typography variant="caption" align="center" display="block">
        THIS PERMIT IS SUBJECT FOR INSPECTION
      </Typography>
    </Box>

    {/* PRINT BUTTON */}
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