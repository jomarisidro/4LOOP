'use client';
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'next/navigation';
import * as yup from 'yup';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {Alert, Button, Collapse, IconButton, MenuItem, TextField,} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RHFTextField from '@/app/components/ReactHookFormElements/RHFTextField';
import {getBusinessByBid, getUserBusinesses,} from '@/app/services/BusinessService';


const schema = yup.object().shape({
  bidNumber: yup.string().required('Business ID is required'),
  businessName: yup.string().required('Business Name is required'),
  businessAddress: yup.string().required('Business Address is required'),
  businessEstablishment: yup.string(),
  requestType: yup.string().required('Request Type is required'),
  status: yup.string(),

  // ✅ Health certificate fields
  orDateHealthCert: yup.date().nullable().transform((v, o) => (o === '' ? null : v)).optional(),
  orNumberHealthCert: yup.string().nullable().optional(),
  healthCertSanitaryFee: yup.number().min(0).nullable().transform((v, o) => (o === '' ? null : v)).optional(),
  healthCertFee: yup.number().min(0).nullable().transform((v, o) => (o === '' ? null : v)).optional(),

  // ✅ New personnel & compliance fields
  declaredPersonnel: yup.number().nullable().transform((v, o) => (o === '' ? null : v)).optional(),
  dueDateToComply: yup.date().nullable().transform((v, o) => (o === '' ? null : v)).optional(),
  healthCertificates: yup.number().nullable().transform((v, o) => (o === '' ? null : v)).optional(),
  balanceToComply: yup.number().nullable().transform((v, o) => (o === '' ? null : v)).optional(),
  dueDateFinal: yup.date().nullable().transform((v, o) => (o === '' ? null : v)).optional(),
});




const sanitaryPermitChecklist = [
  { id: 'tax_order_of_payment_TOP', label: 'Tax Order of Payment (TOP)' },
  { id: 'official_receipt', label: 'Official Receipt' }
];

const healthCertificateChecklist = [
  { id: 'chest_x-ray', label: 'Chest X-ray' },
  { id: 'chest_x_ray_and_urine_and_stool', label: 'Chest X-ray, Urine & Stool' },
  { id: 'if_pregnant_xpert_mtb_rif_exam', label: 'If pregnant — Xpert MTB / RIF Exam instead of Chest X-Ray' }
];

const msrChecklist = [
  { id: 'health_certificate', label: 'Health Certificate', dueDate: '' },
  { id: 'pest_control_contract_agreement', label: 'Pest Control Contract...', dueDate: '' },
  { id: 'applicable_pest_control_method', label: 'Applicable Pest Control Method...', dueDate: '' },
  { id: 'license_of_embalmer', label: 'License of Embalmer', dueDate: '' },
  { id: 'fda_license_to_operate', label: 'FDA - License to Operate', dueDate: '' },
  { id: 'food_safety_compliance_officer', label: 'Food Safety Compliance Officer (FSCO)', dueDate: '' },
  { id: 'doh_license_or_accreditation', label: 'DOH License / Accreditation', dueDate: '' },
  { id: 'manufacturers_distributors_importers_of_excreta_sewage', label: 'Manufacturers/distributors/importers...', dueDate: '' },
  { id: 'clearance_from_social_hygiene_clinic', label: 'Clearance From Social Hygiene Clinic', dueDate: '' },
  { id: 'permit_to_operate', label: 'Permit to Operate...', dueDate: '' },
  { id: 'material_information_data_sheet', label: 'Material Information Data Sheet (Industrial Company)', dueDate: '' },
  { id: 'random_swab_test_result_of_equipments_and_rooms', label: 'Random Swab Test Result of Equipments & Rooms', dueDate: '' },
  { id: 'certificate_of_potability_of_drinking_water', label: 'Certificate of Potability of Drinking Water...', dueDate: '' },
  { id: 'for_water_refilling_station', label: 'For Water Refilling Station', dueDate: '' },
  { id: 'others', label: 'Others', dueDate: '' },
];

