"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient, SequenceListItem } from "@/lib/api";

export default function SequencesPage() {
  const router = useRouter();
  const [sequences, setSequences] = useState<SequenceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterActive, setFilterActive] = useState<boolean | undefined>(undefined);

  const fetchSequences = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.listSequences({
        is_active: filterActive,
        limit: 50,
      });
      setSequences(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch sequences");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSequences();
  }, [filterActive]);

  const handleDuplicate = async (sequence: SequenceListItem) => {
    try {
      // Fetch the full sequence with steps
      const fullSequence = await apiClient.getSequence(sequence.id);

      // Create a duplicate
      await apiClient.createSequence({
        name: `${fullSequence.name} (Copy)`,
        description: fullSequence.description || undefined,
        stop_on_reply: fullSequence.stop_on_reply,
        is_active: false, // Start as inactive
        steps: fullSequence.steps.map((step) => ({
          step_number: step.step_number,
          subject: step.subject,
          body: step.body,
          tone: step.tone,
          delay_days: step.delay_days,
        })),
      });

      await fetchSequences();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to duplicate sequence");
    }
  };

  const handleToggleActive = async (sequence: SequenceListItem) => {
    try {
      await apiClient.updateSequence(sequence.id, {
        is_active: !sequence.is_active,
      });
      await fetchSequences();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update sequence");
    }
  };

  const handleDelete = async (sequence: SequenceListItem) => {
    if (!confirm(`Are you sure you want to delete "${sequence.name}"?`)) {
      return;
    }

    try {
      await apiClient.deleteSequence(sequence.id);
      await fetchSequences();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete sequence");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Email Sequences
              </h1>
              <p className="mt-0.5 text-sm text-gray-600">
                Manage your multi-step follow-up campaigns
              </p>
            </div>
            <Link
              href="/sequences/new"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Sequence
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Filter Tabs */}
        <div className="mb-4 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setFilterActive(undefined)}
              className={`
                whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm
                ${filterActive === undefined
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              All Sequences ({sequences.length})
            </button>
            <button
              onClick={() => setFilterActive(true)}
              className={`
                whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm
                ${filterActive === true
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              Active
            </button>
            <button
              onClick={() => setFilterActive(false)}
              className={`
                whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm
                ${filterActive === false
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              Inactive
            </button>
          </nav>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <svg
              className="animate-spin h-12 w-12 mx-auto text-indigo-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <p className="mt-4 text-gray-600">Loading sequences...</p>
          </div>
        ) : sequences.length === 0 ? (
          // Empty State
          <div className="bg-white shadow rounded-lg p-12 text-center">
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No sequences yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first multi-step sequence.
            </p>
            <div className="mt-6">
              <Link
                href="/sequences/new"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create Sequence
              </Link>
            </div>
          </div>
        ) : (
          // Grid of Sequences
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {sequences.map((sequence) => (
              <div
                key={sequence.id}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow border border-gray-200"
              >
                {/* Card Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
                      {sequence.name}
                    </h3>
                    <div className="flex-shrink-0 ml-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          sequence.is_active
                            ? "bg-green-100 text-green-800 border border-green-300"
                            : "bg-gray-100 text-gray-800 border border-gray-300"
                        }`}
                      >
                        {sequence.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  {sequence.description && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {sequence.description}
                    </p>
                  )}
                </div>

                {/* Stats */}
                <div className="px-6 py-4 bg-gray-50 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Steps
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-indigo-600">
                      {sequence.step_count}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Total Recipients
                    </p>
                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {sequence.enrollment_count}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Active
                    </p>
                    <p className="mt-1 text-lg font-semibold text-blue-600">
                      {sequence.active_enrollment_count}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Completed
                    </p>
                    <p className="mt-1 text-lg font-semibold text-green-600">
                      {sequence.completed_enrollment_count}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 bg-white border-t border-gray-100 flex items-center justify-between">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => router.push(`/sequences/${sequence.id}`)}
                      className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                      title="View details"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleToggleActive(sequence)}
                      className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                      title={sequence.is_active ? "Deactivate" : "Activate"}
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        {sequence.is_active ? (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        ) : (
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                          />
                        )}
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDuplicate(sequence)}
                      className="text-gray-600 hover:text-gray-900 text-sm font-medium"
                      title="Duplicate"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </div>
                  <button
                    onClick={() => handleDelete(sequence)}
                    className="text-red-600 hover:text-red-900 text-sm font-medium"
                    title="Delete"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
