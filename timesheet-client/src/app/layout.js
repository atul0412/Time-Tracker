import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '../components/Navbar';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../context/AuthContext'; // ✅ import AuthProvider

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata = {
  title: 'Time-Tracker-App',
  description: 'The Timesheet Management System is a full-stack MongoDB, Express.js, Next.js, Node.js application designed to help organizations track employee work hours',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider> {/* ✅ wrap everything inside AuthProvider */}
          <Navbar />
          <main className="">{children}</main>
          <Toaster position="top-center" />
        </AuthProvider>
      </body>
    </html>
  );
}
