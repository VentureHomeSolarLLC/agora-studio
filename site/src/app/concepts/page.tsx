import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getAllConcepts } from "@/lib/content";
import Link from "next/link";
import { BookOpen, Tag } from "lucide-react";

export default async function ConceptsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const concepts = getAllConcepts();

  // Group by first letter
  const grouped = concepts.reduce((acc, concept) => {
    const firstLetter = concept.title.charAt(0).toUpperCase();
    if (!acc[firstLetter]) acc[firstLetter] = [];
    acc[firstLetter].push(concept);
    return acc;
  }, {} as Record<string, typeof concepts>);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#231F20] mb-2 flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-[#F7FF96]" />
          Concepts
        </h1>
        <p className="text-[#231F20]/70">
          {concepts.length} atomic knowledge pieces covering everything from net metering to battery settings.
        </p>
      </div>

      <div className="space-y-8">
        {Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([letter, items]) => (
            <div key={letter}>
              <h2 className="text-2xl font-bold text-[#231F20] mb-4 border-b-2 border-[#F7FF96] inline-block pb-1">
                {letter}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((concept) => (
                  <Link
                    key={concept.slug}
                    href={`/concepts/${concept.slug}`}
                    className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border border-[#B1C3BD]/30 group"
                  >
                    <h3 className="font-semibold text-[#231F20] group-hover:text-[#231F20]/80 mb-2 line-clamp-2">
                      {concept.title}
                    </h3>
                    <div className="flex flex-wrap gap-1">
                      {concept.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-[#F3F3EA] text-[#231F20]/70 px-2 py-0.5 rounded-full flex items-center gap-1"
                        >
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
