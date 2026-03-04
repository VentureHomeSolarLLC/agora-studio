import { getArticlesByCategory } from "@/lib/content";
import Link from "next/link";
import { headers } from "next/headers";
import {
  Search,
  BookOpen,
  Zap,
  MessageCircle,
  DollarSign,
  Wrench,
  Lock,
  LineChart,
  ClipboardCheck,
  FileText,
  Layers,
  Map,
} from "lucide-react";

export default async function Home() {
  const headerList = await headers();
  const host = headerList.get("host") || "";
  const isInternal = host.includes("internal.help.venturehome.com");

  const billingConcepts = getArticlesByCategory("billing").slice(0, 4);
  const monitoringConcepts = getArticlesByCategory("monitoring").slice(0, 4);
  const troubleshootingConcepts = getArticlesByCategory("troubleshooting").slice(0, 4);

  const publicTopSearches = [
    "monitoring app login",
    "system not producing",
    "solar production drop",
    "utility bill after solar",
    "net metering explained",
    "inverter lights meaning",
    "battery backup during outage",
    "SREC payout schedule",
  ];
  const internalTopSearches = [
    "interconnection submission",
    "PTO status update",
    "utility forms",
    "financing approval steps",
    "permit inspection checklist",
    "service troubleshooting",
    "TaskRay update",
    "Salesforce opportunity fields",
  ];
  const topSearches = isInternal ? internalTopSearches : publicTopSearches;

  return (
    <div className="min-h-screen bg-[#F3F3EA]">
      {/* Hero Section - Clean, no logo */}
      <div className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-[#231F20] mb-4">
              {isInternal ? "Internal Knowledge Base" : "How can we help?"}
            </h1>
            <p className="text-lg text-[#231F20]/70 mb-8">
              {isInternal
                ? "Search internal documentation, agent skills, and operational playbooks."
                : "Find answers about monitoring, billing, and troubleshooting your system."}
            </p>
            
            {/* Search Bar */}
            <form action="/browse" className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#231F20]/40" />
                <input
                  type="text"
                  name="q"
                  placeholder={isInternal ? "Search internal docs, skills, or knowledge..." : "Search help articles..."}
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

            <div className="flex flex-wrap justify-center gap-2 text-sm text-[#231F20]/60">
              <span className="font-medium">Top searches:</span>
              <TopSearches items={topSearches} />
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="text-2xl font-bold text-[#231F20] mb-8 text-center">
          {isInternal ? "Internal Topics" : "Top Topics"}
        </h2>
        
        {isInternal ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            <CategoryCard
              href="/browse?q=interconnection"
              icon={<ClipboardCheck className="w-6 h-6" />}
              title="Interconnection & PTO"
              description="Utility submissions, approvals, and timelines"
              color="bg-[#7AEFB1]"
            />
            <CategoryCard
              href="/browse?q=financing"
              icon={<DollarSign className="w-6 h-6" />}
              title="Financing & Credit"
              description="Credit checks, terms, and lender workflows"
              color="bg-[#F7FF96]"
            />
            <CategoryCard
              href="/browse?q=permits"
              icon={<FileText className="w-6 h-6" />}
              title="Permitting & Inspections"
              description="AHJ requirements, inspections, and approvals"
              color="bg-[#B1C3BD]"
            />
            <CategoryCard
              href="/browse?category=troubleshooting"
              icon={<Wrench className="w-6 h-6" />}
              title="Troubleshooting"
              description="Service playbooks and escalation guidance"
              color="bg-[#E8E8DC]"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            <CategoryCard
              href="/browse?category=monitoring"
              icon={<LineChart className="w-6 h-6" />}
              title="Monitoring & Performance"
              description="Apps, production tracking, and alerts"
              color="bg-[#7AEFB1]"
            />
            <CategoryCard
              href="/browse?category=billing"
              icon={<DollarSign className="w-6 h-6" />}
              title="Utility Bills & Credits"
              description="Net metering, bill changes, and rates"
              color="bg-[#F7FF96]"
            />
            <CategoryCard
              href="/browse?category=troubleshooting"
              icon={<Wrench className="w-6 h-6" />}
              title="Troubleshooting"
              description="Common issues and what to try first"
              color="bg-[#B1C3BD]"
            />
          </div>
        )}

        {isInternal ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-xl font-semibold text-[#231F20] mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#7AEFB1]" />
                Tools & Wizards
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <CategoryCard
                  href="/admin/engrams/new"
                  icon={<Zap className="w-5 h-5" />}
                  title="AI Agent Wizard"
                  description="Create skills or import monolith skills"
                  color="bg-[#7AEFB1]"
                />
                <CategoryCard
                  href="/admin/builder"
                  icon={<BookOpen className="w-5 h-5" />}
                  title="Wiki Builder"
                  description="Draft internal or customer knowledge"
                  color="bg-[#F7FF96]"
                />
                <CategoryCard
                  href="/admin/engrams/map"
                  icon={<Map className="w-5 h-5" />}
                  title="Engram Map"
                  description="Visualize skills, concepts, lessons"
                  color="bg-[#B1C3BD]"
                />
                <CategoryCard
                  href="/engrams"
                  icon={<Layers className="w-5 h-5" />}
                  title="Engram Library"
                  description="Browse agent-ready knowledge"
                  color="bg-[#E8E8DC]"
                />
              </div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-[#231F20] mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#F7FF96]" />
                Internal Playbooks
              </h3>
              <div className="space-y-3">
                <QuickSearchLink label="Utility Interconnection Overview" query="utility interconnection" />
                <QuickSearchLink label="PTO Status Checklist" query="pto status" />
                <QuickSearchLink label="Permit & Inspection Guide" query="permit inspection" />
                <QuickSearchLink label="Financing Approval Steps" query="financing approval" />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Featured Articles */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div>
                <h3 className="text-xl font-semibold text-[#231F20] mb-4 flex items-center gap-2">
                  <LineChart className="w-5 h-5 text-[#7AEFB1]" />
                  Monitoring & Performance
                </h3>
                <div className="space-y-3">
                  {monitoringConcepts.map((concept) => (
                    <ArticleLink key={concept.slug} concept={concept} />
                  ))}
                  <Link
                    href="/browse?category=monitoring"
                    className="text-sm text-[#231F20]/60 hover:text-[#231F20] inline-flex items-center gap-1"
                  >
                    View all monitoring articles →
                  </Link>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-semibold text-[#231F20] mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#F7FF96]" />
                  Utility Bills & Credits
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
            </div>

            {/* Troubleshooting Section */}
            <div className="mt-12">
              <h3 className="text-xl font-semibold text-[#231F20] mb-4 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-[#B1C3BD]" />
                Troubleshooting
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {troubleshootingConcepts.map((concept) => (
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
          </>
        )}
      </div>

      {/* Team Login Section */}
      {!isInternal && (
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
      )}

      {/* Contact Section */}
      {!isInternal && (
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
      )}
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

function TopSearches({ items }: { items: string[] }) {
  return (
    <>
      {items.map((term) => (
        <Link
          key={term}
          href={`/browse?q=${encodeURIComponent(term)}`}
          className="px-3 py-1 rounded-full bg-white/70 border border-[#B1C3BD]/30 hover:border-[#231F20]/40 hover:text-[#231F20] transition-colors"
        >
          {term}
        </Link>
      ))}
    </>
  );
}

function QuickSearchLink({ label, query }: { label: string; query: string }) {
  return (
    <Link
      href={`/browse?q=${encodeURIComponent(query)}`}
      className="block bg-white p-3 rounded-lg shadow-sm border border-[#B1C3BD]/30 hover:shadow-md transition-shadow"
    >
      <h4 className="font-medium text-[#231F20] mb-1">{label}</h4>
      <p className="text-sm text-[#231F20]/60">Search for “{query}” →</p>
    </Link>
  );
}
