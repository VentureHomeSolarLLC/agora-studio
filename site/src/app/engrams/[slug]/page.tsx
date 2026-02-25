import { getServerSession } from "next-auth/next";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getAllEngrams } from "@/lib/content";
import Link from "next/link";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import html from "remark-html";
import gfm from "remark-gfm";
import { ArrowLeft, BookOpen, Cpu, Zap } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const engramsDir = path.join(process.cwd(), "..", "engrams");
  if (!fs.existsSync(engramsDir)) return [];
  
  const dirs = fs.readdirSync(engramsDir);
  return dirs
    .filter((d) => fs.statSync(path.join(engramsDir, d)).isDirectory())
    .map((d) => ({ slug: d }));
}

async function getEngramContent(slug: string) {
  const engramPath = path.join(process.cwd(), "..", "engrams", slug);
  
  if (!fs.existsSync(engramPath)) return null;

  const indexPath = path.join(engramPath, "_index.md");
  const skillPath = path.join(engramPath, "SKILL.md");

  let indexData = null;
  let skillData = null;

  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, "utf-8");
    const { data, content: body } = matter(content);
    const processed = await remark().use(gfm).use(html).process(body);
    indexData = { data, html: processed.toString() };
  }

  if (fs.existsSync(skillPath)) {
    const content = fs.readFileSync(skillPath, "utf-8");
    const { data, content: body } = matter(content);
    const processed = await remark().use(gfm).use(html).process(body);
    skillData = { data, html: processed.toString() };
  }

  return { index: indexData, skill: skillData, slug };
}

export default async function EngramPage({ params }: Props) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const { slug } = await params;
  const engram = await getEngramContent(slug);

  if (!engram || !engram.index) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Link */}
      <Link
        href="/engrams"
        className="inline-flex items-center gap-2 text-[#231F20]/60 hover:text-[#231F20] mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Engrams
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-[#B1C3BD]/30 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-[#7AEFB1] rounded-lg flex items-center justify-center">
            <Zap className="w-6 h-6 text-[#231F20]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#231F20]">
              {engram.index.data.title || slug}
            </h1>
            {engram.index.data.description && (
              <p className="text-[#231F20]/60 mt-1">
                {engram.index.data.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Human Guide */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-[#F7FF96]" />
          <h2 className="text-xl font-semibold text-[#231F20]">Human Guide</h2>
        </div>
        <article
          className="markdown-content bg-white rounded-xl p-6 md:p-8 shadow-sm border border-[#B1C3BD]/30"
          dangerouslySetInnerHTML={{ __html: engram.index.html }}
        />
      </div>

      {/* AI Skill */}
      {engram.skill && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-5 h-5 text-[#7AEFB1]" />
            <h2 className="text-xl font-semibold text-[#231F20]">AI Skill</h2>
          </div>
          <article
            className="markdown-content bg-white rounded-xl p-6 md:p-8 shadow-sm border border-[#7AEFB1]/50"
            dangerouslySetInnerHTML={{ __html: engram.skill.html }}
          />
        </div>
      )}
    </div>
  );
}
