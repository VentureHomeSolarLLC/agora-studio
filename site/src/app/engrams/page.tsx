import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getAllEngrams } from "@/lib/content";
import Link from "next/link";
import { Zap, Cpu } from "lucide-react";

export default async function EngramsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const engrams = getAllEngrams();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#231F20] mb-2 flex items-center gap-3">
          <Zap className="w-8 h-8 text-[#7AEFB1]" />
          Engrams
        </h1>
        <p className="text-[#231F20]/70">
          {engrams.length} knowledge units with AI skills for agent execution.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {engrams.map((engram) => (
          <Link
            key={engram.slug}
            href={`/engrams/${engram.slug}`}
            className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-[#B1C3BD]/30 group"
          >
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-xl font-semibold text-[#231F20] group-hover:text-[#231F20]/80">
                {engram.title}
              </h2>
              {engram.hasSkill && (
                <span className="flex items-center gap-1 text-xs bg-[#7AEFB1] text-[#231F20] px-2 py-1 rounded-full">
                  <Cpu className="w-3 h-3" />
                  AI Skill
                </span>
              )}
            </div>
            <p className="text-[#231F20]/60">{engram.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
