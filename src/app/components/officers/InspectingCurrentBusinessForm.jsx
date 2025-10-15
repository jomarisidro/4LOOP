'use client';

import {
  Typography,
  Box,
  Button,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  TableContainer,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

function formatOrdinal(n) {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export default function InspectingCurrentBusinessForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const queryClient = useQueryClient();

  // Fetch current ticket
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
  const isReadOnly = currentTicket?.inspectionStatus === 'completed';

  // Fetch all tickets for the business
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

  // Form states
  const [scores, setScores] = useState({
    sanitaryPermit: '',
    hc_ac: '',
    hc_with: '',
    hc_without: '',
    certificateOfPotability: '',
    pestControl: '',
    sanitaryOrder1: '',
    sanitaryOrder2: '',
  });
  const [remarks, setRemarks] = useState('');
  const [dateReinspected, setDateReinspected] = useState('');

  useEffect(() => {
    if (currentTicket?.inspectionChecklist) {
      setScores(currentTicket.inspectionChecklist);
      setRemarks(currentTicket.remarks || '');
      setDateReinspected(currentTicket.dateReinspected || '');
    }
  }, [currentTicket]);

  const handleScoreChange = (field, value) => {
    if (isReadOnly) return;
    setScores((prev) => ({ ...prev, [field]: value }));
  };

  const handleToggleChecklist = (field) => {
    if (isReadOnly) return;
    setScores((prev) => {
      let next = '';
      if (prev[field] === '') next = 'check';
      else if (prev[field] === 'check') next = 'x';
      else next = '';
      return { ...prev, [field]: next };
    });
  };

  const handleCompleteInspection = async () => {
  if (isReadOnly) return;

  try {
    const res = await axios.get(`/api/ticket?businessId=${businessId}&year=${year}`);
    const inspectionsThisYear = res.data || [];

    const completedInspectionsCount = inspectionsThisYear.filter(
      (t) => t.inspectionStatus === 'completed' && t._id !== currentTicket._id
    ).length;

    if (completedInspectionsCount >= 2) {
      alert('Only 2 inspections are allowed per year.');
      return;
    }

    const inspectionNumber = completedInspectionsCount + 1;
    const inspectionDate =
      inspectionNumber === 1
        ? currentTicket?.createdAt || new Date().toISOString()
        : dateReinspected;

    // ✅ Get logged-in officer info (from localStorage or sessionStorage)
    const officerInCharge =
      localStorage.getItem('loggedUserId') || sessionStorage.getItem('userId');

    const inspectionChecklist = {
      sanitaryPermit: scores.sanitaryPermit,
      healthCertificates: {
        actualCount: Number(scores.healthCertificates?.actualCount) || 0,
        withCert: Number(scores.healthCertificates?.withCert) || 0,
        withoutCert: Number(scores.healthCertificates?.withoutCert) || 0,
      },
      certificateOfPotability: scores.certificateOfPotability,
      pestControl: scores.pestControl,
      sanitaryOrder01: scores.sanitaryOrder1,
      sanitaryOrder02: scores.sanitaryOrder2,
    };

    if (inspectionNumber === 1) {
      // ✅ Include officerInCharge in POST
      await axios.post(`/api/ticket`, {
        businessId,
        inspectionDate,
        inspectionType: 'routine',
        violationType: 'sanitation',
        remarks,
        inspectionChecklist,
        inspectionStatus: 'completed',
        officerInCharge, // ✅ added field
      });
    } else {
      // ✅ Include officerInCharge in PUT
      await axios.put(`/api/ticket/${currentTicket._id}`, {
        inspectionDate,
        inspectionType: 'reinspection',
        violationType: 'sanitation',
        remarks,
        inspectionChecklist,
        inspectionStatus: 'completed',
        inspectionNumber,
        officerInCharge, // ✅ added field
      });
    }

    queryClient.invalidateQueries(['tickets', businessId, year]);
    queryClient.invalidateQueries(['pending-inspections']);
    router.push('/officers/inspections/pendinginspections');
  } catch (err) {
    console.error('❌ Ticket error:', err.response?.data || err);
  }
};



  if (!id) return <Typography color="error">❌ No ticket ID provided</Typography>;
  if (loadingTicket || isLoading) return <Typography>Loading…</Typography>;
  if (errorTicket || isError || !tickets)
    return <Typography color="error">❌ Failed to load tickets</Typography>;

  const sortedTickets = tickets.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return (
    <Box p={4}>
      {currentTicket?.inspectionNumber && (
        <Typography variant="subtitle1" mb={2}>
          This is the {formatOrdinal(currentTicket.inspectionNumber)} inspection for {year}.
        </Typography>
      )}

      {isReadOnly && (
        <Typography color="text.secondary" mb={2}>
          ✅ This inspection is <strong>completed</strong>. You are viewing it in read-only mode.
        </Typography>
      )}

      <Typography variant="subtitle2" mb={1}>
        Date of Inspection:{' '}
        {currentTicket?.createdAt ? new Date(currentTicket.createdAt).toLocaleDateString() : '-'}
      </Typography>

      {/* ✅ Table Format Kept Exactly the Same */}
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
              const isActive = t._id === id;
              const ic = t.inspectionChecklist || {};

              return (
                <TableRow key={t._id}>
                  <TableCell>{t.business?.bidNumber}</TableCell>
                  <TableCell>{t.business?.businessName}</TableCell>
                  <TableCell>{t.business?.businessAddress || '-'}</TableCell>

                  {/* SP */}
                  <TableCell align="center">
                    {isActive ? (
                      <RadioGroup
                        row
                        value={scores.sanitaryPermit}
                        onChange={(e) => handleScoreChange('sanitaryPermit', e.target.value)}
                      >
                        <FormControlLabel value="with" control={<Radio disabled={isReadOnly} />} label="W/" />
                        <FormControlLabel value="without" control={<Radio disabled={isReadOnly} />} label="W/o" />
                      </RadioGroup>
                    ) : (
                      ic.sanitaryPermit === 'with' ? 'W/' : ic.sanitaryPermit === 'without' ? 'W/o' : '-'
                    )}
                  </TableCell>

             {/* HC */}
<TableCell align="center">
  {isActive ? (
    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
      <TextField
        type="number"
        size="small"
        label="AC"
        value={scores.healthCertificates?.actualCount ?? ''}
        disabled={isReadOnly}
        onChange={(e) =>
          setScores((prev) => ({
            ...prev,
            healthCertificates: {
              ...prev.healthCertificates,
              actualCount: Number(e.target.value),
            },
          }))
        }
        sx={{ width: 55 }}
      />
      <TextField
        type="number"
        size="small"
        label="W/"
        value={scores.healthCertificates?.withCert ?? ''}
        disabled={isReadOnly}
        onChange={(e) =>
          setScores((prev) => ({
            ...prev,
            healthCertificates: {
              ...prev.healthCertificates,
              withCert: Number(e.target.value),
            },
          }))
        }
        sx={{ width: 55 }}
      />
      <TextField
        type="number"
        size="small"
        label="W/o"
        value={scores.healthCertificates?.withoutCert ?? ''}
        disabled={isReadOnly}
        onChange={(e) =>
          setScores((prev) => ({
            ...prev,
            healthCertificates: {
              ...prev.healthCertificates,
              withoutCert: Number(e.target.value),
            },
          }))
        }
        sx={{ width: 55 }}
      />
    </Box>
  ) : (
    <>
      AC: {ic.healthCertificates?.actualCount ?? 0}, W/: {ic.healthCertificates?.withCert ?? 0}, W/o:{' '}
      {ic.healthCertificates?.withoutCert ?? 0}
    </>
  )}
</TableCell>


                  {/* CPDW */}
                  <TableCell align="center">
                    <Box
                      onClick={() => handleToggleChecklist('certificateOfPotability')}
                      sx={{
                        width: 30,
                        height: 30,
                        border: '1px solid #999',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isReadOnly ? 'default' : 'pointer',
                        userSelect: 'none',
                        fontSize: '1.2rem',
                        opacity: isReadOnly ? 0.6 : 1,
                      }}
                    >
                      {isActive
                        ? scores.certificateOfPotability === 'check'
                          ? '✔'
                          : scores.certificateOfPotability === 'x'
                          ? '✘'
                          : ''
                        : ic.certificateOfPotability === 'check'
                        ? '✔'
                        : ic.certificateOfPotability === 'x'
                        ? '✘'
                        : ''}
                    </Box>
                  </TableCell>

                  {/* PC */}
                  <TableCell align="center">
                    <Box
                      onClick={() => handleToggleChecklist('pestControl')}
                      sx={{
                        width: 30,
                        height: 30,
                        border: '1px solid #999',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isReadOnly ? 'default' : 'pointer',
                        userSelect: 'none',
                        fontSize: '1.2rem',
                        opacity: isReadOnly ? 0.6 : 1,
                      }}
                    >
                      {isActive
                        ? scores.pestControl === 'check'
                          ? '✔'
                          : scores.pestControl === 'x'
                          ? '✘'
                          : ''
                        : ic.pestControl === 'check'
                        ? '✔'
                        : ic.pestControl === 'x'
                        ? '✘'
                        : ''}
                    </Box>
                  </TableCell>

                  {/* SO01 */}
                  <TableCell align="center">
                    <Box
                      onClick={() => handleToggleChecklist('sanitaryOrder1')}
                      sx={{
                        width: 30,
                        height: 30,
                        border: '1px solid #999',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isReadOnly ? 'default' : 'pointer',
                        userSelect: 'none',
                        fontSize: '1.2rem',
                        opacity: isReadOnly ? 0.6 : 1,
                      }}
                    >
                      {isActive
                        ? scores.sanitaryOrder1 === 'check'
                          ? '✔'
                          : scores.sanitaryOrder1 === 'x'
                          ? '✘'
                          : ''
                        : ic.sanitaryOrder1 === 'check'
                        ? '✔'
                        : ic.sanitaryOrder1 === 'x'
                        ? '✘'
                        : ''}
                    </Box>
                  </TableCell>

                  {/* SO02 */}
                  <TableCell align="center">
                    <Box
                      onClick={() => handleToggleChecklist('sanitaryOrder2')}
                      sx={{
                        width: 30,
                        height: 30,
                        border: '1px solid #999',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: isReadOnly ? 'default' : 'pointer',
                        userSelect: 'none',
                        fontSize: '1.2rem',
                        opacity: isReadOnly ? 0.6 : 1,
                      }}
                    >
                      {isActive
                        ? scores.sanitaryOrder2 === 'check'
                          ? '✔'
                          : scores.sanitaryOrder2 === 'x'
                          ? '✘'
                          : ''
                        : ic.sanitaryOrder2 === 'check'
                        ? '✔'
                        : ic.sanitaryOrder2 === 'x'
                        ? '✘'
                        : ''}
                    </Box>
                  </TableCell>

                  {/* Date Reinspection */}
                  <TableCell align="center">
                    {isActive ? (
                      tickets.filter((ticket) => ticket.inspectionStatus === 'completed').length === 1 ? (
                        <TextField
                          type="date"
                          size="small"
                          value={dateReinspected}
                          disabled={isReadOnly}
                          onChange={(e) => setDateReinspected(e.target.value)}
                          sx={{ width: 140 }}
                        />
                      ) : (
                        '-'
                      )
                    ) : t.dateReinspected ? (
                      new Date(t.dateReinspected).toLocaleDateString()
                    ) : (
                      '-'
                    )}
                  </TableCell>

                  {/* Remarks */}
                  <TableCell align="center">
                    {isActive ? (
                      <TextField
                        size="small"
                        fullWidth
                        value={remarks}
                        disabled={isReadOnly}
                        onChange={(e) => setRemarks(e.target.value)}
                      />
                    ) : (
                      t.remarks || '-'
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Box display="flex" gap={2}>
        <Button
          variant="contained"
          color="primary"
          onClick={handleCompleteInspection}
          disabled={isReadOnly}
        >
          Complete Inspection
        </Button>
        <Button
          variant="outlined"
          color="error"
          onClick={() => router.push('/officers/inspections/pendinginspections')}
        >
          Back
        </Button>
      </Box>
    </Box>
  );
}
