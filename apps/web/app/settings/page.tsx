"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AccountTab from "./tabs/AccountTab";
import APIKeysTab from "./tabs/APIKeysTab";
import EmailSignatureTab from "./tabs/EmailSignatureTab";
import BrandVoiceTab from "./tabs/BrandVoiceTab";
import NotificationsTab from "./tabs/NotificationsTab";

type Tab = "account" | "api-keys" | "email-signature" | "brand-voice" | "notifications";

interface Settings {
  id: number;
  user_id: number;
  email_signature: string | null;
  brand_voice: {
    personality?: string;
    target_audience?: string;
    key_messaging_points?: string[];
    tone_guidelines?: {
      dos?: string[];
      donts?: string[];
    };
    example_phrases?: string[];
  };
  notification_preferences: {
    email_on_draft_ready: boolean;
    email_on_followup_sent: boolean;
    email_on_reply_received: boolean;
    email_on_errors: boolean;
    weekly_summary: boolean;
  };
  api_keys: {
    openai_api_key?: string;
    resend_api_key?: string;
  };
  created_at: string;
  updated_at: string | null;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("account");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch("http://localhost:8000/v1/settings", {
        headers: {
          // TODO: Add auth header
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateSettings = async (updates: Partial<Settings>) => {
    setSaveStatus("saving");

    try {
      const response = await fetch("http://localhost:8000/v1/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          // TODO: Add auth header
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setSaveStatus("success");
        setTimeout(() => setSaveStatus("idle"), 3000);
      } else {
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    } catch (error) {
      console.error("Failed to update settings:", error);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const tabs = [
    { id: "account" as const, label: "Account", icon: "👤" },
    { id: "api-keys" as const, label: "API Keys", icon: "🔑" },
    { id: "email-signature" as const, label: "Email Signature", icon: "✍️" },
    { id: "brand-voice" as const, label: "Brand Voice", icon: "🎯" },
    { id: "notifications" as const, label: "Notifications", icon: "🔔" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="mt-1 text-sm text-gray-600">
                Manage your account settings and preferences
              </p>
            </div>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
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
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors border-l-4 ${
                    activeTab === tab.id
                      ? "bg-indigo-50 border-indigo-600 text-indigo-700 font-medium"
                      : "border-transparent text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-xl">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>

            {/* Connections Link */}
            <Link
              href="/settings/connections"
              className="mt-4 block w-full px-4 py-3 bg-white rounded-lg shadow-sm border border-gray-200 text-left text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">📧</span>
                <span>Email Connections</span>
              </div>
            </Link>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {activeTab === "account" && (
                <AccountTab settings={settings} onUpdate={updateSettings} saveStatus={saveStatus} />
              )}
              {activeTab === "api-keys" && (
                <APIKeysTab settings={settings} onUpdate={updateSettings} saveStatus={saveStatus} />
              )}
              {activeTab === "email-signature" && (
                <EmailSignatureTab settings={settings} onUpdate={updateSettings} saveStatus={saveStatus} />
              )}
              {activeTab === "brand-voice" && (
                <BrandVoiceTab settings={settings} onUpdate={updateSettings} saveStatus={saveStatus} />
              )}
              {activeTab === "notifications" && (
                <NotificationsTab settings={settings} onUpdate={updateSettings} saveStatus={saveStatus} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
