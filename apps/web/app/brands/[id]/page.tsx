"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiClient, BrandResponse } from "@/lib/api";

type Tab = "overview" | "tone" | "examples" | "settings";

export default function BrandDetailPage() {
  const router = useRouter();
  const params = useParams();
  const brandId = parseInt(params.id as string);

  const [brand, setBrand] = useState<BrandResponse | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<BrandResponse>>({});

  useEffect(() => {
    loadBrand();
  }, [brandId]);

  const loadBrand = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.getBrand(brandId);
      setBrand(data);
      setEditData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load brand");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!brand) return;

    try {
      setIsSaving(true);
      setError(null);

      const updatePayload = {
        name: editData.name,
        description: editData.description,
        industry: editData.industry,
        personality: editData.personality,
        tone_attributes: editData.tone_attributes,
        example_phrases: editData.example_phrases,
        is_active: editData.is_active,
        is_primary: editData.is_primary,
      };

      const updated = await apiClient.updateBrand(brandId, updatePayload);
      setBrand(updated);
      setEditData(updated);
      alert("Brand updated successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update brand");
    } finally {
      setIsSaving(false);
    }
  };

  const updateEditData = (field: string, value: any) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  const updateToneAttribute = (attribute: string, value: string) => {
    setEditData((prev) => ({
      ...prev,
      tone_attributes: { ...prev.tone_attributes, [attribute]: value },
    }));
  };

  const updateExamplePhrases = (type: "do_say" | "dont_say", phrases: string[]) => {
    setEditData((prev) => ({
      ...prev,
      example_phrases: {
        ...prev.example_phrases,
        [type]: phrases,
      },
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading brand...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !brand) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error || "Brand not found"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{brand.name}</h1>
            <p className="text-gray-600 mt-1">{brand.industry}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/brands")}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <div className="flex gap-8">
            {[
              { id: "overview", label: "Overview" },
              { id: "tone", label: "Tone of Voice" },
              { id: "examples", label: "Examples" },
              { id: "settings", label: "Settings" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`pb-4 px-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-indigo-600 text-indigo-600 font-medium"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand Name
                </label>
                <input
                  type="text"
                  value={editData.name || ""}
                  onChange={(e) => updateEditData("name", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editData.description || ""}
                  onChange={(e) => updateEditData("description", e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry
                </label>
                <input
                  type="text"
                  value={editData.industry || ""}
                  onChange={(e) => updateEditData("industry", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personality
                </label>
                <textarea
                  value={editData.personality || ""}
                  onChange={(e) => updateEditData("personality", e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Tone Tab */}
          {activeTab === "tone" && (
            <div className="space-y-6">
              {[
                {
                  key: "formality",
                  label: "Formality Level",
                  options: ["professional", "balanced", "casual"],
                },
                {
                  key: "enthusiasm",
                  label: "Enthusiasm",
                  options: ["reserved", "moderate", "energetic"],
                },
                {
                  key: "complexity",
                  label: "Language Complexity",
                  options: ["simple", "clear", "technical"],
                },
                {
                  key: "emotion",
                  label: "Emotional Tone",
                  options: ["serious", "balanced", "optimistic"],
                },
                {
                  key: "humor",
                  label: "Use of Humor",
                  options: ["none", "subtle", "playful"],
                },
                {
                  key: "voice_type",
                  label: "Voice Type",
                  options: ["authoritative", "friendly", "inspirational"],
                },
              ].map((attr) => (
                <div key={attr.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    {attr.label}
                  </label>
                  <div className="flex gap-3">
                    {attr.options.map((option) => (
                      <button
                        key={option}
                        onClick={() => updateToneAttribute(attr.key, option)}
                        className={`flex-1 px-4 py-3 rounded-lg border-2 capitalize transition-colors ${
                          editData.tone_attributes?.[attr.key] === option
                            ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Examples Tab */}
          {activeTab === "examples" && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Phrases to Use
                </label>
                <div className="space-y-2">
                  {(editData.example_phrases?.do_say || []).map(
                    (phrase: string, index: number) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={phrase}
                          onChange={(e) => {
                            const updated = [...(editData.example_phrases?.do_say || [])];
                            updated[index] = e.target.value;
                            updateExamplePhrases("do_say", updated);
                          }}
                          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          onClick={() => {
                            const updated = (editData.example_phrases?.do_say || []).filter(
                              (_: any, i: number) => i !== index
                            );
                            updateExamplePhrases("do_say", updated);
                          }}
                          className="text-red-600 hover:text-red-700 px-3"
                        >
                          Remove
                        </button>
                      </div>
                    )
                  )}
                  <button
                    onClick={() => {
                      const updated = [
                        ...(editData.example_phrases?.do_say || []),
                        "",
                      ];
                      updateExamplePhrases("do_say", updated);
                    }}
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                  >
                    + Add phrase
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Phrases to Avoid
                </label>
                <div className="space-y-2">
                  {(editData.example_phrases?.dont_say || []).map(
                    (phrase: string, index: number) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={phrase}
                          onChange={(e) => {
                            const updated = [
                              ...(editData.example_phrases?.dont_say || []),
                            ];
                            updated[index] = e.target.value;
                            updateExamplePhrases("dont_say", updated);
                          }}
                          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          onClick={() => {
                            const updated = (
                              editData.example_phrases?.dont_say || []
                            ).filter((_: any, i: number) => i !== index);
                            updateExamplePhrases("dont_say", updated);
                          }}
                          className="text-red-600 hover:text-red-700 px-3"
                        >
                          Remove
                        </button>
                      </div>
                    )
                  )}
                  <button
                    onClick={() => {
                      const updated = [
                        ...(editData.example_phrases?.dont_say || []),
                        "",
                      ];
                      updateExamplePhrases("dont_say", updated);
                    }}
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                  >
                    + Add phrase
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Active Status</h3>
                  <p className="text-sm text-gray-600">
                    Inactive brands won't appear in the brand selector
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editData.is_active ?? true}
                    onChange={(e) => updateEditData("is_active", e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">Primary Brand</h3>
                  <p className="text-sm text-gray-600">
                    Set as the default brand for all new messages
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editData.is_primary ?? false}
                    onChange={(e) =>
                      updateEditData("is_primary", e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="font-medium text-gray-900 mb-2">Danger Zone</h3>
                <button
                  onClick={async () => {
                    if (
                      confirm(
                        "Are you sure you want to delete this brand? This action cannot be undone."
                      )
                    ) {
                      try {
                        await apiClient.deleteBrand(brandId);
                        router.push("/brands");
                      } catch (err) {
                        alert("Failed to delete brand");
                      }
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete Brand
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
