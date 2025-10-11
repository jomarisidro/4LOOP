import './globals.css';
import Providers from '@/lib/providers';
import Link from 'next/link';
import Image from 'next/image';

export const metadata = {
  title: 'Pasig City Sanitation Permit System',
  description: 'A web-based sanitation permit and compliance monitoring platform.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-50 text-slate-800 dark:bg-slate-900 dark:text-slate-300">
        <Providers>
          <div className="min-h-screen flex flex-col">

            {/* Top Bar with Logo and Date */}
            <div className="bg-[#001F4D] text-white py-4">
              <div className="container mx-auto flex justify-between items-center px-6">

                {/* Left: Logo + Label */}
                <div className="flex items-center space-x-4">
                  <Link href="/" className="flex items-center">
                    <Image
                      src="/pasig-seal.png"
                      alt="Pasig City Logo"
                      width={64}
                      height={64}
                    />
                  </Link>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold tracking-wide">LUNGSOD </span>
                    <span className="text-sm font-semibold tracking-wide">NG</span>
                    <span className="text-sm font-semibold tracking-wide">PASIG</span>
                  </div>
                </div>

                {/* Right: Date */}
                <div className="text-right text-sm">
                  {new Date().toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}{' '}
                  |{' '}
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                  })}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <main>{children}</main>

          </div>
        </Providers>
      </body>
    </html>
  );
}
