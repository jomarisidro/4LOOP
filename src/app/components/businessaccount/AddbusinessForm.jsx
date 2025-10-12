'use client';

import * as yup from 'yup';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'next/navigation';
import RHFTextField from '@/app/components/ReactHookFormElements/RHFTextField';
import Button from '@mui/material/Button';
import { MenuItem, TextField } from '@mui/material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addOwnerBusiness } from '@/app/services/BusinessService';

// ✅ Validation schema with BID Number format
const schema = yup.object().shape({
  bidNumber: yup
    .string()
    .required('BID Number is required')
    .matches(/^[A-Z]{2}-\d{4}-\d{6}$/, 'Format must be like AM-2025-123456'),
  businessName: yup.string().required('Name of Company is required'),
  businessNickname: yup.string().required('Trade Name is required'),
  businessType: yup.string().required('Line of Business is required'),
  businessAddress: yup.string().required('Business Address is required'),
  contactPerson: yup.string().required('Contact Person is required'),
  contactNumber: yup
    .string()
    .required('Contact Number is required')
    .matches(/^09\d{9}$/, 'Enter a valid 11-digit mobile number (e.g. 09123456789)'),
});

export default function AddbusinessForm() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: {
      bidNumber: '',
      businessName: '',
      businessNickname: '',
      businessType: '',
      businessAddress: '',
      landmark: '',
      contactPerson: '',
      contactNumber: '',
    },
    resolver: yupResolver(schema),
  });

  const { mutate } = useMutation({
    mutationFn: addOwnerBusiness,
    onSuccess: (data) => {
      alert('A new business has been successfully saved to your account.');
      console.log('Business has been successfully saved!', data?.data);
      queryClient.invalidateQueries(['business-list']);
      router.push('/businessaccount/businesses/businesslist');
    },
    onError: (err) => {
      console.error('Request Error:', err);
    },
  });

  const onSubmit = (data) => {
    const payload = { ...data, status: 'draft' };
    mutate(payload);
    router.push('/businessaccount/businesses/businesslist');
  };

  const handleSaveDraft = () => {
    const draftData = getValues();
    console.log('Draft saved:', draftData);
  };

  const handleClear = () => {
    reset();
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-6 mb-8 max-w-4xl">
        <div
          onClick={() => router.push('/businessaccount/businesses/businesslist')}
          className="bg-white rounded shadow p-6 hover:shadow-md cursor-pointer transition"
        >
          <h2 className="text-lg font-medium mb-2">📋 Business Lists</h2>
          <p className="text-sm text-gray-600">View and manage registered businesses.</p>
        </div>
        <div className="bg-white rounded shadow p-6 hover:shadow-md cursor-pointer">
          <h2 className="text-lg font-medium mb-2">➕ Add a Business</h2>
          <p className="text-sm text-gray-600">Register a new business to your list.</p>
        </div>
      </div>

      <h1 className="text-2xl font-semibold mb-6">Add a New Business</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
        {/* ✅ BID Number — user-input with validation */}
        <RHFTextField
          control={control}
          name="bidNumber"
          label="BID Number*"
          placeholder="e.g. AM-2025-123456"
          error={!!errors.bidNumber}
          helperText={errors?.bidNumber?.message || ''}
        />

        <RHFTextField
          control={control}
          name="businessName"
          label="Name of Company*"
          placeholder="Name of Company*"
          error={!!errors.businessName}
          helperText={errors?.businessName?.message}
        />

        <RHFTextField
          control={control}
          name="businessNickname"
          label="Trade Name*"
          placeholder="Trade Name*"
          error={!!errors.businessNickname}
          helperText={errors?.businessNickname?.message}
        />

        {/* ✅ Dropdown for Line of Business */}
        <Controller
          name="businessType"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              select
              label="Line of Business*"
              fullWidth
              error={!!errors.businessType}
              helperText={errors?.businessType?.message}
            >
              <MenuItem value="">Select Line of Business</MenuItem>
              <MenuItem value="Food">Food</MenuItem>
              <MenuItem value="Non-Food">Non-Food</MenuItem>
            </TextField>
          )}
        />

        <RHFTextField
          control={control}
          name="businessAddress"
          label="Business Address*"
          placeholder="Business Address*"
          error={!!errors.businessAddress}
          helperText={errors?.businessAddress?.message}
        />

        <RHFTextField
          control={control}
          name="landmark"
          label="Landmark*"
          placeholder="Landmark*"
          error={!!errors.landmark}
          helperText={errors?.landmark?.message}
        />

        <RHFTextField
          control={control}
          name="contactPerson"
          label="Contact Person*"
          placeholder="Contact Person*"
          error={!!errors.contactPerson}
          helperText={errors?.contactPerson?.message}
        />

        {/* ✅ Contact Number — only allows 11 digits (starts with 09) */}
        <Controller
          name="contactNumber"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Contact Number*"
              placeholder="e.g. 09123456789"
              fullWidth
              inputProps={{
                maxLength: 11,
                inputMode: 'numeric',
                pattern: '[0-9]*',
              }}
              onInput={(e) => {
                e.target.value = e.target.value.replace(/\D/g, '').slice(0, 11);
                field.onChange(e.target.value);
              }}
              error={!!errors.contactNumber}
              helperText={errors?.contactNumber?.message}
            />
          )}
        />

        <div className="flex justify-start gap-4">
          <Button type="submit" variant="contained" color="primary">
            Save Business
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
