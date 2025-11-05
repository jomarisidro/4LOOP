'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'next/navigation';
import * as yup from 'yup';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Alert, Button, Collapse, FormControl, IconButton, InputLabel, MenuItem, Select, TextField } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import RHFTextField from '@/app/components/ReactHookFormElements/RHFTextField';
import { getBusinessByBid, getUserBusinesses } from '@/app/services/BusinessService';
import axios from 'axios';


function formatDateForInput(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0]; // "2025-10-22"
}

function clearMsrSelectionsButKeepDueDates(msrChecklist, setValue) {
  msrChecklist.forEach((item) => {
    // ❌ Clear only selection and label
    setValue(`msrChecklist.${item.id}.selected`, false);
    setValue(`msrChecklist.${item.id}.label`, '');
    // ✅ Keep the dueDate untouched
  });
}


const schema = yup.object().shape({
  bidNumber: yup.string().required('Business ID is required'),
  businessName: yup.string().required('Business Name is required'),
  businessAddress: yup.string().required('Business Address is required'),
  businessEstablishment: yup.string(),
  requestType: yup.string().required('Request Type is required'),
  remarks: yup.string(),

  // ✅ Health certificate fields (optional but validated if filled)
  orDateHealthCert: yup.date().nullable().transform((v, o) => (o === '' ? null : v)).typeError('Please enter a valid date'),
  orNumberHealthCert: yup.string().matches(/^\d*$/, 'O.R. Number must contain digits only').nullable().transform((v, o) => (o === '' ? null : v)),
  healthCertSanitaryFee: yup.number().min(0, 'Must be 0 or greater').nullable().transform((v, o) => (o === '' ? null : v)).typeError('Please enter a valid number'),
  healthCertFee: yup.number().min(0, 'Must be 0 or greater').nullable().transform((v, o) => (o === '' ? null : v)).typeError('Please enter a valid number'),
  declaredPersonnel: yup.number().nullable().transform((v, o) => (o === '' ? null : v)).typeError('Please enter a valid number'),
  declaredPersonnelDueDate: yup.date().nullable().transform((v, o) => (o === '' ? null : v)).typeError('Please enter a valid date'),
  healthCertificates: yup.number().nullable().transform((v, o) => (o === '' ? null : v)).typeError('Please enter a valid number'),
  healthCertBalanceToComply: yup.number().nullable().transform((v, o) => (o === '' ? null : v)).typeError('Please enter a valid number'),
  healthCertDueDate: yup.date().nullable().transform((v, o) => (o === '' ? null : v)).typeError('Please enter a valid date'),
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

// Utility function for computing 90 days from today
function get90DaysFromNow() {
  const d = new Date();
  d.setDate(d.getDate() + 90);
  return d.toISOString().split('T')[0]; // e.g. "2025-10-22"
}

const dueDate = get90DaysFromNow();

export const msrChecklist = [
  { id: 'health_certificate', label: 'Health Certificate', dueDate },
  { id: 'pest_control_contract_agreement', label: 'Pest Control Contract / Agreement', dueDate },
  { id: 'applicable_pest_control_method', label: 'Applicable Pest Control Method (In-house/Contract)', dueDate },
  { id: 'license_of_embalmer', label: 'License of Embalmer', dueDate },
  { id: 'fda_license_to_operate', label: 'FDA - License to Operate', dueDate },
  { id: 'food_safety_compliance_officer', label: 'Food Safety Compliance Officer (FSCO)', dueDate },
  { id: 'doh_license_or_accreditation', label: 'DOH License / Accreditation', dueDate },
  { id: 'manufacturers_distributors_importers_of_excreta_sewage', label: 'Manufacturers / Distributors / Importers of Excreta / Sewage', dueDate },
  { id: 'clearance_from_social_hygiene_clinic', label: 'Clearance from Social Hygiene Clinic', dueDate },
  { id: 'permit_to_operate', label: 'Permit to Operate', dueDate },
  { id: 'material_information_data_sheet', label: 'Material Information Data Sheet (Industrial Company)', dueDate },
  { id: 'random_swab_test_result_of_equipments_and_rooms', label: 'Random Swab Test Result of Equipments & Rooms', dueDate },
  { id: 'certificate_of_potability_of_drinking_water', label: 'Certificate of Potability of Drinking Water', dueDate },
  { id: 'for_water_refilling_station', label: 'For Water Refilling Station', dueDate },
  { id: 'others', label: 'Others', dueDate },
];


function formatPeso(amount) {
  if (!amount || isNaN(amount)) return "₱0.00";
  return amount.toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  });
}

