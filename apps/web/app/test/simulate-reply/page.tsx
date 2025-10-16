"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient, FollowUpJobResponse } from "@/lib/api";

export default function SimulateReplyPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<FollowUpJobResponse[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [fromName, setFromName] = useState("");
  const [replyBody, setReplyBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch sent follow-ups
      const data = await apiClient.listFollowUps({ limit: 100 });
      // Filter to only show sent follow-ups that can receive replies
      const sentJobs = data.filter(j => j.status === "sent" || j.status === "scheduled" || j.status === "pending");
      setJobs(sentJobs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch follow-up jobs");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedJobId) {
      setError("Please select a follow-up job");
      return;
    }

    if (!replyBody.trim()) {
      setError("Please enter a reply message");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await apiClient.simulateReply({
        followup_job_id: selectedJobId,
        from_name: fromName || undefined,
        body: replyBody,
      });

      setSuccess("Reply simulated successfully! The follow-up status has been updated to 'replied'.");

      // Reset form
      setSelectedJobId(null);
      setFromName("");
      setReplyBody("");

      // Refresh jobs list
      await fetchJobs();

      // Redirect to replies page after 2 seconds
      setTimeout(() => {
        router.push("/replies");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to simulate reply");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedJob = jobs.find(j => j.id === selectedJobId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Simulate Reply</h1>
              <p className="mt-1 text-sm text-gray-600">
                Test the reply detection system by simulating a reply to a follow-up
              </p>
            </div>
            <div className="flex gap-3">
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
              <Link
                href="/replies"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                View Replies
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Message */}
        {success && (
          <div className="mb-6 rounded-md bg-green-50 p-4 border border-green-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

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
            <p className="mt-4 text-gray-600">Loading follow-ups...</p>
          </div>
        ) : jobs.length === 0 ? (
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
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No sent follow-ups available
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              You need to send a follow-up before you can simulate a reply.
            </p>
            <div className="mt-6">
              <Link
                href="/composer"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Create Follow-Up
              </Link>
            </div>
          </div>
        ) : (
          // Form
          <div className="bg-white shadow rounded-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="followup_job" className="block text-sm font-medium text-gray-700">
                  Select Follow-Up <span className="text-red-500">*</span>
                </label>
                <select
                  id="followup_job"
                  value={selectedJobId || ""}
                  onChange={(e) => setSelectedJobId(Number(e.target.value) || null)}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                >
                  <option value="">-- Choose a follow-up --</option>
                  {jobs.map((job) => (
                    <option key={job.id} value={job.id}>
                      #{job.id} - {job.original_recipient} - {job.original_subject}
                    </option>
                  ))}
                </select>
              </div>

              {selectedJob && (
                <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Selected Follow-Up Details</h3>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2 text-sm">
                    <div>
                      <dt className="font-medium text-gray-500">Recipient:</dt>
                      <dd className="text-gray-900">{selectedJob.original_recipient}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-500">Status:</dt>
                      <dd className="text-gray-900 capitalize">{selectedJob.status}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="font-medium text-gray-500">Subject:</dt>
                      <dd className="text-gray-900">{selectedJob.original_subject}</dd>
                    </div>
                  </dl>
                </div>
              )}

              <div>
                <label htmlFor="from_name" className="block text-sm font-medium text-gray-700">
                  Reply From Name (Optional)
                </label>
                <input
                  type="text"
                  id="from_name"
                  value={fromName}
                  onChange={(e) => setFromName(e.target.value)}
                  placeholder={selectedJob?.original_recipient || "Sender name"}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                />
                <p className="mt-1 text-sm text-gray-500">
                  If not provided, will use the recipient's email address
                </p>
              </div>

              <div>
                <label htmlFor="reply_body" className="block text-sm font-medium text-gray-700">
                  Reply Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="reply_body"
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  required
                  rows={8}
                  placeholder="Enter the reply message..."
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                />
                <p className="mt-1 text-sm text-gray-500">
                  This message will be stored as a reply to the selected follow-up
                </p>
              </div>

              <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-blue-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">What happens when you simulate a reply?</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-disc list-inside space-y-1">
                        <li>A reply record will be created in the database</li>
                        <li>The follow-up status will be updated to "replied"</li>
                        <li>The reply_received_at timestamp will be set</li>
                        <li>If stop_on_reply is true, any other pending follow-ups for this recipient will be cancelled</li>
                        <li>You'll see the reply in the Replies page</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Simulating...
                    </>
                  ) : (
                    <>
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
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                      Simulate Reply
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
