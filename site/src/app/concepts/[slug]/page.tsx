import { getServerSession } from "next-auth/next";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getConceptBySlug, getAllConcepts } from "@/lib/content";
import Link from "next/link";
import { remark } from "remark";
import html from "remark-html";
import gfm from "remark-gfm";
import { ArrowLeft, Tag, Users, Calendar } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const concepts = getAllConcepts();
  return concepts.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const concept = getConceptBySlug(slug);
  return {
    title: concept ? `${concept.title} | Agora Studio` : "Not Found",
  };
}

export default async function ConceptPage({ params }: Props) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const { slug } = await params;
  const concept = getConceptBySlug(slug);

  if (!concept) {
    notFound();
  }

  // Process markdown to HTML
  const processedContent = await remark()
    .use(gfm)
    .use(html)
    .process(concept.content);
  const contentHtml = processedContent.toString();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Link */}
      <Link
        href="/concepts"
        className="inline-flex items-center gap-2 text-[#231F20]/60 hover:text-[#231F20] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Concepts
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-[#B1C3BD]/30 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-[#231F20] mb-4">
          {concept.title}
        </h1>

        <div className="flex flex-wrap gap-4 text-sm text-[#231F20]/60">
          {concept.audience.length > 0 && (
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{concept.audience.join(", ")}</span>
            </div>
          )}
          {concept.tags.length > 0 && (
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4" />
              <div className="flex gap-1">
                {concept.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-[#F7FF96] text-[#231F20] px-2 py-0.5 rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <article
        className="markdown-content bg-white rounded-xl p-6 md:p-8 shadow-sm border border-[#B1C3BD]/30"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
    </div>
  );
}
