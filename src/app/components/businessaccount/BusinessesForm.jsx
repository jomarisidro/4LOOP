'use client';

import Link from 'next/link';

export default function BusinessesForm() {
  return (
    <>
      {/* 💡 Help and Guidance Section */}
      <div className="mb-8 max-w-4xl bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-md font-semibold mb-2">ℹ️ Need Help?</h3>
        <p className="text-sm text-gray-700">
          If you want to learn more about the sanitation permit process and the
          requirements your business must comply with, please visit our{' '}
          <Link
            href="/businessaccount/help"
            className="text-blue-600 font-medium hover:underline"
          >
            Help Page
          </Link>
          .
        </p>
      </div>

      {/* 🏢 Business Overview */}
      <div className="grid grid-cols-2 gap-6 max-w-4xl">
        <div
          className="bg-white rounded shadow p-6 hover:shadow-md cursor-pointer transition"
          onClick={() =>
            (window.location.href = '/businessaccount/businesses/businesslist')
          }
        >
          <h2 className="text-lg font-medium mb-2">📋 Business Lists</h2>
          <p className="text-sm text-gray-600">
            View and manage registered businesses.
          </p>
        </div>

        <div
          className="bg-white rounded shadow p-6 hover:shadow-md cursor-pointer transition"
          onClick={() =>
            (window.location.href = '/businessaccount/businesses/addbusiness')
          }
        >
          <h2 className="text-lg font-medium mb-2">➕ Add a Business</h2>
          <p className="text-sm text-gray-600">
            Register a new business to your list.
          </p>
        </div>
      </div>
    </>
  );
}
