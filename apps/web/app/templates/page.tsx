"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  templates,
  categories,
  getCategoryColor,
  getCategoryName,
  type TemplateCategory,
  type EmailTemplate,
} from "@/lib/templates";

export default function TemplatesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | "all">("all");

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      searchQuery === "" ||
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || template.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = (template: EmailTemplate) => {
    const params = new URLSearchParams({
      subject: template.subject,
      thread_context: template.scenario,
      tone: template.tone,
      delay_hours: template.delayHours.toString(),
    });

    router.push(`/composer?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Email Templates Library
              </h1>
              <p className="text-lg text-gray-600">
                Professional follow-up templates to boost your response rates
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg
                className="mr-2 -ml-1 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filter */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="Search templates..."
            />
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                selectedCategory === "all"
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              All Templates ({templates.length})
            </button>
            {categories.map((category) => {
              const count = templates.filter((t) => t.category === category.id).length;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory === category.id
                      ? "bg-indigo-600 text-white shadow-lg"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {category.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Templates Grid */}
        {filteredTemplates.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No templates found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search or filter criteria
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-200 hover:border-indigo-300 group"
              >
                {/* Card Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-4xl">{template.icon}</div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(
                        template.category
                      )}`}
                    >
                      {getCategoryName(template.category)}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-indigo-600 transition-colors">
                    {template.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {template.description}
                  </p>
                </div>

                {/* Card Body */}
                <div className="p-6 bg-gray-50 space-y-3">
                  {/* Sample Scenario */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                      Sample Context
                    </label>
                    <div className="bg-white p-3 rounded-lg border border-gray-200 text-xs text-gray-700 leading-relaxed max-h-32 overflow-y-auto">
                      {template.scenario.split('\n').slice(0, 3).join('\n')}
                      {template.scenario.split('\n').length > 3 && '...'}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                        Tone
                      </label>
                      <div className="flex items-center space-x-1">
                        <span className="text-sm text-gray-900 capitalize font-medium">
                          {template.tone}
                        </span>
                        {template.tone === "professional" && "💼"}
                        {template.tone === "friendly" && "😊"}
                        {template.tone === "urgent" && "⚡"}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                        Delay
                      </label>
                      <div className="text-sm text-gray-900 font-medium">
                        {template.delayHours < 24
                          ? `${template.delayHours}h`
                          : `${Math.round(template.delayHours / 24)}d`}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-6 bg-white">
                  <button
                    onClick={() => handleUseTemplate(template)}
                    className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-sm hover:shadow-md"
                  >
                    Use This Template
                    <svg
                      className="ml-2 -mr-1 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info Banner */}
        <div className="mt-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">Need a Custom Template?</h3>
              <p className="text-indigo-100 text-lg">
                Create your own follow-up from scratch with AI assistance
              </p>
            </div>
            <Link
              href="/composer"
              className="inline-flex items-center px-6 py-3 border-2 border-white rounded-lg text-base font-medium text-white hover:bg-white hover:text-indigo-600 transition-all"
            >
              Create Custom
              <svg
                className="ml-2 -mr-1 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
