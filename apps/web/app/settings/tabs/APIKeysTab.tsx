"use client";

import { useState, useEffect } from "react";

interface APIKeysTabProps {
  settings: any;
  onUpdate: (updates: any) => Promise<void>;
  saveStatus: "idle" | "saving" | "success" | "error";
}

export default function APIKeysTab({ settings, onUpdate, saveStatus }: APIKeysTabProps) {
  const [openaiKey, setOpenaiKey] = useState("");
  const [resendKey, setResendKey] = useState("");
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [showResendKey, setShowResendKey] = useState(false);

  useEffect(() => {
    if (settings?.api_keys) {
      setOpenaiKey(settings.api_keys.openai_api_key || "");
      setResendKey(settings.api_keys.resend_api_key || "");
    }
  }, [settings]);

  const handleSave = async () => {
    await onUpdate({
      api_keys: {
        openai_api_key: openaiKey || undefined,
        resend_api_key: resendKey || undefined,
      },
    });
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">API Keys</h2>
        <p className="mt-1 text-sm text-gray-600">
          Manage your API keys for external services
        </p>
      </div>

      <div className="space-y-6">
        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-3">
            <svg
              className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">API keys are stored securely</p>
              <p>
                Your API keys are encrypted and stored securely. They will be used to power AI
                features and email sending in Project Loom.
              </p>
            </div>
          </div>
        </div>

        {/* OpenAI API Key */}
        <div>
          <label htmlFor="openai-key" className="block text-sm font-medium text-gray-700 mb-2">
            OpenAI API Key
          </label>
          <div className="relative">
            <input
              type={showOpenaiKey ? "text" : "password"}
              id="openai-key"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              className="w-full px-4 py-2 pr-24 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
              placeholder="sk-..."
            />
            <button
              type="button"
              onClick={() => setShowOpenaiKey(!showOpenaiKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs text-gray-600 hover:text-gray-900"
            >
              {showOpenaiKey ? "Hide" : "Show"}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Get your API key from{" "}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-500"
            >
              platform.openai.com/api-keys
            </a>
          </p>
        </div>

        {/* Resend API Key */}
        <div>
          <label htmlFor="resend-key" className="block text-sm font-medium text-gray-700 mb-2">
            Resend API Key
          </label>
          <div className="relative">
            <input
              type={showResendKey ? "text" : "password"}
              id="resend-key"
              value={resendKey}
              onChange={(e) => setResendKey(e.target.value)}
              className="w-full px-4 py-2 pr-24 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
              placeholder="re_..."
            />
            <button
              type="button"
              onClick={() => setShowResendKey(!showResendKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-xs text-gray-600 hover:text-gray-900"
            >
              {showResendKey ? "Hide" : "Show"}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Get your API key from{" "}
            <a
              href="https://resend.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-500"
            >
              resend.com/api-keys
            </a>
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Note: You can also manage email connections in the{" "}
            <a href="/settings/connections" className="text-indigo-600 hover:text-indigo-500">
              Email Connections
            </a>{" "}
            page
          </p>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saveStatus === "saving"}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saveStatus === "saving" ? "Saving..." : "Save API Keys"}
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
