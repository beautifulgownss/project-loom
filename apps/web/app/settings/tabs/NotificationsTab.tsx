"use client";

import { useState, useEffect } from "react";

interface NotificationsTabProps {
  settings: any;
  onUpdate: (updates: any) => Promise<void>;
  saveStatus: "idle" | "saving" | "success" | "error";
}

export default function NotificationsTab({ settings, onUpdate, saveStatus }: NotificationsTabProps) {
  const [emailOnDraftReady, setEmailOnDraftReady] = useState(true);
  const [emailOnFollowupSent, setEmailOnFollowupSent] = useState(true);
  const [emailOnReplyReceived, setEmailOnReplyReceived] = useState(true);
  const [emailOnErrors, setEmailOnErrors] = useState(true);
  const [weeklySummary, setWeeklySummary] = useState(true);

  useEffect(() => {
    if (settings?.notification_preferences) {
      const prefs = settings.notification_preferences;
      setEmailOnDraftReady(prefs.email_on_draft_ready ?? true);
      setEmailOnFollowupSent(prefs.email_on_followup_sent ?? true);
      setEmailOnReplyReceived(prefs.email_on_reply_received ?? true);
      setEmailOnErrors(prefs.email_on_errors ?? true);
      setWeeklySummary(prefs.weekly_summary ?? true);
    }
  }, [settings]);

  const handleSave = async () => {
    await onUpdate({
      notification_preferences: {
        email_on_draft_ready: emailOnDraftReady,
        email_on_followup_sent: emailOnFollowupSent,
        email_on_reply_received: emailOnReplyReceived,
        email_on_errors: emailOnErrors,
        weekly_summary: weeklySummary,
      },
    });
  };

  const NotificationToggle = ({
    label,
    description,
    checked,
    onChange,
  }: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
  }) => (
    <div className="flex items-start justify-between py-4">
      <div className="flex-1">
        <h4 className="text-sm font-medium text-gray-900">{label}</h4>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
          checked ? "bg-indigo-600" : "bg-gray-200"
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
        <p className="mt-1 text-sm text-gray-600">
          Manage how and when you want to be notified
        </p>
      </div>

      <div className="space-y-6">
        {/* Email Notifications Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Email Notifications</h3>
          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
            <div className="px-4">
              <NotificationToggle
                label="Draft Ready"
                description="Get notified when an AI-generated follow-up draft is ready for review"
                checked={emailOnDraftReady}
                onChange={setEmailOnDraftReady}
              />
            </div>
            <div className="px-4">
              <NotificationToggle
                label="Follow-up Sent"
                description="Receive confirmation when a scheduled follow-up is successfully sent"
                checked={emailOnFollowupSent}
                onChange={setEmailOnFollowupSent}
              />
            </div>
            <div className="px-4">
              <NotificationToggle
                label="Reply Received"
                description="Get alerted when a recipient replies to your follow-up email"
                checked={emailOnReplyReceived}
                onChange={setEmailOnReplyReceived}
              />
            </div>
            <div className="px-4">
              <NotificationToggle
                label="Errors & Issues"
                description="Be notified of any errors or issues with your follow-up campaigns"
                checked={emailOnErrors}
                onChange={setEmailOnErrors}
              />
            </div>
          </div>
        </div>

        {/* Summary Reports Section */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Summary Reports</h3>
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-4">
              <NotificationToggle
                label="Weekly Summary"
                description="Receive a weekly digest of your follow-up activity and performance metrics"
                checked={weeklySummary}
                onChange={setWeeklySummary}
              />
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex gap-3">
            <svg
              className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="text-sm text-gray-700">
              <p className="font-medium mb-1">Notification Settings</p>
              <p>
                All notifications will be sent to your account email. You can manage your email
                address in the Account settings.
              </p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saveStatus === "saving"}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saveStatus === "saving" ? "Saving..." : "Save Preferences"}
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
