'use client';

export default function BusinessesForm() {


  return (
    <>
   

      {/* 🏢 Business Overview */}


      <div className="grid grid-cols-2 gap-6 max-w-4xl">
        <div
          className="bg-white rounded shadow p-6 hover:shadow-md cursor-pointer transition"
          onClick={() => window.location.href = '/businessaccount/businesses/businesslist'}
        >
          <h2 className="text-lg font-medium mb-2">📋 Business Lists</h2>
          <p className="text-sm text-gray-600">View and manage registered businesses.</p>
        </div>
        <div
          className="bg-white rounded shadow p-6 hover:shadow-md cursor-pointer transition"
          onClick={() => window.location.href = '/businessaccount/businesses/addbusiness'}
        >
          <h2 className="text-lg font-medium mb-2">➕ Add a Business</h2>
          <p className="text-sm text-gray-600">Register a new business to your list.</p>
        </div>
      </div>
    </>
  );
}
