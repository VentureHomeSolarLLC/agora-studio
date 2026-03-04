import { getPublicArticles, getArticlesByCategory } from "@/lib/content";
import Link from "next/link";
import { Search, BookOpen, ArrowLeft } from "lucide-react";

interface Props {
  searchParams: Promise<{ category?: string; q?: string }>;
}

export default async function BrowsePage({ searchParams }: Props) {
  const params = await searchParams;
  const category = params.category;
  const query = params.q;
  
  let concepts = getPublicArticles();
  let title = "All Help Articles";
  
  if (category) {
    concepts = getArticlesByCategory(category);
    const categoryTitles: Record<string, string> = {
      billing: "Billing & Net Metering",
      incentives: "Incentives & SRECs",
      batteries: "Battery Storage",
      maintenance: "Maintenance & Care",
      troubleshooting: "Troubleshooting",
      installation: "Installation Process",
      monitoring: "Monitoring & Performance",
    };
    title = categoryTitles[category] || category;
  }
  
  if (query) {
    const lowerQuery = query.toLowerCase();
    concepts = concepts.filter(
      c =>
        c.title.toLowerCase().includes(lowerQuery) ||
        c.tags.some(t => t.toLowerCase().includes(lowerQuery)) ||
        c.content.toLowerCase().includes(lowerQuery)
    );
    title = `Search: "${query}"`;
  }

  // Group by first letter for all articles view
  const grouped = !category && !query
    ? concepts.reduce((acc, concept) => {
        const firstLetter = concept.title.charAt(0).toUpperCase();
        if (!acc[firstLetter]) acc[firstLetter] = [];
        acc[firstLetter].push(concept);
        return acc;
      }, {} as Record<string, typeof concepts>)
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Back Link */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-[#231F20]/60 hover:text-[#231F20] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#231F20] mb-4 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-[#F7FF96]" />
          {title}
        </h1>
        <p className="text-[#231F20]/70">
          {concepts.length} article{concepts.length !== 1 ? "s" : ""} available
        </p>
      </div>

      {/* Search */}
      <form className="mb-8" action="/browse">
        <div className="relative max-w-xl">
          <input
            type="text"
            name="q"
            placeholder="Search articles..."
            defaultValue={query}
            className="w-full px-4 py-3 pr-12 bg-white border-2 border-[#B1C3BD]/30 rounded-xl focus:border-[#F7FF96] focus:outline-none"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-[#231F20]/50 hover:text-[#231F20]"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>
      </form>

      {/* Content */}
      {grouped ? (
        // Alphabetical grouping
        <div className="space-y-8">
          {Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([letter, items]) => (
              <div key={letter}>
                <h2 className="text-2xl font-bold text-[#231F20] mb-4 border-b-2 border-[#F7FF96] inline-block pb-1">
                  {letter}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {items.map((concept) => (
                    <ArticleCard key={concept.slug} concept={concept} />
                  ))}
                </div>
              </div>
            ))}
        </div>
      ) : (
        // Category/search results
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {concepts.map((concept) => (
            <ArticleCard key={concept.slug} concept={concept} />
          ))}
        </div>
      )}

      {concepts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-[#231F20]/60">
            No articles found{query ? ` for "${query}"` : ""}.
          </p>
        </div>
      )}
    </div>
  );
}

function ArticleCard({ concept }: { concept: { slug: string; title: string; excerpt?: string; tags: string[] } }) {
  return (
    <Link
      href={`/article/${concept.slug}`}
      className="block bg-white rounded-lg p-4 shadow-sm border border-[#B1C3BD]/30 hover:shadow-md transition-shadow"
    >
      <h3 className="font-semibold text-[#231F20] mb-2">{concept.title}</h3>
      {concept.excerpt && (
        <p className="text-sm text-[#231F20]/60 mb-3 line-clamp-2">{concept.excerpt}</p>
      )}
      <div className="flex flex-wrap gap-1">
        {concept.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="text-xs bg-[#F3F3EA] text-[#231F20]/70 px-2 py-0.5 rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}
