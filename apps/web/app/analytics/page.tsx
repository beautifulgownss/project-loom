"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type DateRange = 7 | 30 | 90 | null;

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  scheduled: "#3b82f6",
  sent: "#10b981",
  replied: "#8b5cf6",
  cancelled: "#6b7280",
  failed: "#ef4444",
};

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>(30);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [overview, setOverview] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [overviewData, trendsData, insightsData] = await Promise.all([
        apiClient.getAnalyticsOverview(dateRange || undefined),
        apiClient.getAnalyticsTrends(dateRange || undefined),
        apiClient.getAnalyticsInsights(),
      ]);

      setOverview(overviewData);
      setTrends(trendsData);
      setInsights(insightsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const exportToCSV = () => {
    if (!overview || !trends) return;

    const csvData = [
      ["Metric", "Value"],
      ["Total Follow-ups", overview.total_followups],
      ["Sent Follow-ups", overview.sent_followups],
      ["Replied Follow-ups", overview.replied_followups],
      ["Reply Rate", `${overview.reply_rate}%`],
      ["Avg Response Time", `${overview.avg_response_time_hours} hours`],
      ["Active Sequences", overview.active_sequences],
      [""],
      ["Date", "Follow-ups Sent"],
      ...trends.followups_over_time.map((item: any) => [item.date, item.count]),
    ];

    const csvContent = csvData.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `analytics-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const DateRangeSelector = () => (
    <div className="flex items-center space-x-2 bg-white rounded-lg shadow-sm border border-gray-200 p-1">
      {[
        { label: "7 Days", value: 7 as DateRange },
        { label: "30 Days", value: 30 as DateRange },
        { label: "90 Days", value: 90 as DateRange },
        { label: "All Time", value: null as DateRange },
      ].map((option) => (
        <button
          key={option.label}
          onClick={() => setDateRange(option.value)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            dateRange === option.value
              ? "bg-indigo-600 text-white shadow-md"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );

  const StatCard = ({ title, value, change, icon, gradient }: any) => (
    <div className={`relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 ${gradient}`}>
      <div className="p-6 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-white/80">{title}</p>
          <span className="text-3xl">{icon}</span>
        </div>
        <p className="text-4xl font-bold text-white mb-2">
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
        {change && (
          <p className="text-sm text-white/90">
            <span className={change >= 0 ? "text-green-200" : "text-red-200"}>
              {change >= 0 ? "↑" : "↓"} {Math.abs(change)}%
            </span>{" "}
            vs last period
          </p>
        )}
      </div>
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <svg
                className="animate-spin h-16 w-16 mx-auto text-indigo-600 mb-4"
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
              <p className="text-gray-600 text-lg">Loading analytics...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <svg
                  className="w-8 h-8 mr-3 text-indigo-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Analytics Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Track your email performance and gain actionable insights
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={exportToCSV}
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
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Export CSV
              </button>
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Date Range Selector */}
        <div className="flex items-center justify-between mb-8">
          <DateRangeSelector />
          <div className="text-sm text-gray-600">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {overview && (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Follow-Ups"
                value={overview.total_followups}
                icon="📧"
                gradient="bg-gradient-to-br from-blue-500 to-blue-600"
              />
              <StatCard
                title="Reply Rate"
                value={`${overview.reply_rate}%`}
                icon="💬"
                gradient="bg-gradient-to-br from-purple-500 to-purple-600"
              />
              <StatCard
                title="Avg Response Time"
                value={`${overview.avg_response_time_hours}h`}
                icon="⏱️"
                gradient="bg-gradient-to-br from-pink-500 to-pink-600"
              />
              <StatCard
                title="Active Sequences"
                value={overview.active_sequences}
                icon="🚀"
                gradient="bg-gradient-to-br from-indigo-500 to-indigo-600"
              />
            </div>

            {/* Insights Section */}
            {insights && insights.insights.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <svg
                    className="w-6 h-6 mr-2 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                  AI-Powered Insights
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {insights.insights.map((insight: any, index: number) => (
                    <div
                      key={index}
                      className={`p-6 rounded-xl shadow-md border-l-4 ${
                        insight.type === "success"
                          ? "bg-green-50 border-green-500"
                          : insight.type === "warning"
                          ? "bg-yellow-50 border-yellow-500"
                          : insight.type === "tip"
                          ? "bg-blue-50 border-blue-500"
                          : "bg-purple-50 border-purple-500"
                      }`}
                    >
                      <div className="flex items-start">
                        <span className="text-3xl mr-4">{insight.icon}</span>
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {insight.title}
                          </h3>
                          <p className="text-sm text-gray-700">{insight.message}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {trends && (
          <>
            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Follow-ups Over Time */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                  Follow-ups Sent Over Time
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={trends.followups_over_time}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      stroke="#6b7280"
                    />
                    <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#6366f1"
                      strokeWidth={3}
                      dot={{ fill: "#6366f1", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Reply Rates by Tone */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  Reply Rates by Tone
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trends.reply_rates_by_tone}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="tone"
                      tick={{ fontSize: 12 }}
                      stroke="#6b7280"
                    />
                    <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="reply_rate" fill="#8b5cf6" name="Reply Rate %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Status Distribution */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-pink-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
                    />
                  </svg>
                  Status Distribution
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={trends.status_distribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, percent }) =>
                        `${status}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="status"
                    >
                      {trends.status_distribution.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={STATUS_COLORS[entry.status] || COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Performance by Day of Week */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  Performance by Day of Week
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={trends.performance_by_day}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 12 }}
                      stroke="#6b7280"
                    />
                    <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="total" fill="#3b82f6" name="Total Sent" />
                    <Bar dataKey="replied" fill="#10b981" name="Replied" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
