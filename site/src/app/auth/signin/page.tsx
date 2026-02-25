import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { SignInButton } from "@/components/signin-button";
import { Zap, Shield } from "lucide-react";

export default async function SignInPage() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#F7FF96] rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Zap className="w-10 h-10 text-[#231F20]" />
          </div>
          <h1 className="text-3xl font-bold text-[#231F20] mb-2">
            Agora Studio
          </h1>
          <p className="text-[#231F20]/60">
            Venture Home Knowledge Base
          </p>
        </div>

        {/* Sign In Card */}
        <div className="bg-white rounded-xl p-8 shadow-sm border border-[#B1C3BD]/30">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-[#7AEFB1]" />
            <h2 className="text-lg font-semibold text-[#231F20]">
              Sign In Required
            </h2>
          </div>

          <p className="text-[#231F20]/70 mb-6">
            This knowledge base is restricted to Venture Home team members. 
            Please sign in with your @venturehome.com Google account.
          </p>

          <SignInButton />

          <p className="text-xs text-[#231F20]/50 mt-6 text-center">
            If you don&apos;t have access, contact your administrator.
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-[#231F20]/40 mt-8">
          © 2026 Venture Home Solar, LLC
        </p>
      </div>
    </div>
  );
}
