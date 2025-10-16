"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api";

interface BrandFormData {
  name: string;
  description: string;
  industry: string;
  personality: string;
  tone_attributes: {
    formality: string;
    enthusiasm: string;
    complexity: string;
    emotion: string;
    humor: string;
    voice_type: string;
  };
  example_phrases: {
    do_say: string[];
    dont_say: string[];
  };
  is_primary: boolean;
}

const INITIAL_FORM_DATA: BrandFormData = {
  name: "",
  description: "",
  industry: "",
  personality: "",
  tone_attributes: {
    formality: "professional",
    enthusiasm: "moderate",
    complexity: "clear",
    emotion: "balanced",
    humor: "subtle",
    voice_type: "friendly",
  },
  example_phrases: {
    do_say: [""],
    dont_say: [""],
  },
  is_primary: false,
};

export default function NewBrandPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<BrandFormData>(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateToneAttribute = (attribute: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      tone_attributes: { ...prev.tone_attributes, [attribute]: value },
    }));
  };

  const addPhrase = (type: "do_say" | "dont_say") => {
    setFormData((prev) => ({
      ...prev,
      example_phrases: {
        ...prev.example_phrases,
        [type]: [...prev.example_phrases[type], ""],
      },
    }));
  };

  const updatePhrase = (type: "do_say" | "dont_say", index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      example_phrases: {
        ...prev.example_phrases,
        [type]: prev.example_phrases[type].map((p, i) => (i === index ? value : p)),
      },
    }));
  };

  const removePhrase = (type: "do_say" | "dont_say", index: number) => {
    setFormData((prev) => ({
      ...prev,
      example_phrases: {
        ...prev.example_phrases,
        [type]: prev.example_phrases[type].filter((_, i) => i !== index),
      },
    }));
  };

  const handleNext = () => {
    if (currentStep === 1 && !formData.name.trim()) {
      setError("Brand name is required");
      return;
    }
    setError(null);
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Filter out empty phrases
      const cleanedData = {
        ...formData,
        example_phrases: {
          do_say: formData.example_phrases.do_say.filter((p) => p.trim()),
          dont_say: formData.example_phrases.dont_say.filter((p) => p.trim()),
        },
      };

      await apiClient.createBrand(cleanedData);
      router.push("/brands");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create brand");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    step <= currentStep
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step}
                </div>
                {step < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step < currentStep ? "bg-indigo-600" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center text-sm text-gray-600">
            Step {currentStep} of 4
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        )}

        {/* Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          {/* Step 1: Brand Basics */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Brand Basics
                </h2>
                <p className="text-gray-600">
                  Start with the fundamentals of your brand
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateFormData("name", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Acme Corp, Personal Brand"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateFormData("description", e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Brief description of your brand..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Industry
                </label>
                <input
                  type="text"
                  value={formData.industry}
                  onChange={(e) => updateFormData("industry", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="e.g., Technology, Healthcare, Education"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_primary"
                  checked={formData.is_primary}
                  onChange={(e) => updateFormData("is_primary", e.target.checked)}
                  className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                />
                <label htmlFor="is_primary" className="ml-2 text-sm text-gray-700">
                  Set as primary brand
                </label>
              </div>
            </div>
          )}

          {/* Step 2: Personality Quiz */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Brand Personality
                </h2>
                <p className="text-gray-600">
                  Define your brand's overall personality
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personality Description
                </label>
                <textarea
                  value={formData.personality}
                  onChange={(e) => updateFormData("personality", e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Describe your brand's personality in a few sentences..."
                />
                <p className="mt-2 text-sm text-gray-500">
                  Example: "Friendly and approachable, yet professional. We value
                  clarity and simplicity while maintaining a warm tone."
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Tone Attributes */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Tone of Voice
                </h2>
                <p className="text-gray-600">
                  Fine-tune your brand's tone attributes
                </p>
              </div>

              {/* Formality */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Formality Level
                </label>
                <div className="flex gap-3">
                  {["professional", "balanced", "casual"].map((level) => (
                    <button
                      key={level}
                      onClick={() => updateToneAttribute("formality", level)}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 capitalize transition-colors ${
                        formData.tone_attributes.formality === level
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Enthusiasm */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Enthusiasm
                </label>
                <div className="flex gap-3">
                  {["reserved", "moderate", "energetic"].map((level) => (
                    <button
                      key={level}
                      onClick={() => updateToneAttribute("enthusiasm", level)}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 capitalize transition-colors ${
                        formData.tone_attributes.enthusiasm === level
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Complexity */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Language Complexity
                </label>
                <div className="flex gap-3">
                  {["simple", "clear", "technical"].map((level) => (
                    <button
                      key={level}
                      onClick={() => updateToneAttribute("complexity", level)}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 capitalize transition-colors ${
                        formData.tone_attributes.complexity === level
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Emotion */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Emotional Tone
                </label>
                <div className="flex gap-3">
                  {["serious", "balanced", "optimistic"].map((level) => (
                    <button
                      key={level}
                      onClick={() => updateToneAttribute("emotion", level)}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 capitalize transition-colors ${
                        formData.tone_attributes.emotion === level
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Humor */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Use of Humor
                </label>
                <div className="flex gap-3">
                  {["none", "subtle", "playful"].map((level) => (
                    <button
                      key={level}
                      onClick={() => updateToneAttribute("humor", level)}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 capitalize transition-colors ${
                        formData.tone_attributes.humor === level
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Voice Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Voice Type
                </label>
                <div className="flex gap-3">
                  {["authoritative", "friendly", "inspirational"].map((type) => (
                    <button
                      key={type}
                      onClick={() => updateToneAttribute("voice_type", type)}
                      className={`flex-1 px-4 py-3 rounded-lg border-2 capitalize transition-colors ${
                        formData.tone_attributes.voice_type === type
                          ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Example Phrases */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Example Phrases
                </h2>
                <p className="text-gray-600">
                  Provide examples of phrases to use and avoid
                </p>
              </div>

              {/* Do Say */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Phrases to Use
                </label>
                <div className="space-y-2">
                  {formData.example_phrases.do_say.map((phrase, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={phrase}
                        onChange={(e) =>
                          updatePhrase("do_say", index, e.target.value)
                        }
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="e.g., helping you succeed"
                      />
                      {formData.example_phrases.do_say.length > 1 && (
                        <button
                          onClick={() => removePhrase("do_say", index)}
                          className="text-red-600 hover:text-red-700 px-3"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addPhrase("do_say")}
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                  >
                    + Add phrase
                  </button>
                </div>
              </div>

              {/* Don't Say */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Phrases to Avoid
                </label>
                <div className="space-y-2">
                  {formData.example_phrases.dont_say.map((phrase, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={phrase}
                        onChange={(e) =>
                          updatePhrase("dont_say", index, e.target.value)
                        }
                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        placeholder="e.g., synergy, leverage"
                      />
                      {formData.example_phrases.dont_say.length > 1 && (
                        <button
                          onClick={() => removePhrase("dont_say", index)}
                          className="text-red-600 hover:text-red-700 px-3"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={() => addPhrase("dont_say")}
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                  >
                    + Add phrase
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Back
            </button>
            <div className="flex gap-3">
              {currentStep < 4 ? (
                <button
                  onClick={handleNext}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create Brand"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
