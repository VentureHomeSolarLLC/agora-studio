'use client';

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Eye, Tag, Users, FileText, CheckCircle, Layout, Plus } from "lucide-react";

interface FormData {
  title: string;
  concept_id: string;
  audience: string[];
  tags: string[];
  content: string;
}

const AVAILABLE_TAGS = [
  "battery", "solar", "inverter", "net-metering", "billing", 
  "incentives", "srec", "installation", "maintenance", "troubleshooting",
  "warranty", "enphase", "tesla", "powerwall", "backup-power",
  "outage", "storm", "winter", "panel", "roof", "ev-charger"
];

export default function CreateConceptPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdConcept, setCreatedConcept] = useState<FormData | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    concept_id: "",
    audience: ["customer"],
    tags: [],
    content: "",
  });

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

  const generateConceptId = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 50);
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      concept_id: generateConceptId(title),
    }));
  };

  const toggleTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const toggleAudience = (audience: string) => {
    setFormData(prev => ({
      ...prev,
      audience: prev.audience.includes(audience)
        ? prev.audience.filter(a => a !== audience)
        : [...prev.audience, audience],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/create-concept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setCreatedConcept(formData);
        setShowSuccess(true);
      } else {
        const error = await response.text();
        alert(`Error: ${error}`);
      }
    } catch (error) {
      alert("Failed to create concept. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddToPage = () => {
    // Pass the created concept to the builder via query params
    const params = new URLSearchParams();
    if (createdConcept) {
      params.set("addConcept", createdConcept.concept_id);
      params.set("conceptTitle", createdConcept.title);
    }
    router.push(`/admin/builder?${params.toString()}`);
  };

  const generatedMarkdown = `---
concept_id: ${formData.concept_id}
title: "${formData.title}"
content_type: concept
audience:
${formData.audience.map(a => `  - ${a}`).join("\n")}
tags:
${formData.tags.map(t => `  - ${t}`).join("\n")}
---

# ${formData.title}

${formData.content}
`;

  // Success view
  if (showSuccess && createdConcept) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl p-8 shadow-sm border border-[#B1C3BD]/30 text-center">
          <div className="w-16 h-16 bg-[#7AEFB1] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-[#231F20]" />
          </div>
          <h1 className="text-2xl font-bold text-[#231F20] mb-2">
            Article Created!
          </h1>
          <p className="text-[#231F20]/60 mb-8">
            "{createdConcept.title}" has been created successfully.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleAddToPage}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-[#F7FF96] text-[#231F20] rounded-xl font-medium hover:bg-[#7AEFB1] transition-colors"
            >
              <Layout className="w-5 h-5" />
              Add to a Page
            </button>
            <Link
              href="/admin/create"
              onClick={() => {
                setShowSuccess(false);
                setFormData({
                  title: "",
                  concept_id: "",
                  audience: ["customer"],
                  tags: [],
                  content: "",
                });
              }}
              className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-[#B1C3BD]/30 text-[#231F20] rounded-xl font-medium hover:border-[#F7FF96] transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Another
            </Link>
            <Link
              href="/concepts"
              className="flex items-center justify-center gap-2 px-6 py-3 text-[#231F20]/60 hover:text-[#231F20] transition-colors"
            >
              View All Articles →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/concepts"
          className="inline-flex items-center gap-2 text-[#231F20]/60 hover:text-[#231F20] mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Concepts
        </Link>
        <h1 className="text-3xl font-bold text-[#231F20] flex items-center gap-3">
          <FileText className="w-8 h-8 text-[#F7FF96]" />
          Create New Article
        </h1>
        <p className="text-[#231F20]/60 mt-2">
          Create a new knowledge base article. It will be reviewed and committed to GitHub.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-[#231F20] mb-2">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g., How to Monitor Your Solar Production"
              className="w-full px-4 py-3 bg-white border-2 border-[#B1C3BD]/30 rounded-xl focus:border-[#F7FF96] focus:outline-none"
              required
            />
            {formData.concept_id && (
              <p className="text-xs text-[#231F20]/50 mt-1">
                ID: {formData.concept_id}
              </p>
            )}
          </div>

          {/* Audience */}
          <div>
            <label className="block text-sm font-medium text-[#231F20] mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Audience
            </label>
            <div className="flex flex-wrap gap-2">
              {["customer", "agent", "internal"].map((audience) => (
                <button
                  key={audience}
                  type="button"
                  onClick={() => toggleAudience(audience)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    formData.audience.includes(audience)
                      ? "bg-[#F7FF96] text-[#231F20]"
                      : "bg-white border-2 border-[#B1C3BD]/30 text-[#231F20]/60 hover:border-[#F7FF96]"
                  }`}
                >
                  {audience.charAt(0).toUpperCase() + audience.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-[#231F20] mb-2 flex items-center gap-2">
              <Tag className="w-4 h-4" />
              Tags
            </label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    formData.tags.includes(tag)
                      ? "bg-[#7AEFB1] text-[#231F20]"
                      : "bg-white border border-[#B1C3BD]/30 text-[#231F20]/60 hover:border-[#7AEFB1]"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-[#231F20] mb-2">
              Content (Markdown supported)
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="Write your article content here...\n\nUse markdown for formatting:\n# Heading\n## Subheading\n- Bullet point\n**bold text**\n[link text](url)"
              rows={12}
              className="w-full px-4 py-3 bg-white border-2 border-[#B1C3BD]/30 rounded-xl focus:border-[#F7FF96] focus:outline-none font-mono text-sm"
              required
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-6 py-3 border-2 border-[#B1C3BD]/30 text-[#231F20] rounded-xl font-medium hover:border-[#F7FF96] transition-colors"
            >
              <Eye className="w-4 h-4" />
              {showPreview ? "Hide Preview" : "Show Preview"}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-3 bg-[#F7FF96] text-[#231F20] rounded-xl font-medium hover:bg-[#7AEFB1] transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#231F20]/30 border-t-[#231F20] rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Create Article
                </>
              )}
            </button>
          </div>
        </form>

        {/* Preview */}
        <div className={`${showPreview ? "block" : "hidden lg:block"}`}>
          <div className="bg-[#231F20] rounded-xl p-4 mb-4">
            <h3 className="text-[#F3F3EA] font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-[#7AEFB1]" />
              Generated Markdown
            </h3>
          </div>
          <pre className="bg-white rounded-xl p-6 border border-[#B1C3BD]/30 overflow-x-auto text-sm font-mono">
            {generatedMarkdown}
          </pre>
        </div>
      </div>
    </div>
  );
}
