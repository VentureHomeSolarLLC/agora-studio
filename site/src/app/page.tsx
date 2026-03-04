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
  ArrowRight,
} from "lucide-react";

export default async function Home() {
  const headerList = await headers();
  const host = headerList.get("host") || "";
  const isInternal = host.includes("internal.help.venturehome.com");

  const billingConcepts = getArticlesByCategory("billing").slice(0, 4);
  const monitoringConcepts = getArticlesByCategory("monitoring").slice(0, 4);
  const troubleshootingConcepts = getArticlesByCategory("troubleshooting").slice(0, 4);
  const incentiveConcepts = getArticlesByCategory("incentives").slice(0, 4);
  const batteryConcepts = getArticlesByCategory("batteries").slice(0, 4);
  const maintenanceConcepts = getArticlesByCategory("maintenance").slice(0, 4);

  return isInternal ? (
    <InternalHome
      billingConcepts={billingConcepts}
      monitoringConcepts={monitoringConcepts}
      troubleshootingConcepts={troubleshootingConcepts}
    />
  ) : (
    <PublicHome
      billingConcepts={billingConcepts}
      monitoringConcepts={monitoringConcepts}
      troubleshootingConcepts={troubleshootingConcepts}
      incentiveConcepts={incentiveConcepts}
      batteryConcepts={batteryConcepts}
      maintenanceConcepts={maintenanceConcepts}
    />
  );
}

