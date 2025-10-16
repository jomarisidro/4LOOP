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
    sanitaryOrder01: '',
    sanitaryOrder02: '',
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
    // ✅ 1. Get all previous inspections for the same business this year
    const res = await axios.get(`/api/ticket?businessId=${businessId}&year=${year}`);
    const inspectionsThisYear = res.data || [];

    // Filter out completed ones except current
    const completedInspections = inspectionsThisYear.filter(
      (t) => t.inspectionStatus === "completed" && t._id !== currentTicket._id
    );
    const completedCount = completedInspections.length;

    if (completedCount >= 2) {
      alert("Only 2 inspections are allowed per year.");
      return;
    }

    const inspectionNumber = completedCount + 1;
    const inspectionDate =
      inspectionNumber === 1
        ? currentTicket?.createdAt || new Date().toISOString()
        : new Date().toISOString();

    const officerInCharge =
      localStorage.getItem("loggedUserId") || sessionStorage.getItem("userId");

    // ✅ 2. Build the checklist data
    const inspectionChecklist = {
      sanitaryPermit: scores.sanitaryPermit,
      healthCertificates: {
        actualCount: Number(scores.healthCertificates?.actualCount) || 0,
        withCert: Number(scores.healthCertificates?.withCert) || 0,
        withoutCert: Number(scores.healthCertificates?.withoutCert) || 0,
      },
      certificateOfPotability: scores.certificateOfPotability,
      pestControl: scores.pestControl,
      sanitaryOrder01: scores.sanitaryOrder01,
      sanitaryOrder02: scores.sanitaryOrder02,
    };

    const ticketPayload = {
      inspectionDate,
      inspectionType: inspectionNumber === 1 ? "routine" : "reinspection",
      violationType: "sanitation",
      remarks,
      inspectionChecklist,
      inspectionStatus: "completed",
      inspectionNumber,
      officerInCharge,
    };

    // ✅ 3. Save ticket (POST for first, PUT for reinspection)
    const ticketRes =
      inspectionNumber === 1
        ? await axios.post(`/api/ticket`, { businessId, ...ticketPayload })
        : await axios.put(`/api/ticket/${currentTicket._id}`, ticketPayload);

    const ticketId = ticketRes.data?._id || currentTicket._id;

    // ✅ 4. Detect violations based on checklist
    const detectedViolations = [];

    if (scores.sanitaryPermit === "without") {
      detectedViolations.push({
        code: "no_sanitary_permit",
        description: "Business operating without a valid sanitary permit.",
      });
    }

    if ((scores.healthCertificates?.withoutCert || 0) > 0) {
      detectedViolations.push({
        code: "no_health_certificate",
        description: "Personnel without valid health certificates.",
      });
    }

    if (scores.certificateOfPotability === "x") {
      detectedViolations.push({
        code: "expired_documents",
        description: "No valid certificate of potability or expired document.",
      });
    }

    if (
      scores.pestControl === "x" ||
      scores.sanitaryOrder01 === "x" ||
      scores.sanitaryOrder02 === "x"
    ) {
      detectedViolations.push({
        code: "failure_renew_sanitary",
        description:
          "Non-compliance with sanitary orders or pest control requirements.",
      });
    }

    // ✅ 5. Apply penalties ONLY during reinspection
    if (inspectionNumber === 2 && detectedViolations.length > 0) {
      console.log("⚖️ Reinspection detected — applying penalties...");

      for (const v of detectedViolations) {
        try {
          const prevViolations = await axios.get(
            `/api/violation?code=${v.code}&businessId=${businessId}`
          );
          const priorCount = prevViolations.data?.length || 0;

          // Determine offense level
          const offenseCount = priorCount + 1;
          let amount = 0;

          switch (v.code) {
            case "no_sanitary_permit":
              amount = offenseCount === 1 ? 2000 : offenseCount === 2 ? 3000 : 5000;
              break;
            case "no_health_certificate":
              amount = (scores.healthCertificates?.withoutCert || 0) * 500;
              break;
            case "expired_documents":
              amount = 500;
              break;
            case "failure_renew_sanitary":
              amount = offenseCount === 1 ? 1000 : offenseCount === 2 ? 2000 : 5000;
              break;
            default:
              amount = 0;
          }

          await axios.post(`/api/violation`, {
            ...v,
            ticketId,
            businessId,
            offenseCount,
            penaltyAmount: amount,
            violationStatus: "pending",
          });

          console.log(`✅ Violation ${v.code} recorded — ₱${amount}`);
        } catch (vErr) {
          console.error("❌ Violation creation failed:", vErr.response?.data || vErr);
        }
      }
    } else {
      console.log("🧾 Routine inspection only — no penalties applied yet.");
    }

    // ✅ 6. Mark if business has active violations
    if (detectedViolations.length > 0) {
      await axios.put(`/api/business/${businessId}`, {
        status: "pending",
        remarks: `Violations found during inspection #${inspectionNumber}.`,
      });
    }

    // ✅ 7. Refresh and navigate
    queryClient.invalidateQueries(["tickets", businessId, year]);
    queryClient.invalidateQueries(["pending-inspections"]);
    router.push("/officers/inspections/pendinginspections");
  } catch (err) {
    console.error("❌ Ticket error:", err.response?.data || err);
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
                      onClick={() => handleToggleChecklist('sanitaryOrder01')}
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
                        ? scores.sanitaryOrder01 === 'check'
                          ? '✔'
                          : scores.sanitaryOrder01 === 'x'
                            ? '✘'
                            : ''
                        : ic.sanitaryOrder01 === 'check'
                          ? '✔'
                          : ic.sanitaryOrder01 === 'x'
                            ? '✘'
                            : ''}
                    </Box>
                  </TableCell>

                  {/* SO02 */}
                  <TableCell align="center">
                    <Box
                      onClick={() => handleToggleChecklist('sanitaryOrder02')}
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
                        ? scores.sanitaryOrder02 === 'check'
                          ? '✔'
                          : scores.sanitaryOrder02 === 'x'
                            ? '✘'
                            : ''
                        : ic.sanitaryOrder02 === 'check'
                          ? '✔'
                          : ic.sanitaryOrder02 === 'x'
                            ? '✘'
                            : ''}
                    </Box>
                  </TableCell>

                  <TableCell align="center">
                    {isActive ? (
                      tickets.filter((ticket) => ticket.inspectionStatus === 'completed').length === 1 ? (
                        <TextField
                          type="date"
                          size="small"
                          value={
                            dateReinspected ||
                            new Date().toISOString().split('T')[0] // ✅ auto-set to today's date
                          }
                          disabled // ✅ not editable
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
