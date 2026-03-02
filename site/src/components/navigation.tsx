"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { LogOut, Lock } from "lucide-react";
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

          {/* Right side: Phone + Auth */}
          <div className="flex items-center gap-6">
            <a
              href="tel:800-203-4158"
              className="text-[#F3F3EA] hover:text-[#F7FF96] transition-colors text-sm"
            >
              800-203-4158
            </a>
            
            {status === "loading" ? (
              <div className="w-8 h-8 bg-[#B1C3BD] rounded-full animate-pulse" />
            ) : session ? (
              <>
                <Link
                  href="/admin/engrams/new"
                  className="hidden sm:flex items-center gap-2 text-[#7AEFB1] hover:text-[#F7FF96] transition-colors text-sm"
                >
                  Create
                </Link>
                <Link
                  href="/engrams"
                  className="hidden sm:flex items-center gap-2 text-[#7AEFB1] hover:text-[#F7FF96] transition-colors text-sm"
                >
                  Engrams
                </Link>
                <Link
                  href="/search"
                  className="hidden sm:flex items-center gap-2 text-[#7AEFB1] hover:text-[#F7FF96] transition-colors text-sm"
                >
                  Search
                </Link>
                <Link
                  href="/admin/engrams/map"
                  className="hidden md:flex items-center gap-2 text-[#7AEFB1] hover:text-[#F7FF96] transition-colors text-sm"
                >
                  Map
                </Link>
                <Link
                  href="/admin/builder"
                  className="hidden md:flex items-center gap-2 text-[#7AEFB1] hover:text-[#F7FF96] transition-colors text-sm"
                >
                  Wiki Builder
                </Link>
                <Link
                  href="/browse"
                  className="hidden md:flex items-center gap-2 text-[#7AEFB1] hover:text-[#F7FF96] transition-colors text-sm"
                >
                  Browse
                </Link>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-2 text-[#F3F3EA] hover:text-[#F7FF96] transition-colors text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => signIn("google")}
                className="flex items-center gap-2 text-[#F3F3EA] hover:text-[#F7FF96] transition-colors text-sm"
              >
                <Lock className="w-4 h-4" />
                <span className="hidden sm:inline">Team Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