export default function NewSanitationForm({ initialData, readOnly = false }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [warningMessage, setWarningMessage] = useState('');
  const [sanitaryPermitChecklistState, setSanitaryPermitChecklistState] = useState([]);
const [healthCertificateChecklistState, setHealthCertificateChecklistState] = useState('');
  const [msrChecklistState, setMsrChecklistState] = useState([]);

  const {
    control,
    register,           // ← added register
    handleSubmit,
    reset,
    getValues,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      requestType: '',
      bidNumber: '',
      businessNickname: '',
      businessName: '',
      businessType: '',
      businessAddress: '',
      businessEstablishment: '',
      contactPerson: '',
      contactNumber: '',
      status: '',
    },
    resolver: yupResolver(schema),
  });

  const bidNumber = watch('bidNumber');

  // Fetch existing business data
const { data: businessData, isFetching, error } = useQuery({
  queryKey: ['business', bidNumber],
  queryFn: () => {
    if (!bidNumber) return null; // 🛑 Prevent early fetch
    return getBusinessByBid(bidNumber); // ✅ Only run when a valid bidNumber exists
  },
  enabled: Boolean(bidNumber && bidNumber.trim() !== ''), // ✅ Also protects from empty strings or spaces
});

if (bidNumber && bidNumber.trim() !== '') {
  console.log('Fetching business data for', bidNumber, { businessData, isFetching, error });
  console.log('Fetched businessData:', businessData);
}


useEffect(() => {
  if (businessData && bidNumber) {
    // ✅ Populate fields when data is fetched
    reset({
      bidNumber,
      businessName: businessData.businessName || '',
      businessAddress: businessData.businessAddress || '',
      businessEstablishment: businessData.businessEstablishment || '',
      status: businessData.status || '',
      msrChecklist: businessData.msrChecklist || {},
      inspectionRecords: businessData.inspectionRecords || [],
      penaltyRecords: businessData.penaltyRecords || [],
      remarks: businessData.remarks || '',
    });

    // set non-form state
    setSanitaryPermitChecklistState(
      businessData.sanitaryPermitChecklist?.map(item => item.id) || []
    );
    setHealthCertificateChecklistState(
      businessData.healthCertificateChecklist?.[0]?.id || ''
    );
  } else if (!bidNumber || bidNumber.trim() === '') {
    // 🧹 Clear fields when no BID is selected
    setValue('businessName', '');
    setValue('businessAddress', '');
    setValue('businessEstablishment', '');
  }
}, [businessData, bidNumber, reset, setValue]);



  const handleSanitaryChange = (e) => {
    const { value, checked } = e.target;
    setSanitaryPermitChecklistState(prev =>
      checked ? [...prev, value] : prev.filter(id => id !== value)
    );
  };

