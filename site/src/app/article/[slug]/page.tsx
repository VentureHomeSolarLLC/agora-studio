import { notFound } from "next/navigation";
import { getCustomerPageBySlug, getPublicArticles, isPublicContent } from "@/lib/content";
import Link from "next/link";
import { remark } from "remark";
import html from "remark-html";
import gfm from "remark-gfm";
import { ArrowLeft, Tag, Lock } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const articles = getPublicArticles();
  return articles.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const concept = getCustomerPageBySlug(slug);
  return {
    title: concept ? `${concept.title} | Venture Home Help` : "Not Found",
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const concept = getCustomerPageBySlug(slug);

  if (!concept) {
    notFound();
  }

  // Process markdown to HTML
  const processedContent = await remark()
    .use(gfm)
    .use(html)
    .process(concept.content);
  const contentHtml = processedContent.toString();

  // Check if there's internal-only content
  const hasInternalContent = !isPublicContent(concept.audience);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/"
          className="text-[#231F20]/60 hover:text-[#231F20] transition-colors"
        >
          Home
        </Link>
        <span className="text-[#231F20]/30">/</span>
        <Link
          href="/browse"
          className="text-[#231F20]/60 hover:text-[#231F20] transition-colors"
        >
          Articles
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-[#B1C3BD]/30 mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-[#231F20] mb-4">
          {concept.title}
        </h1>

        {concept.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {concept.tags.map((tag) => (
              <Link
                key={tag}
                href={`/browse?q=${encodeURIComponent(tag)}`}
                className="text-xs bg-[#F7FF96] text-[#231F20] px-3 py-1 rounded-full hover:bg-[#7AEFB1] transition-colors"
              >
                <Tag className="w-3 h-3 inline mr-1" />
                {tag}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <article
        className="markdown-content bg-white rounded-xl p-6 md:p-8 shadow-sm border border-[#B1C3BD]/30"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />

      {/* Team Login CTA */}
      <div className="mt-8 bg-[#231F20] rounded-xl p-6 text-[#F3F3EA]">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold mb-1 flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#7AEFB1]" />
              Venture Home Team
            </h3>
            <p className="text-sm text-[#B1C3BD]">
              Sign in to access internal documentation and all knowledge base articles.
            </p>
          </div>
          <Link
            href="/auth/signin"
            className="bg-[#F7FF96] text-[#231F20] px-6 py-2 rounded-lg font-medium hover:bg-[#7AEFB1] transition-colors whitespace-nowrap"
          >
            Team Sign In
          </Link>
        </div>
      </div>

      {/* Back Link */}
      <div className="mt-8">
        <Link
          href="/browse"
          className="inline-flex items-center gap-2 text-[#231F20]/60 hover:text-[#231F20] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Browse all articles
        </Link>
      </div>
    </div>
  );
}
