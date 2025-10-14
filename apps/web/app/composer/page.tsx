"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiClient, GenerateDraftResponse } from "@/lib/api";
import { DraftPreviewModal } from "@/components/DraftPreviewModal";

// Form validation schema
const composerSchema = z.object({
  to_email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(1, "Subject is required"),
  thread_context: z.string().min(10, "Thread context must be at least 10 characters"),
  tone: z.enum(["professional", "friendly", "urgent"], {
    required_error: "Please select a tone",
  }),
  delay_hours: z.coerce
    .number()
    .min(1, "Delay must be at least 1 hour")
    .max(168, "Delay cannot exceed 168 hours (1 week)"),
  recipient_name: z.string().optional(),
});

type ComposerFormData = z.infer<typeof composerSchema>;

export default function ComposerPage() {
  const searchParams = useSearchParams();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [draft, setDraft] = useState<GenerateDraftResponse | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    reset,
    setValue,
  } = useForm<ComposerFormData>({
    resolver: zodResolver(composerSchema),
    defaultValues: {
      tone: "professional",
      delay_hours: 48,
    },
  });

  // Pre-fill form from URL params (for templates)
  useEffect(() => {
    const subject = searchParams.get("subject");
    const threadContext = searchParams.get("thread_context");
    const tone = searchParams.get("tone");
    const delayHours = searchParams.get("delay_hours");

    if (subject) setValue("subject", subject);
    if (threadContext) setValue("thread_context", threadContext);
    if (tone && ["professional", "friendly", "urgent"].includes(tone)) {
      setValue("tone", tone as "professional" | "friendly" | "urgent");
    }
    if (delayHours) setValue("delay_hours", parseInt(delayHours, 10));
  }, [searchParams, setValue]);

  const onGenerateDraft = async (data: ComposerFormData) => {
    setIsGenerating(true);
    setError(null);

    try {
      const generatedDraft = await apiClient.generateDraft({
        original_subject: data.subject,
        original_body: data.thread_context,
        recipient_name: data.recipient_name,
        tone: data.tone,
      });

      setDraft(generatedDraft);
      setShowModal(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate draft");
    } finally {
      setIsGenerating(false);
    }
  };

  const onScheduleFollowUp = async () => {
    if (!draft) return;

    setIsScheduling(true);
    setError(null);

    try {
      const formData = getValues();

      await apiClient.createFollowUp({
        connection_id: 1, // TODO: Replace with actual connection selection
        original_recipient: formData.to_email,
        original_subject: formData.subject,
        original_body: formData.thread_context,
        delay_hours: formData.delay_hours,
        tone: formData.tone,
        max_followups: 1,
        stop_on_reply: true,
      });

      setSuccess("Follow-up scheduled successfully!");
      setShowModal(false);
      setDraft(null);
      reset();

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule follow-up");
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Create Follow-Up
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            AI will generate a personalized follow-up email based on your context
          </p>
        </div>

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

        {/* Form */}
        <form onSubmit={handleSubmit(onGenerateDraft)} className="bg-white shadow-sm rounded-lg p-6 space-y-6">
          {/* Recipient Email */}
          <div>
            <label htmlFor="to_email" className="block text-sm font-medium text-gray-700 mb-2">
              Recipient Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="to_email"
              {...register("to_email")}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border"
              placeholder="client@example.com"
            />
            {errors.to_email && (
              <p className="mt-1 text-sm text-red-600">{errors.to_email.message}</p>
            )}
          </div>

          {/* Recipient Name (Optional) */}
          <div>
            <label htmlFor="recipient_name" className="block text-sm font-medium text-gray-700 mb-2">
              Recipient Name (Optional)
            </label>
            <input
              type="text"
              id="recipient_name"
              {...register("recipient_name")}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border"
              placeholder="John Doe"
            />
          </div>

          {/* Subject */}
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
              Original Email Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="subject"
              {...register("subject")}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border"
              placeholder="Project Proposal"
            />
            {errors.subject && (
              <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
            )}
          </div>

          {/* Thread Context */}
          <div>
            <label htmlFor="thread_context" className="block text-sm font-medium text-gray-700 mb-2">
              Original Email / Thread Context <span className="text-red-500">*</span>
            </label>
            <textarea
              id="thread_context"
              {...register("thread_context")}
              rows={6}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border"
              placeholder="Hi John, I wanted to share our proposal for the upcoming project..."
            />
            {errors.thread_context && (
              <p className="mt-1 text-sm text-red-600">{errors.thread_context.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Provide the context of your original email or thread
            </p>
          </div>

          {/* Tone Selection */}
          <div>
            <label htmlFor="tone" className="block text-sm font-medium text-gray-700 mb-2">
              Follow-Up Tone <span className="text-red-500">*</span>
            </label>
            <select
              id="tone"
              {...register("tone")}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border"
            >
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="urgent">Urgent</option>
            </select>
            {errors.tone && (
              <p className="mt-1 text-sm text-red-600">{errors.tone.message}</p>
            )}
          </div>

          {/* Delay Hours */}
          <div>
            <label htmlFor="delay_hours" className="block text-sm font-medium text-gray-700 mb-2">
              Delay (Hours) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="delay_hours"
              {...register("delay_hours")}
              min="1"
              max="168"
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border"
            />
            {errors.delay_hours && (
              <p className="mt-1 text-sm text-red-600">{errors.delay_hours.message}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Time to wait before sending follow-up (1-168 hours)
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isGenerating}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  Generating Draft...
                </>
              ) : (
                "Generate AI Draft"
              )}
            </button>
          </div>
        </form>

        {/* Draft Preview Modal */}
        <DraftPreviewModal
          draft={draft}
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSchedule={onScheduleFollowUp}
          isScheduling={isScheduling}
        />
      </div>
    </div>
  );
}