const handleHealthChange = (e) => {
  setHealthCertificateChecklistState(e.target.value);
};


  const handleMsrChange = (e) => {
    const { value, checked } = e.target;
    setMsrChecklistState(prev =>
      checked ? [...prev, value] : prev.filter(id => id !== value)
    );
  };


  // Structured error throwing
  const updateBusinessRequest = async (data) => {
    const res = await fetch(`/api/business/${data.bidNumber}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        newBidNumber: data.bidNumber,
        newRequestType: data.requestType,
        newBusinessName: data.businessName,
        newBusinessAddress: data.businessAddress,
        newBusinessEstablishment: data.businessEstablishment,
        newStatus: data.status,
        orDateHealthCert: data.orDateHealthCert || null,
        orNumberHealthCert: data.orNumberHealthCert || null,
        healthCertSanitaryFee: data.healthCertSanitaryFee || null,
        healthCertFee: data.healthCertFee || null,
        sanitaryPermitChecklist: sanitaryPermitChecklist,
        healthCertificateChecklist: data.healthCertificateChecklist,
        msrChecklist: data.msrChecklist,
          declaredPersonnel: data.declaredPersonnel || null,
  dueDateToComply: data.dueDateToComply || null,
  healthCertificates: data.healthCertificates || null,
  balanceToComply: data.balanceToComply || null,
  dueDateFinal: data.dueDateFinal || null,
      }),
    });

    const payload = await res.json();
    console.log("Response payload:", payload);  // 👈 log what comes back

    if (!res.ok) {
      const err = new Error(payload.error || 'Failed to update business');
      err.status = res.status;
      throw err;
    }
    return payload;
  };

  const { mutate } = useMutation({
    mutationFn: updateBusinessRequest,

    onSuccess: (data) => {
      queryClient.invalidateQueries(['business', data.business.bidNumber]);
      reset();

      // ✅ clear all three checklist states
      setSanitaryPermitChecklistState([]);
      setHealthCertificateChecklistState([]);
      setMsrChecklistState([]);
      setWarningMessage('');
      router.push('/businessaccount/request');   // ✅ redirect
    },

    onError: (err) => {
      if (err.status === 404 || err.message.includes('You have no business like')) {
        setWarningMessage(err.message);
        return;
      }
      if (err.status === 409) {
        setWarningMessage(err.message);
        return;
      }
      setWarningMessage(err.message || 'Submission failed.');
    },
  });

  // Check for active request
  const checkBusinessStatus = async (bid) => {
    try {
      const res = await fetch(`/api/business/${bid}`);
      if (!res.ok) return false;
      const { status } = await res.json();
      const activeStatuses = ['submitted', 'pending', 'pending2', 'pending3', 'pending4'];
      return activeStatuses.includes(status);
    } catch {
      return false;
    }
  };

  const onSubmit = async (data) => {
    const hasActive = await checkBusinessStatus(data.bidNumber);
    if (hasActive && data.status !== 'draft') {
      setWarningMessage('🚫 There is already an ongoing sanitation request for this business.');
      return;
    }

    // 🔑 Transform Sanitary Permit checklist into array of { id, label }
    const sanitaryPermitChecklistPayload = sanitaryPermitChecklistState.map(id => {
      const def = sanitaryPermitChecklist.find(item => item.id === id);
      return { id, label: def?.label || id };
    });

    // 🔑 Transform Health Certificate checklist into array of { id, label }
const healthCertificateChecklistPayload = healthCertificateChecklistState
  ? (() => {
      const def = healthCertificateChecklist.find(item => item.id === healthCertificateChecklistState);
      return [{ id: def?.id, label: def?.label || healthCertificateChecklistState }];
    })()
  : [];


    // 🔑 Transform MSR checklist into array of { id, label, dueDate }
    const msrChecklistPayload = Object.entries(data.msrChecklist || {})
      .filter(([_, val]) => val.selected)
      .map(([id, val]) => {
        const def = msrChecklist.find(item => item.id === id);
        return {
          id,
          label: def?.label || id,
          dueDate: val.dueDate || null,
        };
      });

    mutate({
      ...data,
      status: 'submitted',
      sanitaryPermitChecklist: sanitaryPermitChecklistPayload,
      healthCertificateChecklist: healthCertificateChecklistPayload,
      msrChecklist: msrChecklistPayload,
    });
  };



  const handleSaveDraft = () => {
    mutate({ ...getValues(), status: 'draft' });
  };

  const handleClear = () => {
    reset();
    setSanitaryPermitChecklistState([]);
    setHealthCertificateChecklistState([]);
    setMsrChecklistState([]);
    setWarningMessage('');
  };
const { data: userBusinesses = [], isLoading: loadingBusinesses } = useQuery({
  queryKey: ['userBusinesses'],
  queryFn: getUserBusinesses,
});

  return (
    <>
      {warningMessage && (
        <Collapse in={!!warningMessage}>
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            action={
              <IconButton
                aria-label="close"
                color="inherit"
                size="small"
                onClick={() => setWarningMessage('')}
              >
                <CloseIcon fontSize="inherit" />
              </IconButton>
            }
          >
            {warningMessage}
          </Alert>
        </Collapse>
      )}

      <div className="w-full max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 items-center mb-4">
          {/* Left Column: Back Button + Heading */}
          <div className="flex items-center gap-x-4 justify-start">
            <Button
              variant="outlined"
              color="primary"
              onClick={() => router.back('/businessaccount/request')}
            >
              ← Back
            </Button>
            <h3 className="text-2xl font-bold text-gray-600">
              New Sanitation Permit Request
            </h3>
          </div>

          {/* Right Column: Empty or future content */}
          <div></div>
        </div>
      </div>


      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6 w-full bg-white shadow p-4 rounded px-6">
        {/* BID NUMBER */}

        <div className="w-full max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 items-center mb-2">
            {/* Left Column: BID NUMBER */}
            <div className="flex items-center gap-2 justify-start">
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                BID NUMBER:
              </span>
            <Controller
  name="bidNumber"
  control={control}
  render={({ field }) => (
    <TextField
      {...field}
      select
      variant="standard"
      label=""
      error={!!errors.bidNumber}
      helperText={errors?.bidNumber?.message}
      className="w-full max-w-[220px]"
    >
      <MenuItem value="">-- Select Business --</MenuItem>
      {loadingBusinesses ? (
        <MenuItem disabled>Loading...</MenuItem>
      ) : userBusinesses.length === 0 ? (
        <MenuItem disabled>No businesses found</MenuItem>
      ) : (
        userBusinesses.map((biz) => (
          <MenuItem key={biz.bidNumber} value={biz.bidNumber}>
            {biz.bidNumber} — {biz.businessName}
          </MenuItem>
        ))
      )}
    </TextField>
  )}
/>

            </div>

            {/* Right Column: Empty or future content */}
            <div></div>
          </div>
        </div>


        <div className="w-full max-w-screen-lg mx-auto">
          {/* BUSINESS NAME */}
          <div className="flex flex-col mb-4">
            <RHFTextField
              control={control}
              name="businessName"
              variant="standard"
              label=""
              error={!!errors.businessName}
              helperText={errors?.businessName?.message}
              fullWidth
              className="w-full"
            />
            <span className="text-sm font-medium text-gray-700 mt-1 text-center">
              BUSINESS NAME
            </span>
          </div>

          {/* BUSINESS ADDRESS */}
          <div className="flex flex-col mb-4">
            <RHFTextField
              control={control}
              name="businessAddress"
              variant="standard"
              label=""
              error={!!errors.businessAddress}
              helperText={errors?.businessAddress?.message}
              fullWidth
              className="w-full"
            />
            <span className="text-sm font-medium text-gray-700 mt-1 text-center">
              BUSINESS ADDRESS
            </span>
          </div>
        </div>

        <div className="w-full max-w-5xl mx-auto">
          <div className="grid grid-cols-2">

            {/* Column 1: Establishment Input with constrained width */}
            <div className="flex flex-col w-[380px] items-center">
              <RHFTextField
                control={control}
                name="businessEstablishment"
                variant="standard"
                label=""
                fullWidth
              />
              <span className="text-sm font-medium text-gray-700 mt-1 text-center">
                SAME EMPLOYEE / NAME OF ESTABLISHMENT
              </span>
            </div>

            {/* Column 2: Business Status */}
            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-x-7 flex-nowrap ">
                <span className="text-base font-medium text-gray-700 whitespace-nowrap">
                  <b>BUSINESS STATUS:</b>
                </span>

                <label className="flex items-center gap-2 whitespace-nowrap">
                  <input type="radio" value="New" {...register('requestType')} />
                  NEW
                </label>

                <label className="flex items-center gap-2 whitespace-nowrap">
                  <input type="radio" value="Renewal" {...register('requestType')} />
                  RENEWAL
                </label>
              </div>

              {/* Error Message */}
              {errors.requestType && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.requestType.message}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="w-full max-w-6xl mx-auto px-4 mb-6">
          <div className="grid grid-cols-[2fr_1fr] gap-6">
            {/* Left column */}
            <div className="flex flex-col w-[450px]">
              <div className="bg-blue-100 border-2 border-blue-900 px-2 py-1 text-center mb-2">
                <h2 className="text-lg font-bold uppercase text-blue-900">
                  A. ISSUANCE OF SANITARY PERMIT
                </h2>
              </div>

              <div className="flex flex-col gap-2 text-sm">
                {sanitaryPermitChecklist.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      value={item.id}
                      checked={sanitaryPermitChecklistState.includes(item.id)}
                      onChange={handleSanitaryChange}
                      className="transform scale-125"
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Right column */}
            <div className="flex flex-col w-[450px]">
              <div className="bg-blue-100 border-2 border-blue-900 px-2 py-1 text-center mb-2">
                <h2 className="text-lg font-bold uppercase text-blue-900">
                  IF NO OPERATION
                </h2>
              </div>

              <div className="flex flex-col gap-2 text-sm">
                <h1>Present Latest BIR Quarterly Income Tax Return</h1>
                <h1>
                  For bulk personnel & no appearance securing health certificate IDs
                </h1>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full max-w-6xl mx-auto px-4 mb-6">
          <div className="grid grid-cols-[2fr_1fr] gap-6">
            {/* Left column: B. ISSUANCE OF HEALTH CERTIFICATE */}
            <div className="flex flex-col w-[450px]">
              <div className="bg-blue-100 border-2 border-blue-900 px-2 py-1 text-center mb-2">
                <h2 className="text-lg font-bold uppercase text-blue-900">
                  B. ISSUANCE OF HEALTH CERTIFICATE
                </h2>
              </div>

              <h1 className="text-base font-semibold mb-3">
                Present Original COPY of the following to Validation Office
              </h1>

              {/* Checklist items */}
            <div className="flex flex-col gap-2 mb-2">
  {healthCertificateChecklist.map((item) => (
    <label
      key={item.id}
      className="flex items-center gap-2 text-sm cursor-pointer"
    >
      <input
        type="radio"
        name="healthExam" // same name groups them together
        value={item.id}
        checked={healthCertificateChecklistState === item.id}
        onChange={handleHealthChange}
        className="transform scale-110 accent-blue-600"
      />
      {item.label}
    </label>
  ))}
</div>

              <h1 className="font-bold ml-6 mt-3">
                Present the following to Environmental Sanitation Office
              </h1>

              <h1 className="ml-9">A. Validated Medical Summary</h1>
              <h1 className="ml-9">B. Official Receipt</h1>
              <h1 className="ml-12">
                - Validation fee/person if medical examination was not conducted by the
                Pasig One Stop Shop Clinic (5th flr.)
              </h1>
              <h1 className="ml-12 mb-4">- Health Certificate Fee</h1>

              {/* Input fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <label className="w-[120px] text-sm font-medium text-gray-700">
                    O.R. Date:
                  </label>
                  <RHFTextField
                    control={control}
                    name="orDateHealthCert"
                    type="date"
                    variant="standard"
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="w-[120px] text-sm font-medium text-gray-700">
                    O.R. Number:
                  </label>
                  <RHFTextField
                    control={control}
                    name="orNumberHealthCert"
                    variant="standard"
                    placeholder="Enter O.R. Number"
                    fullWidth
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="w-[120px] text-sm font-medium text-gray-700">
                    Sanitary Fee:
                  </label>
                  <RHFTextField
                    control={control}
                    name="healthCertSanitaryFee"
                    type="number"
                    variant="standard"
                    placeholder="Enter amount"
                    fullWidth
                  />
                </div>

                <div className="flex items-center gap-2">
                  <label className="w-[120px] text-sm font-medium text-gray-700">
                    Health Cert Fee:
                  </label>
                  <RHFTextField
                    control={control}
                    name="healthCertFee"
                    type="number"
                    variant="standard"
                    placeholder="Enter amount"
                    fullWidth
                  />
                </div>
              </div>
            </div>

            {/* Right column: Bulk Personnel Instructions */}
            <div className="flex flex-col w-[450px] gap-2 text-sm">
              <h1 className="font-bold">
                FOR BULK PERSONNEL & NO APPEARANCE SECURING HEALTH CERTIFICATE ID'S
              </h1>

              <h1 className="font-bold">FOOD BUSINESS</h1>
              <h1>a. Bring 1x1 or 2x2 latest colored photo (not scanned photo)</h1>
              <h1>b. Indicate (Surname, First Name, Middle Name) with signature</h1>

              <h1 className="font-bold">NON-FOOD BUSINESS</h1>

              <h1 className="font-bold">- Companies with 1-10 personnel</h1>
              <h1>a. Bring 1x1 or 2x2 actual colored photo (not scanned photo)</h1>
              <h1>b. Indicate (Surname, First Name, Middle Name) with signature</h1>

              <h1 className="font-bold">- Companies with 11 and above personnel</h1>
              <h1>
                A Certificate of Compliance will be issued upon complying the
                requirements instead of individual Health Certificate I.D.
              </h1>
              <h1>(Option instead of the Health Certificate I.D.)</h1>
            </div>
          </div>
        </div>

        {/* C. MINIMUM SANITARY REQUIREMENTS */}
        <div className="w-full max-w-6xl mx-auto px-4 mb-6">

          <div className="w-[450px] bg-blue-100 border-2 border-blue-900 px-2 py-1 text-center mb-2">
            <h2 className="text-lg font-bold uppercase text-blue-900">      C. MINIMUM SANITARY REQUIREMENTS
            </h2>
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-4 gap-4 mb-2">
            <div className="text-sm font-bold text-gray-700 text-center">CHECKLIST</div>
            <div className="text-sm font-bold text-red-700 text-center">DUE DATE TO COMPLY</div>
            <div className="text-sm font-bold text-gray-700 text-center">CHECKLIST</div>
            <div className="text-sm font-bold text-red-700 text-center">DUE DATE TO COMPLY</div>
          </div>

          {/* Checklist rows */}
          <div className="grid grid-cols-2 gap-4">
            {msrChecklist.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-2 items-center gap-2 border-b border-gray-100 py-1"
              >
                {/* Checklist cell */}
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register(`msrChecklist.${item.id}.selected`)} // ✅ RHF-managed checkbox
                    className="transform scale-125 accent-blue-600 mr-2"
                  />
                  <span>{item.label}</span>
                </label>

                {/* Due Date cell */}
                <div className="w-28 mx-auto">
                  <RHFTextField
                    control={control}
                    name={`msrChecklist.${item.id}.dueDate`}   // ✅ RHF-managed due date
                    type="date"
                    variant="standard"
                    label=""
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    sx={{
                      color: '#b91c1c',
                      '& .MuiInputBase-input': { color: '#b91c1c' },
                      '& .MuiInput-underline:before': { borderBottomColor: '#b91c1c' },
                      '& .MuiInput-underline:hover:before': { borderBottomColor: '#b91c1c' },
                      '& .MuiInput-underline:after': { borderBottomColor: '#b91c1c' },
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap justify-between gap-1 mb-6 w-full max-w-screen-lg mx-auto -ml-2 mt-2">
            {/* Left column: NOTE section */}
            <div className="flex-1 min-w-[300px]">
              <h3 className="text-base font-semibold mb-1">NOTE:</h3>
              <h3 className="text-base font-semibold mb-1">
                - Kindly submit noted deficiencies so we may act upon your application.
              </h3>
              <h3 className="text-base font-semibold mb-1">
                - For updating of Health Certificate and MSR please bring the original copy of the following:
              </h3>
              <h3 className="text-base font-semibold mb-1">
                - For updating of Health Certificate and MSR please bring the original copy of the following:
              </h3>
              <h3 className="text-base font-semibold mb-1 ml-6">
                - Required Minimum Sanitary Requirements (MSR)
              </h3>
              <h3 className="text-base font-semibold mb-1 ml-6">
                - Checklist for Compliance
              </h3>
              <h3 className="text-base font-semibold mb-1 ml-6">
                - Official Receipt of Validation Fee
              </h3>
              <h3 className="text-base font-semibold mb-1 ml-6">
                - Authorization Letter of Company Representative and/or Company I.D. and/or Government issued I.D.
              </h3>
            </div>

            {/* Right column: MSR Verified block */}
            <div className="flex flex-col items-end w-full max-w-xs">
              <h3 className="text-base font-bold mb-10">MSR VERIFIED AND CHECKED:</h3>
              <h3 className="text-base font-semibold">DINA E. CRUZ</h3>
              <h3 className="text-sm text-gray-700">MSR, SUPERVISOR</h3>
            </div>
          </div>
        </div>
        <div className="w-full max-w-screen-lg mx-auto grid grid-cols-2 gap-6">
          {/* Left Column: Form */}
          <div className="border border-blue-600 bg-blue-50 rounded-md p-4 space-y-6 -ml-13">

      {/* Row 1: Declared Personnel + Due Date to Comply */}
<div className="grid [grid-template-columns:1.5fr_1fr] gap-6 mt-2">
  {/* Column 1: Declared Personnel */}
  <div className="flex items-center gap-2">
    <label
      htmlFor="declaredPersonnel"
      className="text-sm font-medium text-gray-700 min-w-[160px]"
    >
      TOTAL NUMBER OF DECLARED PERSONNEL
    </label>
    <input
      id="declaredPersonnel"
      type="number"
      {...register('declaredPersonnel')}
      className="border border-gray-300 rounded px-2 py-1 w-full max-w-[160px] mt-5"
      placeholder="Enter total"
    />
  </div>

  {/* Column 2: Due Date to Comply */}
  <div className="flex flex-col gap-1 ml-10">
    <label
      htmlFor="dueDateToComply"
      className="text-sm font-medium text-gray-700"
    >
      DUE DATE TO COMPLY
    </label>
    <input
      id="dueDateToComply"
      type="date"
      {...register('dueDateToComply')}
      className="border border-gray-300 rounded px-2 py-1 w-full max-w-[130px]"
    />
  </div>
</div>

{/* Row 2: Health Certificates + Balance to Comply + Due Date */}
<div className="grid grid-cols-3 gap-6 mt-15">
  <div className="flex flex-col gap-1">
    <label
      htmlFor="healthCertificates"
      className="text-sm font-medium text-gray-700"
    >
      TOTAL NUMBER WITH HEALTH CERTIFICATES
    </label>
    <input
      id="healthCertificates"
      type="number"
      {...register('healthCertificates')}
      className="border border-gray-300 rounded px-2 py-1 w-full max-w-[160px]"
      placeholder="Enter total"
    />
  </div>

  <div className="flex flex-col gap-1">
    <label
      htmlFor="balanceToComply"
      className="text-sm font-medium text-gray-700"
    >
      BALANCE TO COMPLY
    </label>
    <input
      id="balanceToComply"
      type="number"
      {...register('balanceToComply')}
      className="border border-gray-300 rounded px-2 py-1 w-full max-w-[160px] mt-10"
      placeholder="Enter balance"
    />
  </div>

  <div className="flex flex-col gap-1">
    <input
      id="dueDateFinal"
      type="date"
      {...register('dueDateFinal')}
      className="border border-gray-300 rounded px-2 py-1 w-full max-w-[130px] mt-16"
    />
  </div>
</div>
          </div>

          {/* Right Column: Inspection Record */}
          <div className="w-full max-w-6xl mx-auto px-4 mb-6">
            <h3 className="text-lg font-bold text-gray-700 mb-2">Inspection Record</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto border-separate border-spacing-y-4">
                <thead className="bg-transparent">
                  <tr>
                    <th className="px-4 py-2 text-sm font-medium text-gray-700 text-center"></th>
                    <th className="px-4 py-2 text-sm font-medium text-gray-700 text-center">Date</th>
                    <th className="px-4 py-2 text-sm font-medium text-gray-700 text-center">Actual No. of Personnel Upon Inspection</th>
                    <th className="px-4 py-2 text-sm font-medium text-gray-700 text-center">Inspected By</th>
                  </tr>
                </thead>
                <tbody>
                  {['1st', '2nd'].map((label, index) => (
                    <tr key={label} className="bg-white shadow-sm rounded-md">
                      <td className="px-4 py-2 text-sm text-gray-700 text-center font-medium">{label}</td>
                      <td className="px-4 py-2">
                        <RHFTextField
                          control={control}
                          name={`inspectionRecords.${index}.date`}
                          variant="standard"
                          label=""
                          error={!!errors?.inspectionRecords?.[index]?.date}
                          helperText={errors?.inspectionRecords?.[index]?.date?.message}
                          className="w-full"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <RHFTextField
                          control={control}
                          name={`inspectionRecords.${index}.personnelCount`}
                          variant="standard"
                          label=""
                          error={!!errors?.inspectionRecords?.[index]?.personnelCount}
                          helperText={errors?.inspectionRecords?.[index]?.personnelCount?.message}
                          className="w-full"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <RHFTextField
                          control={control}
                          name={`inspectionRecords.${index}.inspectedBy`}
                          variant="standard"
                          label=""
                          error={!!errors?.inspectionRecords?.[index]?.inspectedBy}
                          helperText={errors?.inspectionRecords?.[index]?.inspectedBy?.message}
                          className="w-full"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="w-full max-w-6xl mx-auto px-4 mb-6">
          <div className="grid grid-cols-[2fr_1fr] gap-6">
            {/* Left Column: Table */}
            <div>
              <h3 className="text-lg font-bold text-gray-700 mb-2">Penalty Record</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto border-separate border-spacing-y-4">
                  <thead>
                    <tr className="bg-transparent text-sm text-gray-700 text-center">
                      <th className="px-2 py-1">Checklist</th>
                      <th className="px-2 py-1">Offense</th>
                      <th className="px-2 py-1">Year</th>
                      <th className="px-2 py-1">OR Date</th>
                      <th className="px-2 py-1">OR Number</th>
                      <th className="px-2 py-1">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['Sanitary Permit', 'Health Certificate', 'Water Potability', 'MSR'].map((label, index) => (
                      <tr key={label} className="bg-white shadow-sm rounded-md">
                        <td className="px-2 py-1 text-sm text-gray-700">
                          <label className="flex items-center gap-2">
                            <input type="checkbox" className="form-checkbox text-blue-600" />
                            {label}
                          </label>
                        </td>
                        <td className="px-2 py-1">
                          <RHFTextField
                            control={control}
                            name={`penaltyRecords.${index}.offense`}
                            variant="standard"
                            label=""
                            error={!!errors?.penaltyRecords?.[index]?.offense}
                            helperText={errors?.penaltyRecords?.[index]?.offense?.message}
                            className="w-full"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <RHFTextField
                            control={control}
                            name={`penaltyRecords.${index}.year`}
                            variant="standard"
                            label=""
                            error={!!errors?.penaltyRecords?.[index]?.year}
                            helperText={errors?.penaltyRecords?.[index]?.year?.message}
                            className="w-full"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <RHFTextField
                            control={control}
                            name={`penaltyRecords.${index}.orDateHealthCert`}
                            variant="standard"
                            label=""
                            error={!!errors?.penaltyRecords?.[index]?.orDateHealthCert}
                            helperText={errors?.penaltyRecords?.[index]?.orDateHealthCert?.message}
                            className="w-full"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <RHFTextField
                            control={control}
                            name={`penaltyRecords.${index}.orNumberHealthCert`}
                            variant="standard"
                            label=""
                            error={!!errors?.penaltyRecords?.[index]?.orNumberHealthCert}
                            helperText={errors?.penaltyRecords?.[index]?.orNumberHealthCert?.message}
                            className="w-full"
                          />
                        </td>
                        <td className="px-2 py-1">
                          <RHFTextField
                            control={control}
                            name={`penaltyRecords.${index}.amount`}
                            variant="standard"
                            label=""
                            error={!!errors?.penaltyRecords?.[index]?.amount}
                            helperText={errors?.penaltyRecords?.[index]?.amount?.message}
                            className="w-full"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Column: Verification */}
            <div className="flex flex-col justify-center text-sm text-gray-700">
              <p className="font-semibold uppercase mb-4">Payments Verified and Checked:</p>
              <p className="font-bold text-lg">ELEONOR M. JUNDARINO</p>
              <p className="uppercase">Revenue Unit Supervisor</p>
            </div>
          </div>
        </div>


        {/* Remark Field - Inline Label and Input */}
        <div className="w-full max-w-6xl mx-auto px-4 mb-6">
          <div className="flex items-center gap-4">
            <label htmlFor="remarks" className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Remarks
            </label>
            <RHFTextField
              control={control}
              name="remarks"
              type="text"
              variant="standard"
              placeholder="Enter remarks"
              error={!!errors?.remarks}
              helperText={errors?.remarks?.message}
              className="flex-1"
            />
          </div>
        </div>

        <h1 className="text-blue-700 text-lg font-bold text-center mx-auto max-w-4xl">
          PLEASE BRING THIS FORM FOR UPDATING OF MINIMUM SANITARY REQUIREMENTS (MSR) / HEALTH CERTIFICATE AND DURING RENEWAL AND
          <span className="text-red-600"> HAVE IT AVAILABLE DURING INSPECTION</span>
        </h1>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 pt-6">
          <Button type="submit" variant="contained" color="primary">
            Send
          </Button>
          <Button variant="outlined" color="secondary" onClick={handleSaveDraft}>
            Save as Draft
          </Button>
          <Button variant="text" color="error" onClick={handleClear}>
            Clear
          </Button>
        </div>
      </form>
    </>
  );
}
