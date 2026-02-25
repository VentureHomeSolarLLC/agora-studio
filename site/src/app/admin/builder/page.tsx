"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, GripVertical, Trash2, Eye, Save, Layout, Search, Sparkles } from "lucide-react";

interface PageSection {
  id: string;
  conceptId: string;
  title: string;
}

interface PageData {
  title: string;
  slug: string;
  description: string;
  sections: PageSection[];
}

interface Concept {
  slug: string;
  concept_id: string;
  title: string;
  tags: string[];
  excerpt?: string;
}

export default function PageBuilder() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [newConceptBanner, setNewConceptBanner] = useState<{id: string, title: string} | null>(null);
  const [availableConcepts, setAvailableConcepts] = useState<Concept[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageData, setPageData] = useState<PageData>({
    title: "",
    slug: "",
    description: "",
    sections: [],
  });

  // Fetch real concepts from API
  useEffect(() => {
    fetch("/api/concepts")
      .then(res => res.json())
      .then(data => {
        setAvailableConcepts(data.concepts || []);
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch concepts:", err);
        setIsLoading(false);
      });
  }, []);

  // Check for newly created concept from query params
  useEffect(() => {
    const addConcept = searchParams.get("addConcept");
    const conceptTitle = searchParams.get("conceptTitle");
    if (addConcept && conceptTitle) {
      setNewConceptBanner({ id: addConcept, title: conceptTitle });
      // Auto-add to sections
      setPageData(prev => ({
        ...prev,
        sections: [
          ...prev.sections,
          {
            id: `${addConcept}-${Date.now()}`,
            conceptId: addConcept,
            title: conceptTitle,
          },
        ],
      }));
    }
  }, [searchParams]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 bg-[#F7FF96] rounded-full animate-pulse" />
      </div>
    );
  }

  if (!session) {
    router.push("/auth/signin");
    return null;
  }

  // Search across title, tags, and excerpt
  const filteredConcepts = availableConcepts.filter(
    c => c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
         c.concept_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
         c.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
         (c.excerpt && c.excerpt.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const addSection = (concept: Concept) => {
    setPageData(prev => ({
      ...prev,
      sections: [
        ...prev.sections,
        {
          id: `${concept.slug}-${Date.now()}`,
          conceptId: concept.slug,
          title: concept.title,
        },
      ],
    }));
  };

  const removeSection = (sectionId: string) => {
    setPageData(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== sectionId),
    }));
  };

  const moveSection = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === pageData.sections.length - 1)
    ) {
      return;
    }

    const newSections = [...pageData.sections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    
    setPageData(prev => ({ ...prev, sections: newSections }));
  };

  const handleSave = async () => {
    // In production, this would save the page manifest
    console.log("Saving page:", pageData);
    alert("Page saved! (In production, this would commit to GitHub)");
  };

  return (
    <div className="min-h-screen bg-[#F3F3EA]">
      {/* Header */}
      <div className="bg-white border-b border-[#B1C3BD]/30 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/concepts"
                className="text-[#231F20]/60 hover:text-[#231F20] transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-bold text-[#231F20] flex items-center gap-2">
                <Layout className="w-6 h-6 text-[#F7FF96]" />
                Page Builder
              </h1>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => alert("Preview: " + JSON.stringify(pageData, null, 2))}
                className="flex items-center gap-2 px-4 py-2 border-2 border-[#B1C3BD]/30 text-[#231F20] rounded-lg font-medium hover:border-[#F7FF96] transition-colors"
              >
                <Eye className="w-4 h-4" />
                Preview
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 bg-[#F7FF96] text-[#231F20] rounded-lg font-medium hover:bg-[#7AEFB1] transition-colors"
              >
                <Save className="w-4 h-4" />
                Save Page
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* New Concept Banner */}
        {newConceptBanner && (
          <div className="mb-6 bg-[#7AEFB1] rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-[#231F20]" />
              <span className="text-[#231F20] font-medium">
                Added "{newConceptBanner.title}" to your page!
              </span>
            </div>
            <button
              onClick={() => setNewConceptBanner(null)}
              className="text-[#231F20]/60 hover:text-[#231F20]"
            >
              ×
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Page Settings & Sections */}
          <div className="lg:col-span-2 space-y-6">
            {/* Page Info */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-[#B1C3BD]/30">
              <h2 className="text-lg font-semibold text-[#231F20] mb-4">Page Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#231F20] mb-1">
                    Page Title
                  </label>
                  <input
                    type="text"
                    value={pageData.title}
                    onChange={(e) => setPageData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Complete Battery Guide"
                    className="w-full px-4 py-2 border border-[#B1C3BD]/30 rounded-lg focus:border-[#F7FF96] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#231F20] mb-1">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    value={pageData.slug}
                    onChange={(e) => setPageData(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="e.g., battery-guide"
                    className="w-full px-4 py-2 border border-[#B1C3BD]/30 rounded-lg focus:border-[#F7FF96] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#231F20] mb-1">
                    Description
                  </label>
                  <textarea
                    value={pageData.description}
                    onChange={(e) => setPageData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of this page..."
                    rows={2}
                    className="w-full px-4 py-2 border border-[#B1C3BD]/30 rounded-lg focus:border-[#F7FF96] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Sections */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-[#B1C3BD]/30">
              <h2 className="text-lg font-semibold text-[#231F20] mb-4">
                Page Sections ({pageData.sections.length})
              </h2>
              
              {pageData.sections.length === 0 ? (
                <div className="text-center py-8 text-[#231F20]/50">
                  <Layout className="w-12 h-12 mx-auto mb-3" />
                  <p>Drag articles from the right to build your page</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pageData.sections.map((section, index) => (
                    <div
                      key={section.id}
                      className="flex items-center gap-3 p-4 bg-[#F3F3EA] rounded-lg group"
                    >
                      <GripVertical className="w-5 h-5 text-[#231F20]/30" />
                      <span className="text-sm text-[#231F20]/50 w-8">{index + 1}</span>
                      <span className="flex-1 font-medium text-[#231F20]">
                        {section.title}
                      </span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => moveSection(index, "up")}
                          disabled={index === 0}
                          className="p-1 hover:bg-white rounded disabled:opacity-30"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveSection(index, "down")}
                          disabled={index === pageData.sections.length - 1}
                          className="p-1 hover:bg-white rounded disabled:opacity-30"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => removeSection(section.id)}
                          className="p-1 hover:bg-red-100 text-red-500 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Available Articles */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-[#B1C3BD]/30">
            <h2 className="text-lg font-semibold text-[#231F20] mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#7AEFB1]" />
              Add Articles
            </h2>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#231F20]/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles..."
                className="w-full pl-10 pr-4 py-2 border border-[#B1C3BD]/30 rounded-lg focus:border-[#F7FF96] focus:outline-none"
              />
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 bg-[#F7FF96] rounded-full animate-pulse mx-auto" />
                <p className="text-[#231F20]/50 mt-2">Loading articles...</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredConcepts.map((concept) => (
                  <button
                    key={concept.slug}
                    onClick={() => addSection(concept)}
                    className="w-full text-left p-3 rounded-lg border border-[#B1C3BD]/30 hover:border-[#7AEFB1] hover:bg-[#7AEFB1]/10 transition-colors group"
                  >
                    <div className="flex items-start gap-2">
                      <Plus className="w-4 h-4 text-[#7AEFB1] opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
                      <div className="flex-1">
                        <span className="text-sm text-[#231F20] font-medium block">{concept.title}</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {concept.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="text-xs bg-[#F3F3EA] text-[#231F20]/50 px-2 py-0.5 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
                {filteredConcepts.length === 0 && (
                  <div className="text-center text-[#231F20]/50 py-4">
                    <p>No articles found</p>
                    {searchQuery && (
                      <p className="text-sm mt-1">Try a different search term</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
