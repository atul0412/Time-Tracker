'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { Menu, X, User, LogOut, FileText, Users, FolderPlus, Clipboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logout successful');
    router.push('/login');
  };

  const navLinks = [
    { href: '/', label: 'Home', icon: FileText }
  ];

  if (user?.role === 'admin') {
    navLinks.push(
      { href: '/user', label: 'All Users', icon: Users },
      { href: '/projects/create', label: 'Add Project', icon: FolderPlus },
      { href: '/AssignedProject', label: 'Assigned Project', icon: Clipboard },
      { href: '/reports', label: 'View Reports', icon: FileText },
      { href: '/audit-logs', label: 'Audit Logs', icon: FileText }
    );
  }

  if (user?.role === 'project_manager') {
    navLinks.push(
      { href: '/AssignedProject', label: 'Assigned Project', icon: Clipboard },
    );
  }



  // 🔒 Hide navbar on auth pages
  if (
    pathname === '/login' ||
    pathname === '/forgot-password' ||
    pathname.startsWith('/reset-password')
  )
    return null;

  const isActivePage = (href) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-gradient-to-r from-purple-900 via-purple-950 to-purple-900 shadow-xl sticky top-0 z-50 border-b border-purple-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-2 group"
          >
            <div className="bg-purple-700 p-2 rounded-lg group-hover:bg-purple-600 transition-colors duration-200">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-white font-bold text-xl group-hover:text-purple-200 transition-colors duration-200">
              Time-Tracker
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActivePage(link.href)
                      ? 'bg-purple-700 text-white shadow-lg'
                      : 'text-purple-100 hover:bg-purple-800 hover:text-white'
                  }`}
                >
                  <Icon size={16} />
                  <span>{link.label}</span>
                </Link>
              );
            })}
            
            {/* User Profile & Logout */}
            {user && (
              <div className="flex items-center space-x-3 ml-6 pl-6 border-l border-purple-700">
                <div className="flex items-center space-x-2 px-3 py-1 bg-purple-800 rounded-lg">
                  <div className="bg-purple-600 p-1 rounded-full">
                    <User size={14} className="text-white" />
                  </div>
                  <span className="text-purple-100 text-sm font-medium">{user.name}</span>
                  {user.role === 'admin' && (
                    <span className="bg-purple-600 text-purple-100 text-xs px-2 py-0.5 rounded-full">
                      Admin
                    </span>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-2 px-3 py-2 text-purple-100 hover:text-white hover:bg-red-600 rounded-lg transition-all duration-200 group"
                >
                  <LogOut size={16} className="group-hover:rotate-12 transition-transform duration-200" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white p-2 rounded-lg hover:bg-purple-800 transition-colors duration-200"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {isOpen && (
        <div className="md:hidden bg-purple-950/95 backdrop-blur-sm border-t border-purple-800">
          <div className="px-4 py-4 space-y-2">
            {/* Mobile User Info */}
            {user && (
              <div className="flex items-center space-x-3 px-4 py-3 bg-purple-900 rounded-lg mb-4">
                <div className="bg-purple-700 p-2 rounded-full">
                  <User size={16} className="text-white" />
                </div>
                <div>
                  <div className="text-white font-medium">{user.name}</div>
                  <div className="text-purple-300 text-sm">{user.email}</div>
                  {user.role === 'admin' && (
                    <span className="bg-purple-600 text-purple-100 text-xs px-2 py-0.5 rounded-full mt-1 inline-block">
                      Administrator
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Mobile Navigation Links */}
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    isActivePage(link.href)
                      ? 'bg-purple-700 text-white shadow-lg'
                      : 'text-purple-100 hover:bg-purple-800 hover:text-white'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  <Icon size={18} />
                  <span className="font-medium">{link.label}</span>
                </Link>
              );
            })}

            {/* Mobile Logout */}
            {user && (
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                className="flex items-center space-x-3 px-4 py-3 text-purple-100 hover:text-white hover:bg-red-600 rounded-lg w-full text-left transition-all duration-200 mt-4 border-t border-purple-800 pt-4"
              >
                <LogOut size={18} />
                <span className="font-medium">Logout</span>
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
