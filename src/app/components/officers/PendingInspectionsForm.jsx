'use client';

import { useRouter } from 'next/navigation';
import {
  Typography,
  Box,
  Button,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  CircularProgress,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

export default function PendingInspectionsForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // ✅ Use placeholderData for instant UI feedback + refetch background
  const { data: pendingData, isLoading, isFetching } = useQuery({
    queryKey: ['pending-inspections'],
    queryFn: async () => {
      const res = await axios.get('/api/ticket?status=pending');
      return res.data;
    },
    refetchInterval: 1000 * 30, // auto refresh every 30s
    staleTime: 1000 * 10, // keep data fresh for 10s
    cacheTime: 1000 * 60, // cache 1 minute
  });

  const handleBack = () => {
    router.push('/officers/inspections');
  };

  const handleCancelInspection = async (ticketId) => {
    try {
      await axios.put(`/api/ticket/${ticketId}`, {
        inspectionStatus: 'none',
      });
      queryClient.invalidateQueries(['pending-inspections']);
    } catch (err) {
      console.error('Error cancelling inspection:', err);
    }
  };

  return (
    <Box position="relative" p={4}>
      <Button variant="outlined" onClick={handleBack} sx={{ mb: 2 }}>
        ← Back
      </Button>

      <Typography variant="h6" fontWeight="bold" mb={4}>
        🧾 Pending Inspection Tickets
      </Typography>

      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Ticket #</TableCell>
                <TableCell>BID #</TableCell>
                <TableCell>Business Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Remarks</TableCell>
                <TableCell>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pendingData?.length > 0 ? (
                pendingData.map((ticket) => (
                  <TableRow key={ticket._id}>
                    <TableCell>{ticket.ticketNumber}</TableCell>
                    <TableCell>{ticket.business?.bidNumber}</TableCell>
                    <TableCell>{ticket.business?.businessName}</TableCell>
                    <TableCell>{ticket.inspectionType}</TableCell>
                    <TableCell>{ticket.remarks || '-'}</TableCell>
                    <TableCell>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => {
                          console.log("Opening ticket:", ticket._id, ticket.business?._id);
                          router.push(`/officers/inspections/pendinginspections/inspectingcurrentbusiness?id=${ticket._id}`);
                        }}
                        sx={{ mr: 1 }}
                      >
                        Open
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        onClick={() => handleCancelInspection(ticket._id)}
                      >
                        Cancel
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6}>No pending inspections</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {isFetching && (
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Updating list...
        </Typography>
      )}
    </Box>
  );
}
