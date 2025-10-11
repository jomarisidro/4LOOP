'use client';

import { useRouter } from 'next/navigation';

export default function BusinessRequestForm() {
  const router = useRouter();

  return (
    <>
      {/* 🔙 Back Button */}
      {/* <div className="mb-6">
        <button
          onClick={() => router.push('/businessaccount')}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded transition"
        >
          ← Back
        </button>
      </div> */}

      {/* ✨ Request Type Cards with Routing */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          onClick={() => router.push('/businessaccount/request/newbusiness')}
          className="bg-white rounded shadow p-6 hover:shadow-md cursor-pointer transition"
        >
          <h2 className="text-lg font-medium mb-2">🆕 New Sanitation Permit Request</h2>
          <p className="text-sm text-gray-600">Start a new business registration process.</p>
        </div>

        <div
          onClick={() => router.push('/businessaccount/request/requestsent')}
          className="bg-white rounded shadow p-6 hover:shadow-md cursor-pointer transition"
        >
          <h2 className="text-lg font-medium mb-2">🛡️ Check Your Request</h2>
          <p className="text-sm text-gray-600">Review or Edit your request.</p>
        </div>
      </div>
    </>
  );
}
