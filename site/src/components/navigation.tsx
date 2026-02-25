"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { Search, BookOpen, LogOut, LogIn, Lock, Phone, PlusCircle } from "lucide-react";
import Image from "next/image";

export function Navigation() {
  const { data: session, status } = useSession();

  return (
    <nav className="bg-[#231F20] text-[#F3F3EA] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <Image 
              src="/logomark.png" 
              alt="Venture Home" 
              width={40} 
              height={40}
              className="w-10 h-10"
            />
            <Image 
              src="/logo-horizontal.png" 
              alt="Venture Home" 
              width={180} 
              height={30}
              className="h-7 w-auto"
            />
          </Link>

          {/* Navigation Links - Always visible */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/browse"
              className="flex items-center gap-2 hover:text-[#7AEFB1] transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Articles
            </Link>
            <Link
              href="/search"
              className="flex items-center gap-2 hover:text-[#7AEFB1] transition-colors"
            >
              <Search className="w-4 h-4" />
              Search
            </Link>
            <a
              href="tel:800-203-4158"
              className="flex items-center gap-2 bg-[#F7FF96] text-[#231F20] px-4 py-2 rounded-lg font-medium hover:bg-[#7AEFB1] transition-colors"
            >
              <Phone className="w-4 h-4" />
              800-203-4158
            </a>
          </div>

          {/* Auth */}
          <div className="flex items-center gap-4">
            {status === "loading" ? (
              <div className="w-8 h-8 bg-[#B1C3BD] rounded-full animate-pulse" />
            ) : session ? (
              <>
                <Link
                  href="/admin/create"
                  className="hidden sm:flex items-center gap-2 text-[#7AEFB1] hover:text-[#F7FF96] transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  Create
                </Link>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#7AEFB1]" />
                  <span className="text-sm text-[#B1C3BD] hidden sm:inline">
                    {session.user?.email}
                  </span>
                </div>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-2 bg-[#F7FF96] text-[#231F20] px-4 py-2 rounded-lg font-medium hover:bg-[#7AEFB1] transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => signIn("google")}
                className="flex items-center gap-2 border-2 border-[#F7FF96] text-[#F7FF96] px-4 py-2 rounded-lg font-medium hover:bg-[#F7FF96] hover:text-[#231F20] transition-colors"
              >
                <Lock className="w-4 h-4" />
                Team Login
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
