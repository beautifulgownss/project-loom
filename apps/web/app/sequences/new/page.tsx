"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiClient, SequenceStep } from "@/lib/api";
import { SequenceTimeline } from "@/components/SequenceTimeline";

// Form validation schema
const sequenceSchema = z.object({
  name: z.string().min(1, "Sequence name is required").max(255),
  description: z.string().optional(),
  stop_on_reply: z.boolean(),
  is_active: z.boolean(),
  steps: z
    .array(
      z.object({
        step_number: z.number().int().min(1),
        subject: z.string().min(1, "Subject is required").max(255),
        body: z.string().min(1, "Email body is required"),
        tone: z.enum(["professional", "friendly", "urgent"]),
        delay_days: z.number().int().min(0, "Delay must be 0 or greater"),
      })
    )
    .min(2, "Sequence must have at least 2 steps")
    .max(5, "Sequence cannot have more than 5 steps")
    .refine(
      (steps) => steps[0].delay_days === 0,
      "First step must have delay_days = 0"
    )
    .refine(
      (steps) => steps.every((step, index) => step.step_number === index + 1),
      "Step numbers must be sequential starting from 1"
    ),
});

type SequenceFormData = z.infer<typeof sequenceSchema>;

export default function NewSequencePage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = useForm<SequenceFormData>({
    resolver: zodResolver(sequenceSchema),
    defaultValues: {
      name: "",
      description: "",
      stop_on_reply: true,
      is_active: true,
      steps: [
        {
          step_number: 1,
          subject: "",
          body: "",
          tone: "professional",
          delay_days: 0,
        },
        {
          step_number: 2,
          subject: "",
          body: "",
          tone: "professional",
          delay_days: 3,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "steps",
  });

  const watchedSteps = watch("steps");

  const onSubmit = async (data: SequenceFormData) => {
    setIsCreating(true);
    setError(null);

    try {
      const sequence = await apiClient.createSequence(data);
      router.push("/sequences");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create sequence");
    } finally {
      setIsCreating(false);
    }
  };

  const addStep = () => {
    if (fields.length < 5) {
      append({
        step_number: fields.length + 1,
        subject: "",
        body: "",
        tone: "professional",
        delay_days: 3,
      });
    }
  };

  const removeStep = (index: number) => {
    if (fields.length > 2) {
      remove(index);
      // Re-number remaining steps
      fields.forEach((_, i) => {
        if (i >= index) {
          const newStepNumber = i + 1;
          // This will be handled by the form state
        }
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Create New Sequence
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Build a multi-step follow-up campaign with 2-5 automated emails
              </p>
            </div>
            <button
              onClick={() => router.push("/sequences")}
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
              Back to Sequences
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Sequence Details */}
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Sequence Details
            </h2>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Sequence Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  {...register("name")}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border"
                  placeholder="e.g., Sales Follow-Up Sequence"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Description (Optional)
                </label>
                <textarea
                  id="description"
                  {...register("description")}
                  rows={2}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border"
                  placeholder="Describe the purpose of this sequence..."
                />
              </div>

              {/* Settings */}
              <div className="flex items-center space-x-8 pt-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="stop_on_reply"
                    {...register("stop_on_reply")}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="stop_on_reply"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Stop sequence if recipient replies
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    {...register("is_active")}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="is_active"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Activate sequence immediately
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Visualization */}
          {watchedSteps.length > 0 && (
            <SequenceTimeline steps={watchedSteps as SequenceStep[]} />
          )}

          {/* Sequence Steps */}
          <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center">
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                Email Steps ({fields.length}/5)
              </h2>

              <button
                type="button"
                onClick={addStep}
                disabled={fields.length >= 5}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                Add Step
              </button>
            </div>

            {errors.steps && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800">{errors.steps.message}</p>
              </div>
            )}

            <div className="space-y-6">
              {fields.map((field, index) => (
                <div
                  key={field.id}
                  className="relative border-2 border-gray-200 rounded-lg p-6 hover:border-indigo-300 transition-colors"
                >
                  {/* Step Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`
                        w-10 h-10 rounded-full flex items-center justify-center font-bold text-white
                        ${
                          index === 0
                            ? "bg-gradient-to-br from-green-400 to-green-600"
                            : "bg-gradient-to-br from-indigo-500 to-purple-600"
                        }
                      `}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {index === 0 ? "Initial Email" : `Follow-up ${index}`}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {index === 0
                            ? "Sent immediately"
                            : `Sent after previous step`}
                        </p>
                      </div>
                    </div>

                    {fields.length > 2 && index > 0 && (
                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-50"
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
                    )}
                  </div>

                  <input
                    type="hidden"
                    {...register(`steps.${index}.step_number`)}
                    value={index + 1}
                  />

                  <div className="space-y-4">
                    {/* Delay (hidden for first step) */}
                    {index > 0 && (
                      <div>
                        <label
                          htmlFor={`steps.${index}.delay_days`}
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Delay After Previous Step (Days){" "}
                          <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          id={`steps.${index}.delay_days`}
                          {...register(`steps.${index}.delay_days`, {
                            valueAsNumber: true,
                          })}
                          min="1"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border"
                        />
                        {errors.steps?.[index]?.delay_days && (
                          <p className="mt-1 text-sm text-red-600">
                            {errors.steps[index]?.delay_days?.message}
                          </p>
                        )}
                      </div>
                    )}

                    {index === 0 && (
                      <input
                        type="hidden"
                        {...register(`steps.${index}.delay_days`)}
                        value={0}
                      />
                    )}

                    {/* Subject */}
                    <div>
                      <label
                        htmlFor={`steps.${index}.subject`}
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Email Subject <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id={`steps.${index}.subject`}
                        {...register(`steps.${index}.subject`)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border"
                        placeholder={
                          index === 0
                            ? "Initial outreach subject"
                            : `Follow-up ${index} subject`
                        }
                      />
                      {errors.steps?.[index]?.subject && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.steps[index]?.subject?.message}
                        </p>
                      )}
                    </div>

                    {/* Body */}
                    <div>
                      <label
                        htmlFor={`steps.${index}.body`}
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Email Body / Context{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id={`steps.${index}.body`}
                        {...register(`steps.${index}.body`)}
                        rows={4}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border"
                        placeholder={
                          index === 0
                            ? "Your initial email content..."
                            : "Your follow-up email content..."
                        }
                      />
                      {errors.steps?.[index]?.body && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.steps[index]?.body?.message}
                        </p>
                      )}
                    </div>

                    {/* Tone */}
                    <div>
                      <label
                        htmlFor={`steps.${index}.tone`}
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Email Tone <span className="text-red-500">*</span>
                      </label>
                      <select
                        id={`steps.${index}.tone`}
                        {...register(`steps.${index}.tone`)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border"
                      >
                        <option value="professional">💼 Professional</option>
                        <option value="friendly">😊 Friendly</option>
                        <option value="urgent">⚡ Urgent</option>
                      </select>
                      {errors.steps?.[index]?.tone && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.steps[index]?.tone?.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push("/sequences")}
              className="px-6 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="px-6 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isCreating ? (
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
                  Creating...
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Create Sequence
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