function PublicHome({
  billingConcepts,
  monitoringConcepts,
  troubleshootingConcepts,
  incentiveConcepts,
  batteryConcepts,
  maintenanceConcepts,
}: {
  billingConcepts: ArticlePreview[];
  monitoringConcepts: ArticlePreview[];
  troubleshootingConcepts: ArticlePreview[];
  incentiveConcepts: ArticlePreview[];
  batteryConcepts: ArticlePreview[];
  maintenanceConcepts: ArticlePreview[];
}) {
  const publicTopSearches = [
    { label: "Monitoring & performance", href: "/browse?category=monitoring" },
    { label: "Utility bill changes", href: "/browse?category=billing" },
    { label: "Net metering credits", href: "/browse?q=net%20metering" },
    { label: "Production seems low", href: "/browse?q=production%20low" },
    { label: "Battery backup tips", href: "/browse?q=battery%20outage" },
    { label: "SRECs & incentives", href: "/browse?q=srecs" },
    { label: "Monitoring setup", href: "/browse?q=monitoring" },
  ];

  return (
    <div className="min-h-screen bg-[#F3F3EA]">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(247,255,150,0.35),transparent_45%),radial-gradient(circle_at_top_right,rgba(122,239,177,0.25),transparent_40%)]" />
        <div className="absolute -top-24 right-[-120px] h-[320px] w-[320px] rounded-full bg-[#7AEFB1]/30 blur-3xl" />
        <div className="absolute -bottom-20 left-[-120px] h-[280px] w-[280px] rounded-full bg-[#F7FF96]/40 blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/70 border border-[#B1C3BD]/40 px-3 py-1 rounded-full text-xs text-[#231F20]/70 mb-6">
              <span className="h-2 w-2 rounded-full bg-[#7AEFB1]" />
              Venture Home Knowledge Base
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold text-[#231F20] leading-tight mb-4">
              Fast answers for your solar system, bills, and performance.
            </h1>
            <p className="text-lg text-[#231F20]/70 mb-8">
              Search, browse, and troubleshoot with clear guidance built for homeowners.
            </p>

            <form action="/browse" className="w-full">
              <div className="relative">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#231F20]/40" />
                <input
                  type="text"
                  name="q"
                  placeholder="Search monitoring, utility bills, and troubleshooting..."
                  className="w-full pl-12 pr-32 py-4 bg-white border border-[#B1C3BD]/40 rounded-2xl text-lg focus:border-[#F7FF96] focus:outline-none focus:ring-2 focus:ring-[#F7FF96]/30"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#231F20] text-[#F3F3EA] px-5 py-2 rounded-xl font-medium hover:bg-[#231F20]/90 transition-colors"
                >
                  Search
                </button>
              </div>
            </form>

            <div className="mt-6 flex flex-wrap items-center gap-2 text-sm text-[#231F20]/60">
              <span className="font-medium">Top searches:</span>
              <TopSearches items={publicTopSearches} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-semibold text-[#231F20] mb-6">Start with your goal</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <IntentCard
            href="/browse?category=monitoring"
            icon={<LineChart className="w-6 h-6" />}
            title="Check system performance"
            description="Understand production, monitoring apps, and what normal looks like."
            accent="bg-[#7AEFB1]"
          />
          <IntentCard
            href="/browse?category=billing"
            icon={<DollarSign className="w-6 h-6" />}
            title="Make sense of my utility bill"
            description="Net metering, credits, and why your bill changed."
            accent="bg-[#F7FF96]"
          />
          <IntentCard
            href="/browse?category=troubleshooting"
            icon={<Wrench className="w-6 h-6" />}
            title="Troubleshoot an issue"
            description="Quick checks for low production, outages, and alerts."
            accent="bg-[#B1C3BD]"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <GuideColumn
            title="Monitoring & Performance"
            icon={<LineChart className="w-5 h-5" />}
            accent="text-[#7AEFB1]"
            items={monitoringConcepts}
            href="/browse?category=monitoring"
          />
          <GuideColumn
            title="Utility Bills & Credits"
            icon={<DollarSign className="w-5 h-5" />}
            accent="text-[#F7FF96]"
            items={billingConcepts}
            href="/browse?category=billing"
          />
          <GuideColumn
            title="Troubleshooting"
            icon={<Wrench className="w-5 h-5" />}
            accent="text-[#B1C3BD]"
            items={troubleshootingConcepts}
            href="/browse?category=troubleshooting"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-[#231F20]">Explore more topics</h2>
          <Link
            href="/browse"
            className="text-sm text-[#231F20]/60 hover:text-[#231F20] inline-flex items-center gap-2"
          >
            Browse all articles <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TopicCard
            title="Incentives & SRECs"
            description="Tax credits, rebates, and state programs."
            icon={<BookOpen className="w-5 h-5" />}
            href="/browse?category=incentives"
            items={incentiveConcepts}
          />
          <TopicCard
            title="Battery & Backup Power"
            description="Powerwall, Enphase, and outage readiness."
            icon={<Zap className="w-5 h-5" />}
            href="/browse?category=batteries"
            items={batteryConcepts}
          />
          <TopicCard
            title="Maintenance & Care"
            description="Cleaning, warranties, and keeping systems healthy."
            icon={<Wrench className="w-5 h-5" />}
            href="/browse?category=maintenance"
            items={maintenanceConcepts}
          />
        </div>
      </div>

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

function InternalHome({
  billingConcepts,
  monitoringConcepts,
  troubleshootingConcepts,
}: {
  billingConcepts: ArticlePreview[];
  monitoringConcepts: ArticlePreview[];
  troubleshootingConcepts: ArticlePreview[];
}) {
  const internalTopSearches = [
    { label: "Utility guide", href: "/browse?q=utility%20guide" },
    { label: "Awaiting PTO", href: "/browse?q=awaiting%20pto" },
    { label: "Net metering", href: "/browse?q=net%20metering" },
    { label: "Production low", href: "/browse?q=production%20low" },
    { label: "Battery FAQ", href: "/browse?q=battery%20faq" },
    { label: "Monitoring app", href: "/browse?q=monitoring" },
  ];

  return (
    <div className="min-h-screen bg-[#F3F3EA]">
      <div className="py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-[#231F20] mb-4">
              Internal Knowledge Base
            </h1>
            <p className="text-lg text-[#231F20]/70 mb-8">
              Search internal documentation, agent skills, and operational playbooks.
            </p>

            <form action="/browse" className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#231F20]/40" />
                <input
                  type="text"
                  name="q"
                  placeholder="Search internal docs, skills, or knowledge..."
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
              <TopSearches items={internalTopSearches} />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="text-2xl font-bold text-[#231F20] mb-8 text-center">
          Internal Topics
        </h2>

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
          <GuideColumn
            title="Monitoring & Performance"
            icon={<LineChart className="w-5 h-5" />}
            accent="text-[#7AEFB1]"
            items={monitoringConcepts}
            href="/browse?category=monitoring"
          />
          <GuideColumn
            title="Utility Bills & Credits"
            icon={<DollarSign className="w-5 h-5" />}
            accent="text-[#F7FF96]"
            items={billingConcepts}
            href="/browse?category=billing"
          />
          <GuideColumn
            title="Troubleshooting"
            icon={<Wrench className="w-5 h-5" />}
            accent="text-[#B1C3BD]"
            items={troubleshootingConcepts}
            href="/browse?category=troubleshooting"
          />
        </div>
      </div>
    </div>
  );
}

type ArticlePreview = { slug: string; title: string; excerpt?: string };

function GuideColumn({
  title,
  icon,
  accent,
  items,
  href,
}: {
  title: string;
  icon: React.ReactNode;
  accent: string;
  items: ArticlePreview[];
  href: string;
}) {
  return (
    <div className="bg-white/80 border border-[#B1C3BD]/30 rounded-2xl p-6 shadow-sm">
      <div className={`flex items-center gap-2 ${accent} mb-4`}>
        {icon}
        <h3 className="text-lg font-semibold text-[#231F20]">{title}</h3>
      </div>
      <div className="space-y-3">
        {items.map((concept) => (
          <ArticleLink key={concept.slug} concept={concept} />
        ))}
        <Link
          href={href}
          className="text-sm text-[#231F20]/60 hover:text-[#231F20] inline-flex items-center gap-2"
        >
          View all {title.toLowerCase()} articles <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}

function IntentCard({
  href,
  icon,
  title,
  description,
  accent,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-white border border-[#B1C3BD]/30 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className={`w-12 h-12 ${accent} rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}>
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-[#231F20] mb-2">{title}</h3>
      <p className="text-sm text-[#231F20]/60">{description}</p>
    </Link>
  );
}

function TopicCard({
  title,
  description,
  icon,
  href,
  items,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  items: ArticlePreview[];
}) {
  return (
    <div className="bg-white border border-[#B1C3BD]/30 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-[#231F20]">
          {icon}
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
        <Link href={href} className="text-sm text-[#231F20]/60 hover:text-[#231F20]">
          Browse
        </Link>
      </div>
      <p className="text-sm text-[#231F20]/60 mb-4">{description}</p>
      <div className="space-y-3">
        {items.map((concept) => (
          <ArticleLink key={concept.slug} concept={concept} />
        ))}
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

function ArticleLink({ concept }: { concept: { slug: string; title: string } }) {
  return (
    <Link
      href={`/article/${concept.slug}`}
      className="block bg-[#F3F3EA]/70 p-3 rounded-lg border border-[#B1C3BD]/30 hover:shadow-md transition-shadow"
    >
      <h4 className="font-medium text-[#231F20] mb-1">{concept.title}</h4>
    </Link>
  );
}

function TopSearches({ items }: { items: { label: string; href: string }[] }) {
  return (
    <>
      {items.map((term) => (
        <Link
          key={term.label}
          href={term.href}
          className="px-3 py-1 rounded-full bg-white/70 border border-[#B1C3BD]/30 hover:border-[#231F20]/40 hover:text-[#231F20] transition-colors"
        >
          {term.label}
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
