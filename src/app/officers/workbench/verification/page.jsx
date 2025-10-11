'use client';

import { useSearchParams } from 'next/navigation';
import { Box, Stack, Button, Typography } from '@mui/material';
import VerificationForm from '../../../components/officers/VerificationForm';

export default function VerificationOfRequestForm() {

  return (
    <div className="flex min-h-screen">
           {/* <Sidebar /> */}
          <main className="flex-1 p-6 relative">
            <section className="mt-6">
              <VerificationForm />
            </section>
          </main>
        </div>
  );
}
