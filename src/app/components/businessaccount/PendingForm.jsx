'use client';
import {
  HiChevronDown,
  HiChevronUp,
  HiSearch,
} from 'react-icons/hi';
import {
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Typography,
  Stack,
  Paper,
  Box,
  Button,
  TextField,
  MenuItem,
  InputAdornment,
  Divider,
  CircularProgress,
} from '@mui/material';
import { getSanitationOnlineRequest } from '@/app/services/OnlineRequest';

export default function PendingRequestForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['pending-requests'],
    queryFn: async () => {
      const res = await getSanitationOnlineRequest();
      const all = res?.data || [];

      // ✅ Only show "pending" statuses
      const pendingStatuses = ['pending', 'pending2', 'pending3'];
      const pending = all.filter((req) => pendingStatuses.includes(req.status));

      // ✅ Remove duplicates (if any)
      const unique = Array.from(new Map(pending.map((r) => [r._id, r])).values());
      return unique;
    },
    refetchInterval: 5000,
  });

  const [requests, setRequests] = useState([]);
  const [searchType, setSearchType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expanded, setExpanded] = useState({});

 const displayStatus = (status) => {
  switch (status) {
    case 'draft':
      return '(-)';
    case 'pending':
    case 'pending2':
    case 'pending3':
      return 'Processing';
    case 'completed':
      return 'Approved';
    case 'released':
      return 'Valid';
    case 'expired':
      return 'Expired';
    default:
      return status || '-';
  }
};

  useEffect(() => {
    if (data) setRequests(data);
  }, [data]);

  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests;
    const q = searchQuery.toLowerCase();

    return requests.filter((r) => {
      if (searchType === 'all') {
        return (
          r.bidNumber?.toLowerCase().includes(q) ||
          r.businessName?.toLowerCase().includes(q) ||
          r.businessNickname?.toLowerCase().includes(q)
        );
      }
      return r[searchType]?.toLowerCase().includes(q);
    });
  }, [requests, searchType, searchQuery]);

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (isLoading) {
    return (
      <Box mt={4} textAlign="center">
        <CircularProgress />
        <Typography mt={2}>Loading pending requests...</Typography>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box mt={4} textAlign="center">
        <Typography color="error">
          ❌ Failed to load: {error?.message}
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="w-full bg-white shadow rounded-lg p-6">
      {/* Header */}
      <div className="flex justify-start mb-6">
        <Button
          variant="outlined"
          color="secondary"
          onClick={() => router.push('/businessaccount/businesses/')}
        >
          ↩️ Back to Online Request Lists
        </Button>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-blue-900 uppercase">
          Pending Requests
        </h1>
        <Divider className="my-3" />
      </div>

      {/* 🔍 Search + Count */}
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap={2}
        mb={6}
      >
        <Box
          display="flex"
          flexDirection={{ xs: 'column', sm: 'row' }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
          justifyContent="center"
          gap={2}
          width="100%"
        >
          <TextField
            select
            label="Search By"
            value={searchType}
            onChange={(e) => setSearchType(e.target.value)}
            size="small"
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="bidNumber">BID Number</MenuItem>
            <MenuItem value="businessName">Business Name</MenuItem>
            <MenuItem value="businessNickname">Trade Name</MenuItem>
            <MenuItem value="businessType">Business Type</MenuItem>
            <MenuItem value="businessAddress">Business Address</MenuItem>
            <MenuItem value="landmark">Landmark</MenuItem>
            <MenuItem value="contactPerson">Contact Person</MenuItem>
            <MenuItem value="contactNumber">Contact Number</MenuItem>
          </TextField>

          <TextField
            placeholder="Enter search term..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <HiSearch className="text-gray-500" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Typography
          variant="body2"
          color="textSecondary"
          sx={{ mt: 1, textAlign: 'center' }}
        >
          Showing <strong>{filteredRequests.length}</strong>{' '}
          {filteredRequests.length === 1 ? 'pending request' : 'pending requests'}
        </Typography>
      </Box>

      {/* 🧾 Pending Requests List */}
      {filteredRequests.map((req) => {
        const isExpanded = expanded[req._id];
        return (
          <Paper
            key={req._id}
            elevation={2}
            className="p-6 mb-12 rounded-lg border border-gray-300 bg-white relative"
          >
            {/* Main Info */}
           <div className="w-full max-w-4xl mx-auto space-y-6 mb-15">
  {[
    ['BID Number', req.bidNumber],
    ['Business Name', req.businessName],
    ['Trade Name', req.businessNickname],
    ['Business Type', req.businessType],
    ['Business Address', req.businessAddress],
    ['Landmark', req.landmark],
    ['Contact Person', req.contactPerson],
    ['Contact Number', req.contactNumber],
    ['Request Type', req.requestType],
 ['Status', displayStatus(req.status)],
    [
      'Submitted On',
      req.createdAt
        ? new Date(req.createdAt).toLocaleString('en-PH')
        : '—',
    ],
    [
      'Last Updated',
      req.updatedAt
        ? new Date(req.updatedAt).toLocaleString('en-PH')
        : '—',
    ],
  ]
    .reduce((rows, [label, value]) => {
      const pair = (
        <div key={label} className="flex items-start gap-2">
          <span className="min-w-[180px] text-sm font-semibold text-gray-700">
            {label}:
          </span>
          <span className="flex-1 min-h-[40px] bg-gray-100 text-gray-800 px-3 py-2 rounded-md border border-gray-300">
            {value || '—'}
          </span>
        </div>
      );
      const last = rows[rows.length - 1];
      if (!last || last.length === 2) rows.push([pair]);
      else last.push(pair);
      return rows;
    }, [])
    .map((row, i) => (
      <div key={i} className="grid grid-cols-2 gap-6">
        {row}
      </div>
    ))}

  {/* Remarks (Full width) */}
  <div className="grid grid-cols-1 mt-4">
    <div className="flex items-start gap-2">
      <span className="min-w-[180px] text-sm font-semibold text-gray-700">
        Remarks:
      </span>
      <span className="flex-1 min-h-[100px] whitespace-pre-line bg-gray-100 text-gray-800 px-3 py-2 rounded-md border border-gray-300">
        {req.remarks || 'None'}
      </span>
    </div>
  </div>
</div>


            {/* Expand Button */}
            <div className="flex justify-center mt-6">
              <Button
                variant="outlined"
                color="primary"
                onClick={() => toggleExpand(req._id)}
                startIcon={isExpanded ? <HiChevronUp /> : <HiChevronDown />}
              >
                {isExpanded ? 'Hide Details' : 'View More'}
              </Button>
            </div>

            {/* Expanded Details (MSR + Inspection) */}
            {isExpanded && (
              <>
                {/* --- MSR Section --- */}
                <Divider className="my-10">
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    MSR
                  </Typography>
                </Divider>

                <div className="w-full max-w-4xl mx-auto space-y-10 mb-15">
                  {/* A. Sanitary Permit Checklist */}
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 text-center mb-4">
                      A. Sanitary Permit Checklist
                    </h3>
                    {req.sanitaryPermitChecklist?.length ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {req.sanitaryPermitChecklist.map((item, i) => (
                          <div
                            key={i}
                            className="bg-gray-100 text-gray-800 text-sm px-3 py-2 rounded-md border border-gray-300"
                          >
                            {item.label}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center italic">
                        No checklist items available.
                      </p>
                    )}
                  </div>

                  {/* B. Health Certificate Checklist */}
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 text-center mb-4">
                      B. Health Certificate Checklist
                    </h3>
                    {req.healthCertificateChecklist?.length ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {req.healthCertificateChecklist.map((item, i) => (
                          <div
                            key={i}
                            className="bg-gray-100 text-gray-800 text-sm px-3 py-2 rounded-md border border-gray-300"
                          >
                            {item.label}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center italic">
                        No checklist items available.
                      </p>
                    )}
                  </div>

                  {/* C. MSR Checklist */}
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 text-center mb-4">
                      C. Minimum Sanitary Requirements (MSR)
                    </h3>
                    {req.msrChecklist?.length ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {req.msrChecklist.map((item, i) => (
                          <div
                            key={i}
                            className="grid grid-cols-4 gap-2 bg-gray-100 text-gray-800 text-sm px-3 py-2 rounded-md border border-gray-300"
                          >
                            <div className="col-span-3 font-medium">{item.label}</div>
                            <div className="col-span-1 text-red-700 text-right">
                              {item.dueDate
                                ? `Due: ${new Date(item.dueDate).toLocaleDateString('en-PH')}`
                                : 'No due date'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center italic">
                        No checklist items available.
                      </p>
                    )}
                  </div>
                </div>

                {/* --- Inspection and Penalty Records --- */}
                <Divider className="my-10">
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    Inspection and Penalty Records
                  </Typography>
                </Divider>

                <div className="w-full max-w-4xl mx-auto space-y-6 mb-10 mt-10">
                  {[
                    ['Health Cert Fee', req.healthCertFee ?? '—'],
                    ['Sanitary Fee', req.healthCertSanitaryFee ?? '—'],
                    [
                      'OR Date (Health Cert)',
                      req.orDateHealthCert
                        ? new Date(req.orDateHealthCert).toLocaleDateString('en-PH')
                        : '—',
                    ],
                    ['OR Number (Health Cert)', req.orNumberHealthCert ?? '—'],
                    ['Inspection Status', req.inspectionStatus ?? '—'],
        
                    ['Inspection Count', req.inspectionCountThisYear ?? '—'],
                    ['Recorded Violation', req.recordedViolation ?? '—'],
                 
                  ]
                    .reduce((rows, [label, value]) => {
                      const pair = (
                        <div key={label} className="flex items-start gap-2">
                          <span className="min-w-[180px] text-sm font-semibold text-gray-700">
                            {label}:
                          </span>
                          <span className="flex-1 bg-gray-100 text-gray-800 text-sm px-3 py-2 rounded-md border border-gray-300">
                            {value}
                          </span>
                        </div>
                      );
                      const lastRow = rows[rows.length - 1];
                      if (!lastRow || lastRow.length === 2) rows.push([pair]);
                      else lastRow.push(pair);
                      return rows;
                    }, [])
                    .map((row, i) => (
                      <div key={i} className="grid grid-cols-2 gap-6">
                        {row}
                      </div>
                    ))}
                </div>
              </>
            )}
          </Paper>
        );
      })}
    </Box>
  );
}
