'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext'; // ✅

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser } = useAuth(); // ✅ Use global auth

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null); // ✅ clear context
    toast.success('Logout successful');
    router.push('/login');
  };

  // Base nav links
  const navLinks = [{ href: '/', label: 'Home' }];

  // Add admin-only links
  if (user?.role === 'admin') {
    navLinks.push({ href: '/user', label: 'All Users' });
    navLinks.push({ href: '/projects/create', label: 'Add Project' });
    navLinks.push({ href: '/AssignedProject', label: 'Assigned Project' });
  }

  if (pathname === '/login') return null;

  return (
    <nav className="bg-purple-950 p-4 sticky top-0 z-50">
      <div className="max-w-8xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="text-white font-bold text-3xl hover:text-orange-600"
          >
            Time-Sheet
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-white">
                {link.label}
              </Link>
            ))}
            {user && (
              <button
                onClick={handleLogout}
                className="text-white hover:text-red-500 transition"
              >
                Logout
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={() => setIsOpen(!isOpen)} className="text-white">
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-purple-950 shadow-md px-4 pt-2 pb-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-white hover:text-red-500 transition"
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {user && (
            <button
              onClick={() => {
                setIsOpen(false);
                handleLogout();
              }}
              className="block text-white hover:text-red-500 w-full text-left"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
