'use client';

import { useSearchParams } from 'next/navigation';
import { Box, Stack, Button, Typography } from '@mui/material';
import ComplianceForm from '@/app/components/officers/ComplianceForm';
export default function EncodingPage() {

  return (
    <div className="flex min-h-screen">
           {/* <Sidebar /> */}
          <main className="flex-1 p-6 relative">
            <section className="mt-6">
              <ComplianceForm />
            </section>
          </main>
        </div>
  );
}
