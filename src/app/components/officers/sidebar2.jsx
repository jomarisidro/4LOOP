import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: 'Dashboard',         path: '/officers' },
  { label: 'Workbench',         path: '/officers/workbench' },
  { label: 'Businesses',        path: '/officers/businesses' },
  { label: 'Pending Request',   path: '/officers/pending' },
  { label: 'Completed Request', path: '/officers/completed' },
  { label: 'Profile Settings',  path: '/officers/profile' },
  { label: 'Help',              path: '/officers/help' },
  { label: 'Logout',            path: '/officers/logout' },
];

export default function Sidebar2() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-white border-r p-6 shadow flex flex-col items-center">
      <div className="flex flex-col items-center mb-6">
        <Image
          src="/images/profile.jpg"
          alt="Profile"
          width={80}
          height={80}
          className="rounded-full border border-gray-300 shadow-sm"
        />
        <h2 className="mt-4 text-lg font-semibold">Jomar Isidro</h2>
        <p className="text-sm text-gray-500">Officer</p>
      </div>

      <nav className="w-full space-y-4">
        {navItems.map((item) => (
          <Link
            key={item.label}
            href={item.path}
            className={`block text-lg px-4 py-1 transition ${
              pathname === item.path
                ? 'text-blue-600 font-semibold'
                : 'text-gray-700 hover:text-blue-600'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
