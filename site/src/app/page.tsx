import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getAllConcepts, getAllEngrams } from "@/lib/content";
import Link from "next/link";
import { BookOpen, Zap, Search, ArrowRight } from "lucide-react";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-2xl text-center">
          <div className="w-20 h-20 bg-[#F7FF96] rounded-2xl flex items-center justify-center mx-auto mb-8">
            <Zap className="w-10 h-10 text-[#231F20]" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#231F20] mb-6">
            Agora Studio
          </h1>
          <p className="text-xl text-[#231F20]/70 mb-4">
            The unified knowledge base for Venture Home Solar
          </p>
          <p className="text-sm text-[#231F20]/50 mb-8">
            Sign in with your @venturehome.com Google account to access
          </p>
        </div>
      </div>
    );
  }

  const concepts = getAllConcepts();
  const engrams = getAllEngrams();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-[#231F20] mb-4">
          Welcome to Agora Studio
        </h1>
        <p className="text-lg text-[#231F20]/70 max-w-2xl">
          The comprehensive knowledge base powering customer support, agent skills, and team learning at Venture Home Solar.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Link
          href="/concepts"
          className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-[#B1C3BD]/30 group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-[#F7FF96] rounded-lg flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-[#231F20]" />
            </div>
            <ArrowRight className="w-5 h-5 text-[#B1C3BD] group-hover:text-[#231F20] transition-colors" />
          </div>
          <h2 className="text-2xl font-bold text-[#231F20]">{concepts.length}</h2>
          <p className="text-[#231F20]/60">Concepts</p>
        </Link>

        <Link
          href="/engrams"
          className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-[#B1C3BD]/30 group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-[#7AEFB1] rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-[#231F20]" />
            </div>
            <ArrowRight className="w-5 h-5 text-[#B1C3BD] group-hover:text-[#231F20] transition-colors" />
          </div>
          <h2 className="text-2xl font-bold text-[#231F20]">{engrams.length}</h2>
          <p className="text-[#231F20]/60">Engrams</p>
        </Link>

        <Link
          href="/search"
          className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-[#B1C3BD]/30 group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-[#B1C3BD] rounded-lg flex items-center justify-center">
              <Search className="w-6 h-6 text-[#231F20]" />
            </div>
            <ArrowRight className="w-5 h-5 text-[#B1C3BD] group-hover:text-[#231F20] transition-colors" />
          </div>
          <h2 className="text-2xl font-bold text-[#231F20]">Search</h2>
          <p className="text-[#231F20]/60">Find anything</p>
        </Link>
      </div>

      {/* Recent Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#B1C3BD]/30">
          <h2 className="text-lg font-semibold text-[#231F20] mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#F7FF96]" />
            Recently Added Concepts
          </h2>
          <div className="space-y-3">
            {concepts.slice(-5).reverse().map((concept) => (
              <Link
                key={concept.slug}
                href={`/concepts/${concept.slug}`}
                className="block p-3 rounded-lg hover:bg-[#F3F3EA] transition-colors"
              >
                <h3 className="font-medium text-[#231F20]">{concept.title}</h3>
                <div className="flex gap-2 mt-1">
                  {concept.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-[#F7FF96] text-[#231F20] px-2 py-0.5 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-[#B1C3BD]/30">
          <h2 className="text-lg font-semibold text-[#231F20] mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#7AEFB1]" />
            Engrams
          </h2>
          <div className="space-y-3">
            {engrams.map((engram) => (
              <Link
                key={engram.slug}
                href={`/engrams/${engram.slug}`}
                className="block p-3 rounded-lg hover:bg-[#F3F3EA] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-[#231F20]">{engram.title}</h3>
                  {engram.hasSkill && (
                    <span className="text-xs bg-[#7AEFB1] text-[#231F20] px-2 py-0.5 rounded-full">
                      AI Skill
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#231F20]/60 mt-1">
                  {engram.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
