'use client';
import { HiPencilAlt, HiX, HiSave, HiTrash } from 'react-icons/hi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAddOwnerBusiness } from '@/app/services/BusinessService';
import { Typography, Stack, Paper, Box, Button } from '@mui/material';

function formatViolationCode(code) {
  if (!code) return '';
  return code
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}


export default function BusinesslistForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['business-list'],
    queryFn: () => getAddOwnerBusiness(),
  });

  const [businesses, setBusinesses] = useState([]);
  const [newId, setNewId] = useState(null);
  const [newBusiness, setNewBusiness] = useState({});

useEffect(() => {
  async function fetchInspectionDetails() {
    if (!data?.data) return;

    try {
      // 🟢 Fetch all tickets (from /api/ticket)
      const res = await fetch(`/api/ticket`);
      if (!res.ok) {
        console.error("Failed to fetch tickets");
        return;
      }

      const allTickets = await res.json();

      const updatedBusinesses = await Promise.all(
        data.data.map(async (biz) => {
          // Filter tickets belonging to this business
          const bizTickets = allTickets.filter(t => t.business === biz._id || t.business?._id === biz._id);

          // Get the latest ticket for that business
          const latestTicket = bizTickets.length
            ? bizTickets.sort((a, b) => new Date(b.inspectionDate) - new Date(a.inspectionDate))[0]
            : null;

          // Use populated violations directly if available
          const violations = latestTicket?.violations || [];

          return {
            ...biz,
            inspectionStatus: latestTicket?.inspectionStatus || "-",
            resolutionStatus: latestTicket?.resolutionStatus || "-",
            violations: violations,
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




  const statusMapForUser = {
    draft: '-',
    submitted: 'Submitted',
    pending: 'Pending',
    pending2: 'Pending',
    pending3: 'Pending',
    pending4: 'Pending',
    completed: 'Completed',
  };

  const handleEdit = (business) => {
    setNewId(business._id);
    setNewBusiness({ ...business });
  };

  const handleDelete = async (businessId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this business?');
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

return (
  <>
    <div className="grid grid-cols-2 gap-6 mb-8 max-w-4xl">
      <div className="bg-white rounded shadow p-6 hover:shadow-md cursor-pointer">
        <h2 className="text-lg font-medium mb-2">📋 Business Lists</h2>
        <p className="text-sm text-gray-600">View and manage registered businesses.</p>
      </div>
      <div
        onClick={() => router.push('/businessaccount/businesses/addbusiness')}
        className="bg-white rounded shadow p-6 hover:shadow-md cursor-pointer transition"
      >
        <h2 className="text-lg font-medium mb-2">➕ Add a Business</h2>
        <p className="text-sm text-gray-600">Register a new business to your list.</p>
      </div>
    </div>

    <h1 className="text-2xl font-semibold mb-6">My Businesses</h1>

    <Stack spacing={4}>
      {businesses.map((business) => (
        <Paper key={business._id} elevation={2} sx={{ p: 3, position: 'relative' }}>
          <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
            {newId === business._id ? (
              <Stack direction="row" spacing={1}>
                <Button variant="contained" color="success" onClick={handleSave} startIcon={<HiSave />}>
                  Save
                </Button>
                <Button variant="outlined" color="secondary" onClick={handleCancel} startIcon={<HiX />}>
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
          </Box>

          {newId === business._id ? (
            <>
              {[
                { label: 'BID Number', field: 'bidNumber' },
                { label: 'Name of Company', field: 'businessName' },
                { label: 'Trade Name', field: 'businessNickname' },
                { label: 'Line of Business', field: 'businessType' },
                { label: 'Business Address', field: 'businessAddress' },
                { label: 'Landmark', field: 'landmark' },
                { label: 'Contact Person', field: 'contactPerson' },
                { label: 'Contact Number', field: 'contactNumber' },
              ].map(({ label, field }) => (
                <Box key={field} sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Typography sx={{ minWidth: 180, fontWeight: 'bold' }}>{label}:</Typography>
                  <input
                    type="text"
                    value={newBusiness[field] || ''}
                    onChange={(e) => handleChange(field, e.target.value)}
                    className="border rounded px-2 py-1"
                    style={{ width: '500px' }}
                  />
                </Box>
              ))}
            </>
          ) : (
            <>
  {[
    { label: 'BID Number', value: business.bidNumber },
    { label: 'Name of Company', value: business.businessName },
    { label: 'Trade Name', value: business.businessNickname },
    { label: 'Line of Business', value: business.businessType },
    { label: 'Business Address', value: business.businessAddress },
    { label: 'Landmark', value: business.landmark },
    { label: 'Contact Person', value: business.contactPerson },
    { label: 'Contact Number', value: business.contactNumber },

    { label: 'Date Created', value: new Date(business.createdAt).toLocaleString('en-PH') },
    { label: 'Date Updated', value: new Date(business.updatedAt).toLocaleString('en-PH') },

        { label: 'Online Request Status', value: statusMapForUser[business.status] },
    { label: 'Sanitary Permit Status', value: business.permitStatus || '-' },

      { label: 'Total Declared Personnel', value: business.declaredPersonnel ?? '-' },
  { label: 'Due Date to Comply', value: business.dueDateToComply ? new Date(business.dueDateToComply).toLocaleDateString('en-PH') : '-' },
  { label: 'Total With Health Certificates', value: business.healthCertificates ?? '-' },
  { label: 'Balance to Comply', value: business.balanceToComply ?? '-' },
  { label: 'Final Due Date', value: business.dueDateFinal ? new Date(business.dueDateFinal).toLocaleDateString('en-PH') : '-' },
  
  ].map(({ label, value }) => (
    <Box key={label} sx={{ display: 'flex', mb: 1 }}>
      <Typography sx={{ minWidth: 400, fontWeight: 'bold' }}>{label}:</Typography>
      <Typography>{value}</Typography>
    </Box>
  ))}

  {business.sanitaryPermitChecklist?.length > 0 && (
    <Box sx={{ display: 'flex', mb: 3, mt: 3 }}>
      <Typography sx={{ minWidth: 400, fontWeight: 'bold' }}>Sanitary Permit Checklist:</Typography>
      <Box>
        <ul className="list-disc list-inside text-sm text-gray-700">
          {business.sanitaryPermitChecklist.map((item, idx) => (
            <li key={idx}>{item.label}</li>
          ))}
        </ul>
      </Box>
    </Box>
  )}

{(business.healthCertificateChecklist?.length > 0 ||
  business.orDateHealthCert ||
  business.orNumberHealthCert ||
  business.healthCertSanitaryFee ||
  business.healthCertFee) && (
  <Box sx={{ display: 'flex', mb: 3 }}>
    <Typography sx={{ minWidth: 400, fontWeight: 'bold' }}>
      Health Certificate Checklist:
    </Typography>
    <Box>
      <ul className="list-disc list-inside text-sm text-gray-700">
        {business.healthCertificateChecklist?.map((item, idx) => (
          <li key={idx}>{item.label}</li>
        ))}

        {/* ✅ Extra fields */}
        {business.orDateHealthCert && (
          <li>O.R. Date: {new Date(business.orDateHealthCert).toLocaleDateString('en-PH')}</li>
        )}
        {business.orNumberHealthCert && (
          <li>O.R. Number: {business.orNumberHealthCert}</li>
        )}
        {business.healthCertSanitaryFee != null && (
          <li>Sanitary Fee: ₱{business.healthCertSanitaryFee}</li>
        )}
        {business.healthCertFee != null && (
          <li>Health Cert Fee: ₱{business.healthCertFee}</li>
        )}
      </ul>
    </Box>
  </Box>
)}


  {business.msrChecklist?.length > 0 && (
    <Box sx={{ display: 'flex', mb: 3 }}>
      <Typography sx={{ minWidth: 400, fontWeight: 'bold' }}>MSR Checklist:</Typography>
      <Box>
        <ul className="list-disc list-inside text-sm text-gray-700">
          {business.msrChecklist.map((item, idx) => (
            <li key={idx}>
              {item.label}
              {item.dueDate && (
                <span className="text-red-700 ml-2">
                  (Due: {new Date(item.dueDate).toLocaleDateString('en-PH')})
                </span>
              )}
            </li>
          ))}
        </ul>
      </Box>
    </Box>
  )}
  {/* 🧾 Inspection and Violation Info */}
{business.inspectionStatus && (
  <Box sx={{ display: 'flex', mb: 1 }}>
    <Typography sx={{ minWidth: 400, fontWeight: 'bold' }}>
      Inspection Status:
    </Typography>
    <Typography>{business.inspectionStatus}</Typography>
  </Box>
)}

{business.resolutionStatus && (
  <Box sx={{ display: 'flex', mb: 1 }}>
    <Typography sx={{ minWidth: 400, fontWeight: 'bold' }}>
      Resolution Status:
    </Typography>
    <Typography>{business.resolutionStatus}</Typography>
  </Box>
)}

{business.violations?.length > 0 && (
  <Box sx={{ display: 'flex', mb: 3 }}>
    <Typography sx={{ minWidth: 400, fontWeight: 'bold' }}>Violations:</Typography>
    <Box>
      <ul className="list-disc list-inside text-sm text-gray-700">
        {business.violations.map((v, idx) => (
          <li key={idx}>
            <strong>{formatViolationCode(v.code)}</strong> — ₱{v.penalty?.toLocaleString()} ({v.violationStatus})
            <br />
            <span className="text-gray-500 text-xs">
              {v.description || 'No description provided'}
            </span>
          </li>
        ))}
      </ul>
    </Box>
  </Box>
)}

</>

          )}
        </Paper>
      ))}
    </Stack>
  </>
);
}