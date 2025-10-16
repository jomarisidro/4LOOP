'use client';

import {
  Typography,
  Box,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TableContainer,
  Button,   
} from '@mui/material';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

function formatOrdinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function ViewTicketInspectionForm() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const router = useRouter();

  const {
    data: currentTicket,
    isLoading: loadingTicket,
    isError: errorTicket,
  } = useQuery({
    queryKey: ['ticket', id],
    queryFn: async () => {
      const res = await axios.get(`/api/ticket/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const year = new Date().getFullYear();
  const businessId = currentTicket?.business?._id;

  const {
    data: tickets,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['tickets', businessId, year],
    queryFn: async () => {
      const res = await axios.get(`/api/ticket?businessId=${businessId}&year=${year}`);
      return res.data;
    },
    enabled: !!businessId,
  });

  if (!id) return <Typography color="error">❌ No ticket ID provided</Typography>;
  if (loadingTicket || isLoading) return <Typography>Loading…</Typography>;
  if (errorTicket || isError || !tickets)
    return <Typography color="error">❌ Failed to load tickets</Typography>;

  const sortedTickets = tickets.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return (
    <Box p={5}>
      {/* Back button placed at the top */}
      <Button
        variant="outlined"
        color="primary"
        sx={{ mb: 2 }}
        onClick={() => router.back()}
      >
        ← Back
      </Button>

      {currentTicket?.inspectionNumber && (
        <Typography variant="subtitle1" mb={2}>
          This is the {formatOrdinal(currentTicket.inspectionNumber)} inspection for {year}.
        </Typography>
      )}

      <Typography color="text.secondary" mb={2}>
        👁️ Admin View — Read-Only Mode
      </Typography>

      <Typography variant="subtitle2" mb={1}>
        Date of Inspection:{' '}
        {currentTicket?.createdAt ? new Date(currentTicket.createdAt).toLocaleDateString() : '-'}
      </Typography>

      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table sx={{ tableLayout: 'fixed', width: '100%' }}>
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ width: 70 }}>BID Number</TableCell>
              <TableCell align="center" sx={{ width: 150 }}>Name of Establishment</TableCell>
              <TableCell align="center" sx={{ width: 150 }}>Address</TableCell>
              <TableCell align="center" sx={{ width: 175 }}>SP</TableCell>
              <TableCell align="center" sx={{ width: 210 }}>HC</TableCell>
              <TableCell align="center" sx={{ width: 50 }}>CP DW</TableCell>
              <TableCell align="center" sx={{ width: 50 }}>PC</TableCell>
              <TableCell align="center" sx={{ width: 50 }}>S.O 01</TableCell>
              <TableCell align="center" sx={{ width: 50 }}>S.O 02</TableCell>
              <TableCell align="center" sx={{ width: 150 }}>Date Re-Inspected</TableCell>
              <TableCell align="center" sx={{ width: 250 }}>Remarks</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {sortedTickets.map((t) => {
              const ic = t.inspectionChecklist || {};
              return (
                <TableRow key={t._id}>
                  <TableCell>{t.business?.bidNumber}</TableCell>
                  <TableCell>{t.business?.businessName}</TableCell>
                  <TableCell>{t.business?.businessAddress || '-'}</TableCell>
                  <TableCell align="center">
                    {ic.sanitaryPermit === 'with' ? 'W/' :
                      ic.sanitaryPermit === 'without' ? 'W/o' : '-'}
                  </TableCell>
                  <TableCell align="center">
                    AC: {ic.healthCertificates?.actualCount ?? 0}, W/: {ic.healthCertificates?.withCert ?? 0}, W/o:{' '}
                    {ic.healthCertificates?.withoutCert ?? 0}
                  </TableCell>
                  <TableCell align="center">
                    {ic.certificateOfPotability === 'check' ? '✔' :
                      ic.certificateOfPotability === 'x' ? '✘' : '-'}
                  </TableCell>
                  <TableCell align="center">
                    {ic.pestControl === 'check' ? '✔' :
                      ic.pestControl === 'x' ? '✘' : '-'}
                  </TableCell>
                  <TableCell align="center">
                    {ic.sanitaryOrder1 === 'check' ? '✔' :
                      ic.sanitaryOrder1 === 'x' ? '✘' : '-'}
                  </TableCell>
                  <TableCell align="center">
                    {ic.sanitaryOrder2 === 'check' ? '✔' :
                      ic.sanitaryOrder2 === 'x' ? '✘' : '-'}
                  </TableCell>
                  <TableCell align="center">
                    {t.dateReinspected
                      ? new Date(t.dateReinspected).toLocaleDateString()
                      : '-'}
                  </TableCell>
                  <TableCell align="center">{t.remarks || '-'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Typography variant="body2" color="text.secondary">
        Officer in Charge:{' '}
        {typeof currentTicket?.officerInCharge === 'object'
          ? `${currentTicket.officerInCharge.fullName || ''} (${currentTicket.officerInCharge.email || ''})`
          : currentTicket?.officerInCharge || 'N/A'}
      </Typography>
    </Box>
  );
}
