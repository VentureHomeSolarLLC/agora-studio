"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Search, BookOpen, Zap, ArrowRight } from "lucide-react";

interface SearchResult {
  slug: string;
  title: string;
  type: "concept" | "engram";
  excerpt: string;
  tags: string[];
}

export default function SearchPage() {
  const { data: session, status } = useSession();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 bg-[#F7FF96] rounded-full animate-pulse" />
      </div>
    );
  }

  if (!session) {
    redirect("/auth/signin");
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results);
    } catch (error) {
      console.error("Search failed:", error);
    }
    setIsSearching(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#231F20] mb-4 flex items-center gap-3">
          <Search className="w-8 h-8 text-[#B1C3BD]" />
          Search Knowledge Base
        </h1>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search concepts, engrams, tags..."
            className="w-full px-4 py-4 pr-12 text-lg bg-white border-2 border-[#B1C3BD]/30 rounded-xl focus:border-[#F7FF96] focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-[#F7FF96] text-[#231F20] rounded-lg hover:bg-[#7AEFB1] transition-colors disabled:opacity-50"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </form>

      {/* Results */}
      {isSearching ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 bg-[#F7FF96] rounded-full animate-pulse" />
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          <p className="text-[#231F20]/60 mb-4">
            Found {results.length} result{results.length !== 1 ? "s" : ""}
          </p>
          {results.map((result) => (
            <Link
              key={`${result.type}-${result.slug}`}
              href={`/${result.type}s/${result.slug}`}
              className="block bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow border border-[#B1C3BD]/30 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 mb-2">
                  {result.type === "concept" ? (
                    <BookOpen className="w-5 h-5 text-[#F7FF96]" />
                  ) : (
                    <Zap className="w-5 h-5 text-[#7AEFB1]" />
                  )}
                  <span className="text-xs uppercase tracking-wide text-[#231F20]/50">
                    {result.type}
                  </span>
                </div>
                <ArrowRight className="w-5 h-5 text-[#B1C3BD] group-hover:text-[#231F20] transition-colors" />
              </div>
              <h3 className="text-xl font-semibold text-[#231F20] mb-2">
                {result.title}
              </h3>
              <p className="text-[#231F20]/60 text-sm mb-3 line-clamp-2">
                {result.excerpt}
              </p>
              <div className="flex flex-wrap gap-1">
                {result.tags.slice(0, 5).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-[#F3F3EA] text-[#231F20]/70 px-2 py-0.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      ) : query ? (
        <div className="text-center py-12">
          <p className="text-[#231F20]/60">
            No results found for &quot;{query}&quot;
          </p>
        </div>
      ) : null}
    </div>
  );
}
