import { getPublicArticles, getArticlesByCategory } from "@/lib/content";
import Link from "next/link";
import { Search, BookOpen, Zap, MessageCircle, DollarSign, Battery, Wrench, Lock } from "lucide-react";

export default async function Home() {
  const publicConcepts = getPublicArticles();
  
  // Get featured categories
  const billingConcepts = getArticlesByCategory("billing").slice(0, 4);
  const incentiveConcepts = getArticlesByCategory("incentives").slice(0, 4);
  const batteryConcepts = getArticlesByCategory("batteries").slice(0, 4);

  return (
    <div className="min-h-screen bg-[#F3F3EA]">
      {/* Hero Section - Clean, no logo */}
      <div className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-[#231F20] mb-4">
              How can we help?
            </h1>
            <p className="text-lg text-[#231F20]/70 mb-8">
              Find answers about your solar system, billing, incentives, and more.
            </p>
            
            {/* Search Bar */}
            <form action="/browse" className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#231F20]/40" />
                <input
                  type="text"
                  name="q"
                  placeholder="Search help articles..."
                  className="w-full pl-12 pr-4 py-4 bg-white border border-[#B1C3BD]/30 rounded-xl text-lg focus:border-[#F7FF96] focus:outline-none focus:ring-2 focus:ring-[#F7FF96]/20"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#231F20] text-[#F3F3EA] px-4 py-2 rounded-lg font-medium hover:bg-[#231F20]/90 transition-colors"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="text-2xl font-bold text-[#231F20] mb-8 text-center">
          Browse by Topic
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <CategoryCard
            href="/browse?category=billing"
            icon={<DollarSign className="w-6 h-6" />}
            title="Billing & Net Metering"
            description="Understanding your utility bill and solar credits"
            color="bg-[#F7FF96]"
          />
          <CategoryCard
            href="/browse?category=incentives"
            icon={<BookOpen className="w-6 h-6" />}
            title="Incentives & SRECs"
            description="Tax credits, rebates, and state programs"
            color="bg-[#7AEFB1]"
          />
          <CategoryCard
            href="/browse?category=batteries"
            icon={<Battery className="w-6 h-6" />}
            title="Battery Storage"
            description="Powerwall, Enphase, and backup power"
            color="bg-[#B1C3BD]"
          />
          <CategoryCard
            href="/browse?category=maintenance"
            icon={<Wrench className="w-6 h-6" />}
            title="Maintenance & Care"
            description="Panel cleaning, warranties, and upkeep"
            color="bg-[#E8E8DC]"
          />
        </div>

        {/* Featured Articles */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h3 className="text-xl font-semibold text-[#231F20] mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#F7FF96]" />
              Billing & Net Metering
            </h3>
            <div className="space-y-3">
              {billingConcepts.map((concept) => (
                <ArticleLink key={concept.slug} concept={concept} />
              ))}
              <Link
                href="/browse?category=billing"
                className="text-sm text-[#231F20]/60 hover:text-[#231F20] inline-flex items-center gap-1"
              >
                View all billing articles →
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-[#231F20] mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#7AEFB1]" />
              Incentives by State
            </h3>
            <div className="space-y-3">
              {incentiveConcepts.map((concept) => (
                <ArticleLink key={concept.slug} concept={concept} />
              ))}
              <Link
                href="/article/state-incentives-overview"
                className="text-sm text-[#231F20]/60 hover:text-[#231F20] inline-flex items-center gap-1"
              >
                View all state incentives →
              </Link>
            </div>
          </div>
        </div>

        {/* Battery Section */}
        <div className="mt-12">
          <h3 className="text-xl font-semibold text-[#231F20] mb-4 flex items-center gap-2">
            <Battery className="w-5 h-5 text-[#B1C3BD]" />
            Battery & Backup Power
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {batteryConcepts.map((concept) => (
              <Link
                key={concept.slug}
                href={`/article/${concept.slug}`}
                className="bg-white p-4 rounded-lg shadow-sm border border-[#B1C3BD]/30 hover:shadow-md transition-shadow"
              >
                <h4 className="font-medium text-[#231F20] mb-1">{concept.title}</h4>
                <p className="text-sm text-[#231F20]/60 line-clamp-2">{concept.excerpt}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Team Login Section */}
      <div className="bg-[#231F20] text-[#F3F3EA] py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#7AEFB1]" />
                Venture Home Team Access
              </h2>
              <p className="text-[#B1C3BD]">
                Sign in to access internal documentation, agent skills, and all knowledge base articles.
              </p>
            </div>
            <Link
              href="/auth/signin"
              className="bg-[#F7FF96] text-[#231F20] px-6 py-3 rounded-lg font-medium hover:bg-[#7AEFB1] transition-colors whitespace-nowrap"
            >
              Team Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <MessageCircle className="w-12 h-12 text-[#7AEFB1] mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-[#231F20] mb-4">
          Still need help?
        </h2>
        <p className="text-[#231F20]/70 mb-6">
          Our customer success team is here to assist you.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="tel:800-203-4158"
            className="bg-[#231F20] text-[#F3F3EA] px-6 py-3 rounded-lg font-medium hover:bg-[#231F20]/90 transition-colors"
          >
            Call 800-203-4158
          </a>
          <a
            href="https://venturehome.com/contact"
            className="bg-[#F7FF96] text-[#231F20] px-6 py-3 rounded-lg font-medium hover:bg-[#7AEFB1] transition-colors"
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
}

function CategoryCard({ href, icon, title, description, color }: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white rounded-xl p-6 shadow-sm border border-[#B1C3BD]/30 hover:shadow-md transition-shadow group"
    >
      <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h3 className="font-semibold text-[#231F20] mb-2">{title}</h3>
      <p className="text-sm text-[#231F20]/60">{description}</p>
    </Link>
  );
}

function ArticleLink({ concept }: { concept: { slug: string; title: string; excerpt?: string } }) {
  return (
    <Link
      href={`/article/${concept.slug}`}
      className="block bg-white p-3 rounded-lg shadow-sm border border-[#B1C3BD]/30 hover:shadow-md transition-shadow"
    >
      <h4 className="font-medium text-[#231F20] mb-1">{concept.title}</h4>
      {concept.excerpt && (
        <p className="text-sm text-[#231F20]/60 line-clamp-1">{concept.excerpt}</p>
      )}
    </Link>
  );
}
