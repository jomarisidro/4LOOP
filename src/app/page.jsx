import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const name = "aica";

  return (
    <div className="font-sans grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 bg-gray-50">
 
      <header className="row-start-1 flex flex-col items-center gap-4">
   
        <h1 className="text-3xl font-bold text-center text-blue-800 sm:text-left">
          Welcome to the Sanitation Department
        </h1>
        <h2 className="text-xl font-semibold text-gray-700">
          Home Page
        </h2>
      </header>

      {/* Main content */}
      <main className="row-start-2 flex flex-col gap-6 items-center sm:items-start">
        <Link
          href="/registration"
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
        >
          Register
        </Link>
        <Link
          href="/login"
          className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
        >
          Login
        </Link>
      </main>

      {/* Footer */}
      <footer className="row-start-3 text-sm text-gray-500 text-center">
        &copy; 2025 Sanitation Department. All rights reserved.
      </footer>
    </div>
  );
}
