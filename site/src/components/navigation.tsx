"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { Search, BookOpen, Zap, LogOut, LogIn, Lock } from "lucide-react";

export function Navigation() {
  const { data: session, status } = useSession();

  return (
    <nav className="bg-[#231F20] text-[#F3F3EA] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-[#F7FF96] rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#231F20]" />
            </div>
            <span className="font-bold text-xl group-hover:text-[#F7FF96] transition-colors">
              Venture Home Help
            </span>
          </Link>

          {/* Navigation Links - Always visible */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/"
              className="hover:text-[#F7FF96] transition-colors"
            >
              Home
            </Link>
            <Link
              href="/browse"
              className="flex items-center gap-2 hover:text-[#F7FF96] transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Articles
            </Link>
            <Link
              href="/search"
              className="flex items-center gap-2 hover:text-[#F7FF96] transition-colors"
            >
              <Search className="w-4 h-4" />
              Search
            </Link>
          </div>

          {/* Auth */}
          <div className="flex items-center gap-4">
            {status === "loading" ? (
              <div className="w-8 h-8 bg-[#B1C3BD] rounded-full animate-pulse" />
            ) : session ? (
              <>
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
                className="flex items-center gap-2 bg-[#F7FF96] text-[#231F20] px-4 py-2 rounded-lg font-medium hover:bg-[#7AEFB1] transition-colors"
              >
                <Lock className="w-4 h-4" />
                Team Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
