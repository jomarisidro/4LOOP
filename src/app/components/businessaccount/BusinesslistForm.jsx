'use client';
import * as yup from 'yup';
import { HiPencilAlt, HiX, HiSave, HiTrash, HiChevronDown, HiChevronUp, HiSearch } from 'react-icons/hi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { TextField, MenuItem, InputAdornment } from '@mui/material';
import { getAddOwnerBusiness } from '@/app/services/BusinessService';
import {
  Typography,
  Stack,
  Paper,
  Box,
  Button,
  CircularProgress,
  Divider,
} from '@mui/material';
// Helper to format violation codes nicely
function formatViolationCode(code) {
  if (!code) return '';
  return code
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}


const schema = yup.object().shape({
  bidNumber: yup
    .string()
    .required('BID Number is required')
    .matches(/^[A-Z]{2}-\d{4}-\d{6}$/, 'Format must be like AM-2025-123456')
    .length(14, 'BID Number must be exactly 14 characters long'),
  businessName: yup.string().required('Name of Company is required'),
  businessNickname: yup.string().required('Trade Name is required'),
  businessType: yup.string().required('Line of Business is required'),
  businessAddress: yup.string().required('Business Address is required'),
  contactPerson: yup.string().required('Contact Person is required'),
  contactNumber: yup
    .string()
    .required('Contact Number is required')
    .matches(/^09\d{9}$/, 'Enter a valid 11-digit mobile number (e.g. 09123456789)')
    .length(11, 'Must be exactly 11 digits')
});
export default function BusinesslistForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['business-list'],
    queryFn: () => getAddOwnerBusiness(),
  });

  const [businesses, setBusinesses] = useState([]);

  const [searchType, setSearchType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expanded, setExpanded] = useState({}); // ✅ track expanded businesses

  const validateBusiness = () => {
    const errors = {};
    return errors;
  };

  const displayStatus = (status) => {
    switch (status) {
      case 'draft':
        return '-';
      case 'submitted':
        return 'Request Submitted';
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
  async function fetchInspectionDetails() {
    if (!data?.data) return;

    try {
      const res = await fetch(`/api/ticket`);
      if (!res.ok) return;

      const allTickets = await res.json();

      const updatedBusinesses = await Promise.all(
        data.data.map(async (biz) => {
          const bizTickets = allTickets.filter(
            (t) => t.business === biz._id || t.business?._id === biz._id
          );

          const latestTicket = bizTickets.length
            ? bizTickets.sort(
                (a, b) =>
                  new Date(b.inspectionDate) - new Date(a.inspectionDate)
              )[0]
            : null;

          const violations = latestTicket?.violations || [];

          // ✅ Aggregate violation codes for display
          const recordedViolation =
            violations.length > 0
              ? violations.map((v) => v.code).join(", ")
              : "—";

          // ✅ Calculate total penalty fee
          const penaltyFee =
            violations.length > 0
              ? violations.reduce((sum, v) => sum + (v.penalty || 0), 0)
              : 0;

          return {
            ...biz,
            inspectionStatus: latestTicket?.inspectionStatus || "-",
            resolutionStatus: latestTicket?.resolutionStatus || "-",
            violations,
            recordedViolation,
            penaltyFee,
          };
        })
      );

      setBusinesses(updatedBusinesses);
    } catch (err) {
      console.error("Failed to fetch inspection details:", err);
    }
  }

  fetchInspectionDetails();
}, [data]);



  const handleDelete = async (businessId, status) => {
    // ✅ Only allow delete for drafts
    if (status !== 'draft') {
      alert('❌ Only businesses in draft status can be deleted.');
      return;
    }

    const confirmDelete = window.confirm('Are you sure you want to permanently delete this business?');
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/business/${businessId}`, {
        method: 'DELETE',
      });

      const result = await res.json();

      if (!res.ok) {
        alert(result.error || 'Failed to delete business.');
        return;
      }

      alert('✅ Business deleted permanently.');
      await queryClient.invalidateQueries(['business-list']);
    } catch (err) {
      console.error('Delete failed:', err);
      alert('An error occurred while deleting the business.');
    }
  };




  const filteredBusinesses = useMemo(() => {
    if (!searchQuery.trim()) return businesses;
    const query = searchQuery.toLowerCase();

    return businesses.filter((biz) => {
      if (searchType === 'all') {
        return (
          biz.bidNumber?.toLowerCase().includes(query) ||
          biz.businessName?.toLowerCase().includes(query) ||
          biz.businessNickname?.toLowerCase().includes(query)
        );
      }
      return biz[searchType]?.toLowerCase().includes(query);
    });
  }, [businesses, searchType, searchQuery]);

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (isLoading) {
    return (
      <Box mt={4} textAlign="center">
        <CircularProgress />
        <Typography mt={2}>Loading businesses...</Typography>
      </Box>
    );
  }

  if (isError) {
    return (
      <Box mt={4} textAlign="center">
        <Typography color="error">❌ Failed: {error?.message}</Typography>
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
          My Businesses
        </h1>
        <Divider className="my-3" />
      </div>

      {/* 🔍 Search Controls */}
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap={2}
        mb={6}
      >
        {/* Search controls row */}
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

        {/* ✅ Total Count Display */}
        <Typography
          variant="body2"
          color="textSecondary"
          sx={{ mt: 1, textAlign: 'center' }}
        >
          Showing <strong>{filteredBusinesses.length}</strong>{' '}
          {filteredBusinesses.length === 1 ? 'business' : 'businesses'}
        </Typography>
      </Box>


      {filteredBusinesses.map((business) => {


        const isExpanded = expanded[business._id];

        return (
          <Paper
            key={business._id}
            elevation={2}
            className="p-6 mb-12 rounded-lg border border-gray-300 bg-white relative"
          >
            {/* Action Buttons */}
            <div className="absolute -top-5 -right-5">
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => handleDelete(business._id, business.status)}
                  startIcon={<HiTrash />}
                  disabled={business.status !== 'draft'}
                >
                  Delete
                </Button>
              </Stack>
            </div>

            <div className="w-full max-w-4xl mx-auto space-y-6 mb-15">
              {/* Basic Info */}
              {[['BID Number', 'bidNumber'],
              ['Permit Status', 'status'],
              ['Business Name', 'businessName'],
              ['Trade Name', 'businessNickname'],
              ['Business Type', 'businessType'],
              ['Landmark', 'landmark'],
              ['Business Address', 'businessAddress']]
                .reduce((rows, [label, field]) => {
                  const value = business[field] || '—';

                  const element = (
                    <div key={field} className="flex items-start gap-2 w-full">
                      <span className="min-w-[180px] text-sm font-semibold text-gray-700">
                        {label}:
                      </span>
                      <span className="w-full min-h-[40px] bg-gray-100 text-gray-800 px-3 py-2 rounded-md border border-gray-300">
                        {field === 'status' ? displayStatus(value) : value}
                      </span>
                    </div>
                  );

                  const isFullRow = field === 'businessAddress';
                  const item = { element, fullRow: isFullRow };

                  if (isFullRow || !rows.length || rows[rows.length - 1].length === 2) {
                    rows.push([item]);
                  } else {
                    rows[rows.length - 1].push(item);
                  }

                  return rows;
                }, [])
                .map((row, i) => (
                  <div key={i} className="grid grid-cols-2 gap-6">
                    {row.map(({ element, fullRow }, j) => (
                      <div key={j} className={fullRow ? 'col-span-2' : ''}>
                        {element}
                      </div>
                    ))}
                  </div>
                ))}

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-start gap-2 w-full">
                  <span className="min-w-[180px] text-sm font-semibold text-gray-700">
                    Contact Person:
                  </span>
                  <span className="w-full min-h-[40px] bg-gray-100 text-gray-800 px-3 py-2 rounded-md border border-gray-300">
                    {business.contactPerson || '—'}
                  </span>
                </div>

                <div className="flex items-start gap-2 w-full">
                  <span className="min-w-[180px] text-sm font-semibold text-gray-700">
                    Contact Number:
                  </span>
                  <span className="w-full min-h-[40px] bg-gray-100 text-gray-800 px-3 py-2 rounded-md border border-gray-300">
                    {business.contactNumber || '—'}
                  </span>
                </div>
              </div>

              {/* Remarks */}
              <div className="grid grid-cols-1">
                <div className="flex items-start gap-2">
                  <span className="min-w-[180px] text-sm font-semibold text-gray-700">
                    Remarks:
                  </span>
                  <span className="flex-1 min-h-[100px] whitespace-pre-line bg-gray-100 text-gray-800 px-3 py-2 rounded-md border border-gray-300">
                    {business.remarks || 'None'}
                  </span>
                </div>
              </div>
            </div>



            {/* Toggle Button */}
            <div className="flex justify-center mt-6">
              <Button
                variant="outlined"
                color="primary"
                onClick={() => toggleExpand(business._id)}
                startIcon={isExpanded ? <HiChevronUp /> : <HiChevronDown />}
              >
                {isExpanded ? 'Hide Details' : 'View More'}
              </Button>
            </div>

            {/* Expanded Sections (MSR → End) */}
            {isExpanded && (
              <>
                {/* --- MSR SECTION --- */}
                <Divider className="my-10">
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    MSR
                  </Typography>
                </Divider>

                {/* Keep everything below as-is */}
                {/* Sanitary Permit Checklist */}
                <div className="w-full max-w-4xl mx-auto space-y-10 mb-15">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 text-center mb-4">
                      A. Sanitary Permit Checklist
                    </h3>
                    {business.sanitaryPermitChecklist?.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {business.sanitaryPermitChecklist.map((item, idx) => (
                          <div
                            key={idx}
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

                  {/* Health Certificate Checklist */}
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 text-center mb-4">
                      B. Health Certificate Checklist
                    </h3>
                    {business.healthCertificateChecklist?.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {business.healthCertificateChecklist.map((item, idx) => (
                          <div
                            key={idx}
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

                  {/* Minimum Sanitary Requirements */}
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900 text-center mb-4">
                      C. Minimum Sanitary Requirements (MSR)
                    </h3>
                    {business.msrChecklist?.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {business.msrChecklist.map((item, idx) => (
                          <div
                            key={idx}
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

                {/* --- INSPECTION & PENALTY RECORDS --- */}
                <Divider className="my-10">
                  <Typography variant="h6" fontWeight="bold" color="primary">
                    Inspection and Penalty Records
                  </Typography>
                </Divider>

                <div className="w-full max-w-4xl mx-auto space-y-6 mb-10 mt-10">
                  {[
                    [
                      'Health Cert Fee',
                      typeof business.healthCertFee === 'number'
                        ? `₱${new Intl.NumberFormat('en-PH', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }).format(business.healthCertFee)}`
                        : '—',
                    ],
                    [
                      'Health Cert Sanitary Fee',
                      typeof business.healthCertSanitaryFee === 'number'
                        ? `₱${new Intl.NumberFormat('en-PH', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }).format(business.healthCertSanitaryFee)}`
                        : '—',
                    ],
                    [
                      'OR Date (Health Cert)',
                      business.orDateHealthCert
                        ? new Date(business.orDateHealthCert).toLocaleDateString('en-PH')
                        : '—',
                    ],
                    ['OR Number (Health Cert)', business.orNumberHealthCert ?? '—'],



                    ['Inspection Status', business.inspectionStatus ?? '—'],
                    ['Inspection Count This Year', business.inspectionCountThisYear ?? '—'],
                    // Replace this line:
// ['Recorded Violation', business.recordedViolation ?? '—'],

// With this:
[
  'Recorded Violation',
  business.violations && business.violations.length > 0
    ? business.violations.map((v, idx) => (
        <div key={idx} className="flex flex-col gap-1">
          <span>
            {formatViolationCode(v.code)} — ₱{v.penalty?.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({v.status})
          </span>
        </div>
      ))
    : '—'
],

                    ["Penalty Fee", `₱${business.penaltyFee?.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],

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
