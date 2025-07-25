'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [role, setRole] = useState('');
  const router = useRouter();
  const pathname = usePathname(); // 👈 current route

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setRole(user.role);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logout successful');
    router.push('/login');
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/projects/create', label: 'Create' },

  ];

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

  return (
    // <nav className="bg-white shadow-md fixed w-full z-50 top-0 left-0">
    //   <div className="max-w-xxl mx-auto px-2 sm:px-6 lg:px-8">
    //     <div className="flex items-center justify-between h-16">
    //       <div className="flex-shrink-0">
    //         <Link href="/" className="text-xl font-bold text-blue-700">
    //           Time-Sheet
    //         </Link>
    //       </div>

    //       {/* Desktop Menu */}
    //       <div className="hidden md:flex items-center space-x-6">
    //         {navLinks.map((link) => (
    //           <Link
    //             key={link.href}
    //             href={link.href}
    //             className="text-gray-700 hover:text-blue-600 transition"
    //           >
    //             {link.label}
    //           </Link>
    //         ))}
    //         {pathname !== '/login' && (
    //           <button
    //             onClick={handleLogout}
    //             className="text-gray-700 hover:text-red-500 transition"
    //           >
    //             Logout
    //           </button>
    //         )}
    //       </div>

    //       {/* Mobile Menu Button */}
    //       <div className="md:hidden">
    //         <button onClick={() => setIsOpen(!isOpen)} className="text-gray-700">
    //           {isOpen ? <X size={24} /> : <Menu size={24} />}
    //         </button>
    //       </div>
    //     </div>
    //   </div>

    //   {/* Mobile Dropdown */}
    //   {isOpen && (
    //     <div className="md:hidden bg-white shadow-md px-4 pt-2 pb-4 space-y-2">
    //       {navLinks.map((link) => (
    //         <Link
    //           key={link.href}
    //           href={link.href}
    //           className="block text-gray-700 hover:text-blue-600 transition"
    //           onClick={() => setIsOpen(false)}
    //         >
    //           {link.label}
    //         </Link>
    //       ))}
    //       {pathname !== '/login' && (
    //         <button
    //           onClick={() => {
    //             setIsOpen(false);
    //             handleLogout();
    //           }}
    //           className="block text-gray-700 hover:text-red-500 transition w-full text-left"
    //         >
    //           Logout
    //         </button>
    //       )}
    //     </div>
    //   )}
    // </nav>
    <>
 
        <div>
            {/* Navbar */}
            <nav className="bg-purple-950 p-4">
                <div className="container mx-auto flex flex-col lg:flex-row justify-between items-center">
                  <div>
                    <Link href="/" className="text-white font-bold text-3xl mb-4 lg:mb-0 hover:text-orange-600 hover:cursor-pointer">Timesheet </Link>
                  </div>
                    {/* Hamburger menu for small screens */}
                    <div>
                    <div className="lg:hidden">
                        <button onClick={toggleMenu} className="text-white focus:outline-none">
                            <svg
                                className="h-6 w-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M4 6h16M4 12h16m-7 6h7"
                                ></path>
                            </svg>
                        </button>
                    </div>

                    {/* Navigation links */}
                    <div className={`lg:flex flex-col lg:flex-row ${isOpen ? 'block' : 'hidden'} lg:space-x-4 lg:mt-0 mt-4 flex flex-col items-center text-xl`}>
                        <Link href="/" className="text-white  px-4 py-2 hover:text-orange-600 ">Home</Link>
                        <Link href="/projects/create" className="text-white  px-4 py-2  hover:text-orange-600">Add Projects</Link>
                        <Link href="#" className="text-white  px-4 py-2  hover:text-orange-600" onClick={handleLogout}>Logout</Link>
                        {/* <a href="/" className="text-white  px-4 py-2  hover:text-orange-600">Contact Me</a> */}
                    </div>
                    </div>
                </div>
                
            </nav>


        </div>
</>

  );
}
