"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Connection {
  id: number;
  provider: string;
  provider_email: string;
  status: string;
  is_active: boolean;
  created_at: string;
}

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showResendForm, setShowResendForm] = useState(false);
  const [resendApiKey, setResendApiKey] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [testingConnection, setTestingConnection] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const response = await fetch("http://localhost:8000/v1/connections");
        if (response.ok) {
          const data = await response.json();
          setConnections(data);
        }
      } catch (error) {
        console.error("Failed to fetch connections:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConnections();
  }, []);

  const handleAddResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch("http://localhost:8000/v1/connections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "resend",
          provider_email: resendEmail,
          credentials: {
            api_key: resendApiKey,
          },
        }),
      });

      if (response.ok) {
        const newConnection = await response.json();
        setConnections([...connections, newConnection]);
        setShowResendForm(false);
        setResendApiKey("");
        setResendEmail("");
        alert("Resend connection added successfully!");
      } else {
        const error = await response.json();
        alert(`Failed to add connection: ${error.detail || "Unknown error"}`);
      }
    } catch (error) {
      alert("Failed to add Resend connection");
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConnectGmail = () => {
    // TODO: Implement Gmail OAuth flow
    alert("Gmail OAuth integration coming soon!");
  };

  const handleTestConnection = async (connectionId: number) => {
    if (!testEmail) {
      alert("Please enter a test email address");
      return;
    }

    setTestingConnection(connectionId);

    try {
      const response = await fetch("http://localhost:8000/v1/test/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          connection_id: connectionId,
          to_email: testEmail,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Test email sent successfully to ${testEmail}!`);
      } else {
        const error = await response.json();
        alert(`Test failed: ${error.detail || "Unknown error"}`);
      }
    } catch (error) {
      alert("Failed to send test email");
      console.error(error);
    } finally {
      setTestingConnection(null);
    }
  };

  const handleToggleActive = async (connectionId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`http://localhost:8000/v1/connections/${connectionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_active: !currentStatus,
        }),
      });

      if (response.ok) {
        setConnections(
          connections.map((conn) =>
            conn.id === connectionId ? { ...conn, is_active: !currentStatus } : conn
          )
        );
      } else {
        alert("Failed to update connection");
      }
    } catch (error) {
      alert("Failed to update connection");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Email Connections</h1>
              <p className="mt-0.5 text-sm text-gray-600">
                Manage your email sending integrations
              </p>
            </div>
            <Link
              href="/settings"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
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
              Back to Settings
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Add Connection Buttons */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setShowResendForm(!showResendForm)}
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
            Add Resend Connection
          </button>

          <button
            onClick={handleConnectGmail}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg className="mr-2 -ml-1 h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M20,18H18V9.25L12,13L6,9.25V18H4V6H5.2L12,10.25L18.8,6H20M20,4H4C2.89,4 2,4.89 2,6V18A2,2 0 0,0 4,20H20A2,2 0 0,0 22,18V6C22,4.89 21.1,4 20,4Z"
              />
            </svg>
            Connect Gmail
          </button>
        </div>

        {/* Resend Connection Form */}
        {showResendForm && (
          <div className="mb-6 bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Resend Connection</h2>
            <form onSubmit={handleAddResend} className="space-y-4">
              <div>
                <label htmlFor="resend-email" className="block text-sm font-medium text-gray-700">
                  From Email Address
                </label>
                <input
                  type="email"
                  id="resend-email"
                  required
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="noreply@yourdomain.com"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Email address that will appear in the "From" field
                </p>
              </div>

              <div>
                <label htmlFor="resend-key" className="block text-sm font-medium text-gray-700">
                  Resend API Key
                </label>
                <input
                  type="password"
                  id="resend-key"
                  required
                  value={resendApiKey}
                  onChange={(e) => setResendApiKey(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="re_..."
                />
                <p className="mt-1 text-sm text-gray-500">
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
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {submitting ? "Adding..." : "Add Connection"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowResendForm(false)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Connections List */}
        {loading ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <div className="animate-spin h-12 w-12 mx-auto border-4 border-indigo-600 border-t-transparent rounded-full"></div>
            <p className="mt-4 text-gray-600">Loading connections...</p>
          </div>
        ) : connections.length === 0 ? (
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">No email connections</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by connecting your first email service.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {connections.map((connection) => (
              <div
                key={connection.id}
                className="bg-white shadow rounded-lg p-6 border border-gray-200"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900 capitalize">
                        {connection.provider}
                      </h3>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          connection.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {connection.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{connection.provider_email}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Added {new Date(connection.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleActive(connection.id, connection.is_active)}
                      className="text-sm text-indigo-600 hover:text-indigo-900"
                    >
                      {connection.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>

                {/* Test Connection */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Connection
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      placeholder="test@example.com"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button
                      onClick={() => handleTestConnection(connection.id)}
                      disabled={testingConnection === connection.id || !testEmail}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {testingConnection === connection.id ? "Sending..." : "Send Test"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