export default function NewSanitationForm({ initialData, readOnly = false }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [warningMessage, setWarningMessage] = useState('');
  const [sanitaryPermitChecklistState, setSanitaryPermitChecklistState] = useState([]);
  const [healthCertificateChecklistState, setHealthCertificateChecklistState] = useState('');
  const [msrChecklistState, setMsrChecklistState] = useState([]);
  const [isRequestTypeLocked, setIsRequestTypeLocked] = useState(false);
  const [canSubmit, setCanSubmit] = useState(true);
  const [isPersonnelCountLocked, setIsPersonnelCountLocked] = useState(false);

  const {
    control,
    register,           // ← added register
    handleSubmit,
    reset,
    getValues,
    setValue,
    watch,
    trigger,
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
      remarks: '',

    },
    resolver: yupResolver(schema),
  });
  const requestType = watch('requestType') || initialData?.requestType;
  const isNew = requestType === 'New';
  // ✅ New condition — only disable sections if real inspection or penalty data exists


  const bidNumber = watch('bidNumber');

  // 🧹 Clear form + reset state whenever bidNumber changes or is cleared
  const prevBidNumber = useRef(null);
  const isResettingRef = useRef(false);

  useEffect(() => {
    // Skip initial render
    if (prevBidNumber.current === null) {
      prevBidNumber.current = bidNumber;
      return;
    }

    // Prevent feedback loop after reset()
    if (isResettingRef.current) {
      isResettingRef.current = false;
      prevBidNumber.current = bidNumber;
      return;
    }

    // 🧹 Case 1: bidNumber cleared manually
    if (!bidNumber || bidNumber.trim() === '') {
      console.log('🧹 bidNumber cleared — resetting everything');

      isResettingRef.current = true;

      reset({
        bidNumber: '',
        businessName: '',
        businessAddress: '',
        businessEstablishment: '',
        status: '',
        // ✅ Preserve MSR due dates while clearing selections and labels
        msrChecklist: Object.fromEntries(
          msrChecklist.map((item) => [
            item.id,
            { selected: false, label: "", dueDate: item.dueDate },
          ])
        ),
        inspectionRecords: [],
        penaltyRecords: [],
        remarks: '',
        declaredPersonnel: '',
        declaredPersonnelDueDate: '',
        healthCertificates: '',
        healthCertBalanceToComply: '',
        healthCertDueDate: '',
        orDateHealthCert: '',
        orNumberHealthCert: '',
        healthCertSanitaryFee: '',
        healthCertFee: '',
        requestType: '',
      });

      setSanitaryPermitChecklistState([]);
      setHealthCertificateChecklistState('');
      setMsrChecklistState([]);
      clearMsrSelectionsButKeepDueDates(msrChecklist, setValue); // ✅ keep due dates intact
      setWarningMessage('');

      queryClient.removeQueries({ queryKey: ['business'] });
      queryClient.removeQueries({ queryKey: ['tickets'] });
    }
    // 🔁 Case 2: bidNumber changed to a different one
    else if (bidNumber !== prevBidNumber.current) {
      // 🔁 Case 2: bidNumber changed to a different one
      console.log(`🔁 bidNumber changed: ${prevBidNumber.current} → ${bidNumber}`);

      isResettingRef.current = true;

      // 👇 Hard reset dependent fields (including inspection/penalty)
      reset((values) => ({
        ...values,
        bidNumber, // keep new bidNumber
        businessName: '',
        businessAddress: '',
        businessEstablishment: '',
        status: '',
        remarks: '',
        requestType: '',
        // ✅ Preserve MSR due dates while clearing selections and labels
        msrChecklist: Object.fromEntries(
          msrChecklist.map((item) => [
            item.id,
            { selected: false, label: "", dueDate: item.dueDate },
          ])
        ),
        inspectionRecords: [],
        penaltyRecords: [],
        declaredPersonnel: '',
        declaredPersonnelDueDate: '',
        healthCertificates: '',
        healthCertBalanceToComply: '',
        healthCertDueDate: '',
        orDateHealthCert: '',
        orNumberHealthCert: '',
        healthCertSanitaryFee: '',
        healthCertFee: '',
      }));

      setSanitaryPermitChecklistState([]);
      setHealthCertificateChecklistState('');
      setMsrChecklistState([]);
      clearMsrSelectionsButKeepDueDates(msrChecklist, setValue); // ✅ keep due dates intact
      setWarningMessage('');


      // 🧹 Also clear cached queries so old tickets/records aren't reused
      queryClient.removeQueries({ queryKey: ['business'] });
      queryClient.removeQueries({ queryKey: ['tickets'] });

      // ✅ Force re-fetch fresh data for the new bidNumber
      queryClient.invalidateQueries(['business', bidNumber]);
      queryClient.invalidateQueries(['tickets', bidNumber]);
    }


    prevBidNumber.current = bidNumber;
  }, [bidNumber, reset, queryClient]);


  // ✅ Fetch business data based on selected bidNumber
  const { data: businessData, isFetching, error, refetch: refetchBusiness } = useQuery({
    queryKey: ['business', bidNumber],
    queryFn: async () => {
      if (!bidNumber) return null;
      console.log("🔄 Fetching business data for:", bidNumber);
      return await getBusinessByBid(bidNumber);
    },
    enabled: Boolean(bidNumber && bidNumber.trim() !== ''),
    keepPreviousData: false, // ✅ always fetch new data
    staleTime: 0,            // ✅ force immediate revalidation
  });

  const hasInspections = (businessData?.inspectionRecords?.length || 0) > 0;
  const hasPenalties = (businessData?.penaltyRecords?.length || 0) > 0;
  const isLocked = requestType === "Renewal" && (hasInspections || hasPenalties);
  const noRecords = !hasInspections && !hasPenalties;


  // ✅ Extract businessId after data is loaded
  const businessId = businessData?._id;

  // ✅ Fetch tickets for this business
  const { data: tickets = [], refetch: refetchTickets } = useQuery({
    queryKey: ['tickets', businessId, bidNumber], // ✅ include both businessId + bidNumber
    queryFn: async () => {
      if (!businessId || !bidNumber) return [];
      console.log("🎟️ Fetching tickets for:", businessId, "(BID:", bidNumber, ")");
      const res = await axios.get(`/api/ticket?businessId=${businessId}`);
      return res.data || [];
    },
    enabled: !!businessId && !!bidNumber,
    keepPreviousData: false, // ✅ clear old ticket data immediately
    staleTime: 0,
  });

  // ✅ Refetch tickets whenever the user switches to a new bidNumber
  useEffect(() => {
    if (businessId && bidNumber) {
      console.log("🔁 Forcing ticket refetch for bid:", bidNumber);
      refetchTickets();
    }
  }, [businessId, bidNumber, refetchTickets]);


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
        sanitaryPermitChecklist: data.sanitaryPermitChecklist,
        healthCertificateChecklist: data.healthCertificateChecklist,
        msrChecklist: data.msrChecklist,
        declaredPersonnel: data.declaredPersonnel || null,
        declaredPersonnelDueDate: data.declaredPersonnelDueDate || null,
        healthCertificates: data.healthCertificates || null,
        healthCertBalanceToComply: data.healthCertBalanceToComply || null,
        healthCertDueDate: data.healthCertDueDate || null,
        newRemarks: data.remarks || '',
      }),
    });

    const payload = await res.json();
    console.log("Response payload:", payload);

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
      setSanitaryPermitChecklistState([]);
      setHealthCertificateChecklistState('');
      setMsrChecklistState([]);
      clearMsrSelectionsButKeepDueDates(msrChecklist, setValue); // ✅ keep due dates intact
      setWarningMessage('');

      router.push('/businessaccount/request');
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

  // ✅ Check for active request
  const checkBusinessStatus = async (bid) => {
    try {
      const res = await fetch(`/api/business/${bid}`);
      if (!res.ok) return false;

      const { status } = await res.json();
      if (!status) return false;

      const normalized = status.toLowerCase();
      const activeStatuses = ['submitted', 'pending', 'pending2', 'pending3', 'pending4'];
      return activeStatuses.includes(normalized);
    } catch (err) {
      console.error("Error checking business status:", err);
      return false;
    }
  };


  const onSubmit = async (data) => {
    const hasActive = await checkBusinessStatus(data.bidNumber);
    if (hasActive) {
      setWarningMessage('🚫 There is already an ongoing sanitation request for this business.');
      return;
    }

    if (isNew) {
      console.warn("Inspection section is disabled for 'new' requests — skipping inspection submission.");
    }

    const sanitaryPermitChecklistPayload = sanitaryPermitChecklistState.map(id => {
      const def = sanitaryPermitChecklist.find(item => item.id === id);
      return { id, label: def?.label || id };
    });

    const healthCertificateChecklistPayload = healthCertificateChecklistState
      ? (() => {
        const def = healthCertificateChecklist.find(item => item.id === healthCertificateChecklistState);
        return [{ id: def?.id, label: def?.label || healthCertificateChecklistState }];
      })()
      : [];

    const msrChecklistPayload = Object.entries(data.msrChecklist || {})
      .filter(([_, val]) => val.selected)
      .map(([id, val]) => {
        const def = msrChecklist.find(item => item.id === id);
        return { id, label: def?.label || id, dueDate: val.dueDate || null };
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
    clearMsrSelectionsButKeepDueDates(msrChecklist, setValue); // ✅ keep due dates
    setWarningMessage('');
  };


  const { data: userBusinesses = [], isLoading: loadingBusinesses } = useQuery({
    queryKey: ['userBusinesses'],
    queryFn: getUserBusinesses,
  });

  // ✅ Verify Business Status
  useEffect(() => {
    const verify = async () => {
      if (!businessData?._id) return;
      const hasActive = await checkBusinessStatus(businessData.bidNumber);
      setCanSubmit(!hasActive);
    };
    verify();
  }, [businessData?._id]);

  // ✅ Auto-set request type when business data or ticket summary changes
  useEffect(() => {
    // IMPORTANT: do not reset bidNumber here — preserve it.
    if (!businessData) {
      // Clear dependent fields but keep bidNumber value intact
      reset((values) => ({
        ...values,
        // preserve values.bidNumber
        businessName: "",
        businessAddress: "",
        businessEstablishment: "",
        status: "",
        // ✅ Preserve MSR due dates while clearing selections and labels
        msrChecklist: Object.fromEntries(
          msrChecklist.map((item) => [
            item.id,
            { selected: false, label: "", dueDate: item.dueDate },
          ])
        ),
        inspectionRecords: [],
        penaltyRecords: [],
        remarks: "",
        declaredPersonnel: "",
        declaredPersonnelDueDate: "",
        healthCertificates: "",
        healthCertBalanceToComply: "",
        healthCertDueDate: "",
        orDateHealthCert: "",
        orNumberHealthCert: "",
        healthCertSanitaryFee: "",
        healthCertFee: "",
        requestType: "",
      }));
      setSanitaryPermitChecklistState([]);
      setHealthCertificateChecklistState("");
      setMsrChecklistState([]);
      clearMsrSelectionsButKeepDueDates(msrChecklist, setValue);

      setIsRequestTypeLocked(false);
      return;
    }

    const inspectionCount =
      tickets?.filter((t) => t.inspectionStatus === "completed").length || 0;
    const hasReinspection = inspectionCount >= 2;
    const hasPenalties =
      Array.isArray(businessData?.penaltyRecords) &&
      businessData.penaltyRecords.length > 0;

    const shouldLockRequestType =
      inspectionCount > 0 || hasReinspection || hasPenalties;
    const autoRequestType = shouldLockRequestType ? "Renewal" : "New";

    const currentType = watch("requestType");
    if (currentType !== autoRequestType) {
      setValue("requestType", autoRequestType);
      setIsRequestTypeLocked(shouldLockRequestType);
      console.log(
        "🧭 Auto-set requestType:",
        autoRequestType,
        "| Inspections:",
        inspectionCount,
        "| Penalties:",
        businessData?.penaltyRecords?.length || 0
      );
    }

    // populate fields from loaded businessData
    setValue("businessName", businessData?.businessName || "");
    setValue("businessAddress", businessData?.businessAddress || "");
    setValue("status", businessData?.status || "");
    setValue("businessEstablishment", businessData?.businessEstablishment || "");
  }, [businessData, bidNumber, tickets?.length, reset, setValue, watch]);

  useEffect(() => {
    // compute 90 days from today
    const dueDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    // existing defaults
    setValue("declaredPersonnelDueDate", dueDate);
    setValue("healthCertDueDate", dueDate);

    // ✅ set 90-day due date for all MSR checklist items
    msrChecklist?.forEach((item) => {
      setValue(`msrChecklist.${item.id}.dueDate`, dueDate);
    });
  }, [setValue, msrChecklist]);


  // ✅ Autofill from businessData.inspectionRecords
  useEffect(() => {
    if (!businessData?.inspectionRecords?.length) return;

    const inspections = businessData.inspectionRecords.slice(0, 2).map((inspection) => ({
      date: inspection.inspectionDate
        ? new Date(inspection.inspectionDate).toISOString().split("T")[0]
        : inspection.dateReinspected
          ? new Date(inspection.dateReinspected).toISOString().split("T")[0]
          : "",
      personnelCount:
        inspection.inspectionChecklist?.healthCertificates?.actualCount || "",
      inspectedBy:
        inspection.officerInCharge?.fullName ||
        (typeof inspection.officerInCharge === "string"
          ? inspection.officerInCharge
          : ""),
    }));

    const normalized = [
      inspections[0] || { date: "", personnelCount: "", inspectedBy: "" },
      inspections[1] || { date: "", personnelCount: "", inspectedBy: "" },
    ];

    console.log("📋 Loaded inspectionRecords from businessData:", normalized);
    setValue("inspectionRecords", normalized);
  }, [businessData, setValue]);

  // ✅ Disable editing of personnel count if inspections already exist
  useEffect(() => {
    const hasExistingInspections =
      (businessData?.inspectionRecords?.length || 0) > 0 ||
      (tickets?.filter((t) => t.inspectionStatus === "completed").length || 0) > 0;

    setIsPersonnelCountLocked(hasExistingInspections);
    console.log("👁️ Personnel count locked:", hasExistingInspections);
  }, [businessData, tickets]);

  // ✅ Autofill from tickets and compute penalties
  useEffect(() => {
    if (!Array.isArray(tickets) || tickets.length === 0) {
      console.log("🚫 No tickets found yet.");
      return;
    }

    const completed = tickets
      .filter((t) => t.inspectionStatus === "completed")
      .sort((a, b) => new Date(a.inspectionDate) - new Date(b.inspectionDate));

    const inspections = completed.slice(0, 2).map((t) => ({
      date: t.inspectionDate
        ? new Date(t.inspectionDate).toISOString().split("T")[0]
        : "",
      personnelCount:
        t.inspectionChecklist?.healthCertificates?.actualCount || "",
      inspectedBy:
        typeof t.officerInCharge === "object"
          ? t.officerInCharge?.fullName || ""
          : t.officerInCharge || "",
    }));

    const normalized = [
      inspections[0] || { date: "", personnelCount: "", inspectedBy: "" },
      inspections[1] || { date: "", personnelCount: "", inspectedBy: "" },
    ];

    console.log("✅ Normalized inspectionRecords:", normalized);
    setValue("inspectionRecords", normalized);

    let computed = [];
    if (completed.length >= 2) {
      const second = completed[1];
      const reinspectionYear = new Date(second.inspectionDate).getFullYear();
      const ic = second.inspectionChecklist || {};

      const violationTypes = [
        {
          label: "Sanitary Permit",
          violated: ic.sanitaryPermit === "without",
          computeAmount: (o) => (o === 1 ? 2000 : o === 2 ? 3000 : 5000),
        },
        {
          label: "Health Certificate",
          violated: (ic.healthCertificates?.withoutCert || 0) > 0,
          computeAmount: (o, m = ic.healthCertificates?.withoutCert || 0) => m * 500,
        },
        {
          label: "Water Potability",
          violated: ic.certificateOfPotability === "x",
          computeAmount: () => 500,
        },
        {
          label: "MSR",
          violated: ic.sanitaryOrder01 === "x" || ic.sanitaryOrder02 === "x",
          computeAmount: (o) => (o === 1 ? 1000 : o === 2 ? 2000 : 5000),
        },
      ];

      const pastYears = completed.map((t) => new Date(t.inspectionDate).getFullYear());
      const pastOffenseCount = pastYears.filter((y) => y < reinspectionYear).length;
      const offenseNumber = pastOffenseCount + 1;
      const offenseLabel =
        offenseNumber === 1 ? "1st" : offenseNumber === 2 ? "2nd" : "3rd";

      computed = violationTypes
        .filter((v) => v.violated)
        .map((v) => ({
          label: v.label,
          offense: offenseLabel,
          year: reinspectionYear,
          orDate: "",
          orNumber: "",
          amount: v.computeAmount(offenseNumber),
        }));

      console.log("💰 Computed penalties after reinspection:", computed);
    }

    setValue("penaltyRecords", computed);

    if (completed.length >= 2 || computed.length > 0) {
      setValue("requestType", "Renewal");
      setIsRequestTypeLocked(true);
      console.log("🔁 Auto-set to Renewal due to inspections or penalties");
    }
  }, [tickets?.length, setValue]);

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

      <div className="w-full max-w-6xl mx-auto px-4 mt-5">
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
                  <FormControl
                    variant="standard"
                    error={!!errors.bidNumber}
                    className="w-full max-w-[220px]"
                  >
                    <InputLabel id="bidNumber-label">Select Business</InputLabel>
                    <Select
                      labelId="bidNumber-label"
                      {...field}
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value)}
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
                    </Select>

                    {errors?.bidNumber && (
                      <p className="text-red-600 text-xs mt-1">
                        {errors.bidNumber.message}
                      </p>
                    )}
                  </FormControl>
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

            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-x-7 flex-nowrap">
                <span className="text-base font-medium text-gray-700 whitespace-nowrap">
                  <b>BUSINESS STATUS:</b>
                </span>

                <label className="flex items-center gap-2 whitespace-nowrap">
                  <input
                    type="radio"
                    value="New"
                    {...register('requestType')}
                    disabled={isRequestTypeLocked} // 🔒 lock if existing records
                  />
                  NEW
                </label>

                <label className="flex items-center gap-2 whitespace-nowrap">
                  <input
                    type="radio"
                    value="Renewal"
                    {...register('requestType')}
                    disabled={isRequestTypeLocked} // 🔒 same logic
                  />
                  RENEWAL
                </label>
              </div>

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
                      autoComplete="off" // ✅ prevents browser autofill
                      name={`sanitary-${item.id}`} // ✅ unique names also prevent autofill
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
                {/* ✅ O.R. Date (optional but validates format) */}
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

                {/* ✅ O.R. Number (optional but must be digits) */}
                <div className="flex items-center gap-2">
                  <label className="w-[120px] text-sm font-medium text-gray-700">
                    O.R. Number:
                  </label>
                  <RHFTextField
                    control={control}
                    name="orNumberHealthCert"
                    type="text"
                    variant="standard"
                    placeholder="Enter O.R. Number"
                    fullWidth
                    inputProps={{
                      inputMode: 'numeric',
                      maxLength: 20,
                    }}
                    onChange={(e) => {
                      const digitsOnly = e.target.value.replace(/\D/g, '');
                      setValue('orNumberHealthCert', digitsOnly, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                    }}
                  />
                </div>

                {/* ✅ Sanitary Fee (optional, validates number ≥ 0) */}
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
                    inputProps={{ step: '0.01', min: 0 }}
                    onBlur={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) {
                        setValue('healthCertSanitaryFee', value, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }
                    }}
                  />
                </div>

                {/* ✅ Health Certificate Fee (optional, validates number ≥ 0) */}

                {/* ✅ Health Certificate Fee (optional, validates number ≥ 0) */}
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
                    inputProps={{ step: '0.01', min: 0 }}
                    onBlur={(e) => {
                      const value = parseFloat(e.target.value);
                      if (!isNaN(value)) {
                        setValue('healthCertFee', value, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                      }
                    }}
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
            <div className="text-sm font-bold text-red-700 text-center ml-20">DUE DATE TO COMPLY</div>
            <div className="text-sm font-bold text-gray-700 text-center">CHECKLIST</div>
            <div className="text-sm font-bold text-red-700 text-center ml-20">DUE DATE TO COMPLY</div>
          </div>

          {/* Checklist rows */}
          <div className="grid grid-cols-2 gap-4">
            {msrChecklist.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[1fr_130px] items-center gap-2 border-b border-gray-100 py-1"
              >
                {/* Checklist cell */}
                <label className="flex items-center gap-2 text-sm text-gray-800">
                  <input
                    type="checkbox"
                    {...register(`msrChecklist.${item.id}.selected`)}
                    className="transform scale-125 accent-blue-600 mr-2"
                  />
                  <span>{item.label}</span>
                </label>

                {/* Due Date cell */}
                <RHFTextField
                  control={control}
                  name={`msrChecklist.${item.id}.dueDate`}
                  type="date"
                  variant="standard"
                  label=""
                  disabled
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    readOnly: isLocked,
                    style: isLocked ? { backgroundColor: "#f5f5f5", color: "#555" } : {},
                  }}

                  sx={{
                    color: '#b91c1c',
                    '& .MuiInputBase-input': {
                      color: '#b91c1c',
                      textAlign: 'center',
                      fontSize: 14,
                      padding: 0,
                    },
                    '& .MuiInput-underline:before': { borderBottomColor: '#b91c1c' },
                    '& .MuiInput-underline:hover:before': { borderBottomColor: '#b91c1c' },
                    '& .MuiInput-underline:after': { borderBottomColor: '#b91c1c' },
                  }}
                />

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
                  htmlFor="declaredPersonnelDueDate"
                  className="text-sm font-medium text-gray-700"
                >
                  DUE DATE TO COMPLY
                </label>
                <input
                  id="declaredPersonnelDueDate"
                  type="date"
                  {...register('declaredPersonnelDueDate')}
                  value={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split('T')[0]} // ✅ set to 90 days from today
                  readOnly
                  className="border border-gray-300 rounded px-2 py-1 w-full max-w-[130px] bg-gray-100 text-gray-700 cursor-not-allowed"
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
                  htmlFor="healthCertBalanceToComply"
                  className="text-sm font-medium text-gray-700"
                >
                  BALANCE TO COMPLY
                </label>
                <input
                  id="healthCertBalanceToComply"
                  type="text"
                  {...register('healthCertBalanceToComply')}
                  className="border border-gray-300 rounded px-2 py-1 w-full max-w-[160px] mt-10"
                  placeholder="Enter balance"
                  onBlur={(e) => {
                    const formatToTwoDecimals = (value) => {
                      const num = parseFloat(value);
                      return isNaN(num) ? '' : num.toFixed(2);
                    };

                    const formatted = formatToTwoDecimals(e.target.value);
                    setValue('healthCertBalanceToComply', formatted, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  }}
                />
              </div>



              <div className="flex flex-col gap-1 mt-4">
                <label
                  htmlFor="healthCertDueDate"
                  className="text-sm font-medium text-gray-700"
                >
                  HEALTH CERTIFICATE DUE DATE
                </label>
                <input
                  id="healthCertDueDate"
                  type="date"
                  {...register('healthCertDueDate')}
                  value={new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split('T')[0]}
                  readOnly
                  className="border border-gray-300 rounded px-2 py-1 w-full max-w-[130px] bg-gray-100 text-gray-700 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
          {/* Inspection Record */}
          <fieldset
            disabled={
              (bidNumber && requestType === "New") ||
              (!noRecords && requestType === "Renewal" && (hasInspections || hasPenalties))
            }
            className={
              (bidNumber && requestType === "New") ||
                (!noRecords && requestType === "Renewal" && (hasInspections || hasPenalties))
                ? "opacity-50 pointer-events-none"
                : ""
            }
          >
            <div className="w-full max-w-6xl mx-auto px-4 mb-6">
              <h3 className="text-lg font-bold text-gray-700 mb-2">Inspection Record</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full table-auto border-separate border-spacing-y-4">
                  <thead className="bg-transparent">
                    <tr>
                      <th className="px-4 py-2 text-sm font-medium text-gray-700 text-center"></th>
                      <th className="px-4 py-2 text-sm font-medium text-gray-700 text-center">Date</th>
                      <th className="px-4 py-2 text-sm font-medium text-gray-700 text-center">
                        Actual No. of Personnel Upon Inspection
                      </th>
                      <th className="px-4 py-2 text-sm font-medium text-gray-700 text-center">Inspected By</th>
                    </tr>
                  </thead>

                  <tbody>
                    {["1st", "2nd"].map((label, index) => {
                      const inspectionRecords = watch("inspectionRecords") || [];
                      const inspectionRecord = inspectionRecords[index] || {};

                      const inspectionDate = inspectionRecord.date || "";
                      const personnelCount = inspectionRecord.personnelCount || "";

                      return (
                        <tr key={label} className="bg-white shadow-sm rounded-md">
                          {/* Label */}
                          <td className="px-4 py-2 text-sm text-gray-700 text-center font-medium">
                            {label}
                          </td>

                          {/* Date */}
                          <td className="px-4 py-2">
                            <RHFTextField
                              control={control}
                              name={`inspectionRecords.${index}.date`}
                              variant="standard"
                              type="date"
                              fullWidth
                              defaultValue={inspectionDate}
                            />
                          </td>

                          {/* Actual Personnel Count */}
                          <td className="px-4 py-2">
                            <RHFTextField
                              control={control}
                              name={`inspectionRecords.${index}.personnelCount`}
                              variant="standard"
                              type="number"
                              fullWidth
                              defaultValue={personnelCount}
                              InputProps={{
                                readOnly:
                                  !!inspectionRecord.personnelCount ||
                                  (Array.isArray(businessData?.inspectionRecords) &&
                                    businessData.inspectionRecords.length > 0),
                              }}
                            />
                          </td>

                        {/* Inspected By */}
<td className="px-4 py-2">
  <Controller
    name={`inspectionRecords.${index}.inspectedBy`}
    control={control}
    defaultValue=""
    render={({ field }) => (
      <TextField
        {...field}
    
        variant="standard"
        fullWidth={false} // disable fullWidth so width can be controlled manually
        value={field.value ?? ""}
        sx={{
          minWidth: 120, // 🔹 increase this to make it longer (e.g. 250 or 300)
          ...( !noRecords && isLocked
            ? { backgroundColor: "#f5f5f5", color: "#555" }
            : {}
          ),
        }}
        InputProps={{
          readOnly: !noRecords && isLocked,
        }}
      />
    )}
  />
</td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </fieldset>


        </div>

        {/* Penalty Record Section */}
        <fieldset
          disabled={
            (bidNumber && requestType === "New") ||
            (!noRecords && requestType === "Renewal" && (hasInspections || hasPenalties))
          }
          className={
            (bidNumber && requestType === "New") ||
              (!noRecords && requestType === "Renewal" && (hasInspections || hasPenalties))
              ? "opacity-50 pointer-events-none"
              : ""
          }
        >
          <div className="w-full max-w-6xl mx-auto px-4 mb-6">
            <div className="grid grid-cols-[2fr_1fr] gap-6">
              <div>
                <h3 className="text-lg font-bold text-gray-700 mb-2">Penalty Record</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full table-auto border-separate border-spacing-y-4">
                    <thead>
                      <tr className="bg-transparent text-sm text-gray-700 text-center">
                        <th className="px-2 py-1">Checklist</th>
                        <th className="px-2 py-1">Offense</th>
                        <th className="px-2 py-1">Year (Inspection)</th>
                        <th className="px-2 py-1">O.R. Date</th>
                        <th className="px-2 py-1">O.R. Number</th>
                        <th className="px-2 py-1">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(watch("penaltyRecords")?.length
                        ? watch("penaltyRecords")
                        : [
                          { label: "Sanitary Permit" },
                          { label: "Health Certificate" },
                          { label: "Water Potability" },
                          { label: "MSR" },
                        ]
                      ).map((row, index) => (
                        <tr key={index} className="bg-white shadow-sm rounded-md">
                          {/* Checklist */}
                          <td className="px-2 py-1 text-sm text-gray-700">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                className="form-checkbox text-blue-600"
                                {...register(`penaltyRecords.${index}.isChecked`)}
                              />
                              {row.label ||
                                ["Sanitary Permit", "Health Certificate", "Water Potability", "MSR"][index]}
                            </label>
                          </td>

                          {/* Offense */}
                          <td className="px-2 py-1">
                            <Controller
                              name={`penaltyRecords.${index}.offense`}
                              control={control}
                              defaultValue={row.offense || ""}
                              render={({ field }) => (
                                <TextField
                                  {...field}
                                  select
                                  variant="standard"
                                  fullWidth
                                  InputProps={{
                                    readOnly: !noRecords && isLocked,
                                    style:
                                      !noRecords && isLocked
                                        ? { backgroundColor: "#f5f5f5", color: "#555" }
                                        : {},
                                  }}
                                >
                                  <MenuItem value="1st">1st</MenuItem>
                                  <MenuItem value="2nd">2nd</MenuItem>
                                  <MenuItem value="3rd">3rd</MenuItem>
                                </TextField>
                              )}
                            />
                          </td>

                          {/* Year */}
                          <td className="px-2 py-1">
                            <Controller
                              name={`penaltyRecords.${index}.year`}
                              control={control}
                              defaultValue={row.year || ""}
                              render={({ field: { onChange, value, ...rest } }) => (
                                <TextField
                                  {...rest}
                                  value={value || ""}
                                  onChange={(e) =>
                                    onChange(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))
                                  }
                                  variant="standard"
                                  fullWidth
                                  placeholder="YYYY"
                                  inputProps={{
                                    inputMode: "numeric",
                                    pattern: "[0-9]*",
                                    maxLength: 4,
                                  }}
                                  InputProps={{
                                    readOnly: !noRecords && isLocked,
                                    style:
                                      !noRecords && isLocked
                                        ? { backgroundColor: "#f5f5f5", color: "#555" }
                                        : {},
                                  }}
                                />
                              )}
                            />
                          </td>

                          {/* O.R. Date */}
                          <td className="px-2 py-1">
                            <Controller
                              name={`penaltyRecords.${index}.orDate`}
                              control={control}
                              defaultValue={row.orDate || ""}
                              render={({ field }) => (
                                <TextField
                                  {...field}
                                  type="date"
                                  variant="standard"
                                  fullWidth
                                  InputProps={{
                                    readOnly: !noRecords && isLocked,
                                    style:
                                      !noRecords && isLocked
                                        ? { backgroundColor: "#f5f5f5", color: "#555" }
                                        : {},
                                  }}
                                />
                              )}
                            />
                          </td>

                          {/* O.R. Number */}
                          <td className="px-2 py-1">
                            <Controller
                              name={`penaltyRecords.${index}.orNumber`}
                              control={control}
                              defaultValue={row.orNumber || ""}
                              render={({ field: { onChange, value, ...rest } }) => (
                                <TextField
                                  {...rest}
                                  value={value || ""}
                                  onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
                                  variant="standard"
                                  fullWidth
                                  inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                                  InputProps={{
                                    readOnly: !noRecords && isLocked,
                                    style:
                                      !noRecords && isLocked
                                        ? { backgroundColor: "#f5f5f5", color: "#555" }
                                        : {},
                                  }}
                                />
                              )}
                            />
                          </td>

                          {/* Amount */}
                          <td className="px-2 py-1 text-center font-semibold text-green-700">
                            <Controller
                              name={`penaltyRecords.${index}.amount`}
                              control={control}
                              defaultValue={row.amount || ""}
                              render={({ field: { onChange, value, ...rest } }) => (
                                <TextField
                                  {...rest}
                                  value={value || ""}
                                  onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
                                  variant="standard"
                                  fullWidth
                                  inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                                  InputProps={{
                                    readOnly: !noRecords && isLocked,
                                    style:
                                      !noRecords && isLocked
                                        ? { backgroundColor: "#f5f5f5", color: "#555" }
                                        : {},
                                  }}
                                />
                              )}
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
        </fieldset>



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
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={!canSubmit}
          >
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