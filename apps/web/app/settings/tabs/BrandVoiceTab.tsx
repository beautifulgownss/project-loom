"use client";

import { useState, useEffect } from "react";

interface BrandVoiceTabProps {
  settings: any;
  onUpdate: (updates: any) => Promise<void>;
  saveStatus: "idle" | "saving" | "success" | "error";
}

export default function BrandVoiceTab({ settings, onUpdate, saveStatus }: BrandVoiceTabProps) {
  const [personality, setPersonality] = useState<string>("professional");
  const [targetAudience, setTargetAudience] = useState("");
  const [keyMessagingPoints, setKeyMessagingPoints] = useState<string[]>([""]);
  const [dos, setDos] = useState<string[]>([""]);
  const [donts, setDonts] = useState<string[]>([""]);
  const [examplePhrases, setExamplePhrases] = useState<string[]>([""]);

  useEffect(() => {
    if (settings?.brand_voice) {
      const bv = settings.brand_voice;
      setPersonality(bv.personality || "professional");
      setTargetAudience(bv.target_audience || "");
      setKeyMessagingPoints(bv.key_messaging_points || [""]);
      setDos(bv.tone_guidelines?.dos || [""]);
      setDonts(bv.tone_guidelines?.donts || [""]);
      setExamplePhrases(bv.example_phrases || [""]);
    }
  }, [settings]);

  const handleSave = async () => {
    await onUpdate({
      brand_voice: {
        personality,
        target_audience: targetAudience || undefined,
        key_messaging_points: keyMessagingPoints.filter((p) => p.trim()),
        tone_guidelines: {
          dos: dos.filter((d) => d.trim()),
          donts: donts.filter((d) => d.trim()),
        },
        example_phrases: examplePhrases.filter((p) => p.trim()),
      },
    });
  };

  const updateArrayItem = (
    array: string[],
    index: number,
    value: string,
    setter: (arr: string[]) => void
  ) => {
    const newArray = [...array];
    newArray[index] = value;
    setter(newArray);
  };

  const addArrayItem = (array: string[], setter: (arr: string[]) => void) => {
    setter([...array, ""]);
  };

  const removeArrayItem = (array: string[], index: number, setter: (arr: string[]) => void) => {
    if (array.length > 1) {
      setter(array.filter((_, i) => i !== index));
    }
  };

  const personalities = [
    { value: "professional", label: "Professional", emoji: "💼" },
    { value: "friendly", label: "Friendly", emoji: "😊" },
    { value: "casual", label: "Casual", emoji: "👋" },
    { value: "authoritative", label: "Authoritative", emoji: "🎯" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Brand Voice</h2>
        <p className="mt-1 text-sm text-gray-600">
          Define your brand personality and tone for AI-generated communications
        </p>
      </div>

      <div className="space-y-8">
        {/* Info Banner */}
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex gap-3">
            <svg
              className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm text-indigo-800">
              <p className="font-medium mb-1">AI-Powered Personalization</p>
              <p>
                These settings help our AI generate follow-up emails that match your unique brand
                voice and messaging style.
              </p>
            </div>
          </div>
        </div>

        {/* Brand Personality */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Brand Personality
          </label>
          <div className="grid grid-cols-2 gap-3">
            {personalities.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPersonality(p.value)}
                className={`p-4 border-2 rounded-lg text-left transition-all ${
                  personality === p.value
                    ? "border-indigo-600 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{p.emoji}</span>
                  <span className="font-medium text-gray-900">{p.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Target Audience */}
        <div>
          <label htmlFor="target-audience" className="block text-sm font-medium text-gray-700 mb-2">
            Target Audience
          </label>
          <textarea
            id="target-audience"
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Describe your target audience (e.g., 'B2B SaaS companies, marketing directors and VPs')"
          />
        </div>

        {/* Key Messaging Points */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Key Messaging Points
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Main themes and value propositions to emphasize in your communications
          </p>
          <div className="space-y-2">
            {keyMessagingPoints.map((point, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={point}
                  onChange={(e) =>
                    updateArrayItem(keyMessagingPoints, index, e.target.value, setKeyMessagingPoints)
                  }
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={`Messaging point ${index + 1}`}
                />
                {keyMessagingPoints.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem(keyMessagingPoints, index, setKeyMessagingPoints)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem(keyMessagingPoints, setKeyMessagingPoints)}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              + Add messaging point
            </button>
          </div>
        </div>

        {/* Tone Guidelines */}
        <div className="grid grid-cols-2 gap-6">
          {/* Dos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Do's (Preferred Language)
            </label>
            <p className="text-xs text-gray-500 mb-3">Words and phrases to use</p>
            <div className="space-y-2">
              {dos.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateArrayItem(dos, index, e.target.value, setDos)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder={`Do ${index + 1}`}
                  />
                  {dos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem(dos, index, setDos)}
                      className="px-2 py-1 text-red-600 hover:bg-red-50 rounded-md text-sm"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem(dos, setDos)}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                + Add do
              </button>
            </div>
          </div>

          {/* Don'ts */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Don'ts (Avoid)
            </label>
            <p className="text-xs text-gray-500 mb-3">Words and phrases to avoid</p>
            <div className="space-y-2">
              {donts.map((item, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => updateArrayItem(donts, index, e.target.value, setDonts)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder={`Don't ${index + 1}`}
                  />
                  {donts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeArrayItem(donts, index, setDonts)}
                      className="px-2 py-1 text-red-600 hover:bg-red-50 rounded-md text-sm"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => addArrayItem(donts, setDonts)}
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                + Add don't
              </button>
            </div>
          </div>
        </div>

        {/* Example Phrases */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Example Phrases
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Sample phrases that represent your brand voice
          </p>
          <div className="space-y-2">
            {examplePhrases.map((phrase, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  value={phrase}
                  onChange={(e) =>
                    updateArrayItem(examplePhrases, index, e.target.value, setExamplePhrases)
                  }
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={`Example phrase ${index + 1}`}
                />
                {examplePhrases.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeArrayItem(examplePhrases, index, setExamplePhrases)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-md"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem(examplePhrases, setExamplePhrases)}
              className="text-sm text-indigo-600 hover:text-indigo-700"
            >
              + Add example phrase
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saveStatus === "saving"}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saveStatus === "saving" ? "Saving..." : "Save Brand Voice"}
          </button>

          {saveStatus === "success" && (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Saved successfully
            </span>
          )}

          {saveStatus === "error" && (
            <span className="text-sm text-red-600 flex items-center gap-1">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              Failed to save
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
