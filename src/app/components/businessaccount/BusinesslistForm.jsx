'use client';
import { HiPencilAlt, HiX, HiSave, HiTrash } from 'react-icons/hi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HiSearch } from 'react-icons/hi';
import { TextField, MenuItem, InputAdornment } from '@mui/material';
import { useMemo } from 'react';  
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

export default function BusinesslistForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['business-list'],
    queryFn: () => getAddOwnerBusiness(),
  });

  const [businesses, setBusinesses] = useState([]);
  const [newId, setNewId] = useState(null);
  const [newBusiness, setNewBusiness] = useState({});

    const [searchType, setSearchType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

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

            return {
              ...biz,
              inspectionStatus: latestTicket?.inspectionStatus || '-',
              resolutionStatus: latestTicket?.resolutionStatus || '-',
              violations,
            };
          })
        );

        setBusinesses(updatedBusinesses);
      } catch (err) {
        console.error('Failed to fetch inspection details:', err);
      }
    }

    fetchInspectionDetails();
  }, [data]);

  const handleEdit = (business) => {
    setNewId(business._id);
    setNewBusiness({ ...business });
  };

  const handleDelete = async (businessId) => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this business?'
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`/api/business/${businessId}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');
      await queryClient.invalidateQueries(['business-list']);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleCancel = () => {
    setNewId(null);
    setNewBusiness({});
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`/api/business/${newId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newBidNumber: newBusiness.bidNumber,
          newBusinessName: newBusiness.businessName,
          newBusinessNickname: newBusiness.businessNickname,
          newBusinessType: newBusiness.businessType,
          newBusinessAddress: newBusiness.businessAddress,
          newLandmark: newBusiness.landmark,
          newContactPerson: newBusiness.contactPerson,
          newContactNumber: newBusiness.contactNumber,
        }),
      });

      if (!res.ok) throw new Error('Failed to update');
      await res.json();
      await queryClient.invalidateQueries(['business-list']);

      setNewId(null);
      setNewBusiness({});
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const handleChange = (field, value) => {
    setNewBusiness((prev) => ({ ...prev, [field]: value }));
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
  flexDirection={{ xs: 'column', sm: 'row' }}
  alignItems={{ xs: 'stretch', sm: 'center' }}
  justifyContent="center"
  gap={2}
  mb={6}
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

{filteredBusinesses.map((business) => {
  const isEditing = newId === business._id;


        return (
          <Paper
            key={business._id}
            elevation={2}
            className="p-6 mb-12 rounded-lg border border-gray-300 bg-white relative"
          >
            {/* Edit/Delete Buttons */}
            <div className="absolute -top-5 -right-5">
              {isEditing ? (
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={handleSave}
                    startIcon={<HiSave />}
                  >
                    Save
                  </Button>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleCancel}
                    startIcon={<HiX />}
                  >
                    Cancel
                  </Button>
                </Stack>
              ) : (
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleEdit(business)}
                    startIcon={<HiPencilAlt />}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    onClick={() => handleDelete(business._id)}
                    startIcon={<HiTrash />}
                  >
                    Delete
                  </Button>
                </Stack>
              )}
            </div>

            {/* Main Business Info */}
            <div className="w-full max-w-4xl mx-auto space-y-6 mb-15">
              {[
                ['BID Number', 'bidNumber'],
                ['Business Name', 'businessName'],
                ['Trade Name', 'businessNickname'],
                ['Business Type', 'businessType'],
                ['Business Address', 'businessAddress'],
                ['Landmark', 'landmark'],
                ['Contact Person', 'contactPerson'],
                ['Contact Number', 'contactNumber'],
              ]
                .reduce((rows, [label, field]) => {
                  const value = isEditing
                    ? newBusiness[field] || ''
                    : business[field] || '—';
                  const pair = (
                    <div key={field} className="flex items-start gap-2">
                      <span className="min-w-[180px] text-sm font-semibold text-gray-700">
                        {label}:
                      </span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={value}
                          onChange={(e) =>
                            handleChange(field, e.target.value)
                          }
                          className="flex-1 min-h-[40px] bg-white text-gray-800 px-3 py-2 rounded-md border border-gray-400"
                        />
                      ) : (
                        <span className="flex-1 min-h-[40px] bg-gray-100 text-gray-800 px-3 py-2 rounded-md border border-gray-300">
                          {value}
                        </span>
                      )}
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

           {/* --- MSR SECTION --- */}
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

  {/* B. Health Certificate Checklist */}
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

  {/* C. Minimum Sanitary Requirements (MSR) */}
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
  ['Health Cert Fee', business.healthCertFee ?? '—'],
  ['Health Cert Sanitary Fee', business.healthCertSanitaryFee ?? '—'],
  ['OR Date (Health Cert)', business.orDateHealthCert
    ? new Date(business.orDateHealthCert).toLocaleDateString('en-PH')
    : '—'],
  ['OR Number (Health Cert)', business.orNumberHealthCert ?? '—'],
  ['Inspection Status', business.inspectionStatus ?? '—'],
  ['Ticket ID', business.ticketId ?? '—'],
  ['Inspection Count This Year', business.inspectionCountThisYear ?? '—'],
  ['Recorded Violation', business.recordedViolation ?? '—'],
  ['Permit Status', business.permitStatus ?? '—'],
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
          </Paper>
        );
      })}
    </Box>
  );
}
