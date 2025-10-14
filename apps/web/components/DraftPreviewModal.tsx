"use client";

import { GenerateDraftResponse } from "@/lib/api";

interface DraftPreviewModalProps {
  draft: GenerateDraftResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSchedule: () => void;
  isScheduling: boolean;
}

export function DraftPreviewModal({
  draft,
  isOpen,
  onClose,
  onSchedule,
  isScheduling,
}: DraftPreviewModalProps) {
  if (!isOpen || !draft) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                AI-Generated Follow-Up Draft
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Close</span>
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <div className="space-y-4">
              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <div className="p-3 bg-gray-50 rounded-md border border-gray-200">
                  <p className="text-sm text-gray-900">{draft.subject}</p>
                </div>
              </div>

              {/* Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Body
                </label>
                <div className="p-4 bg-gray-50 rounded-md border border-gray-200 min-h-[200px]">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {draft.body}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={onSchedule}
                disabled={isScheduling}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isScheduling ? "Scheduling..." : "Schedule Follow-Up"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
