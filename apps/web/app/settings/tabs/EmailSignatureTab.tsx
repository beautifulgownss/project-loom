"use client";

import { useState, useEffect } from "react";

interface EmailSignatureTabProps {
  settings: any;
  onUpdate: (updates: any) => Promise<void>;
  saveStatus: "idle" | "saving" | "success" | "error";
}

export default function EmailSignatureTab({
  settings,
  onUpdate,
  saveStatus,
}: EmailSignatureTabProps) {
  const [signature, setSignature] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (settings?.email_signature) {
      setSignature(settings.email_signature);
    }
  }, [settings]);

  const handleSave = async () => {
    await onUpdate({
      email_signature: signature,
    });
  };

  const insertFormatting = (before: string, after: string = before) => {
    const textarea = document.getElementById("signature-editor") as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = signature.substring(start, end);
    const newText =
      signature.substring(0, start) +
      before +
      selectedText +
      after +
      signature.substring(end);

    setSignature(newText);

    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        end + before.length
      );
    }, 0);
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Email Signature</h2>
        <p className="mt-1 text-sm text-gray-600">
          Create a professional signature for your outgoing emails
        </p>
      </div>

      <div className="space-y-6">
        {/* Formatting Toolbar */}
        <div className="flex items-center gap-2 p-2 bg-gray-50 border border-gray-300 rounded-t-md">
          <button
            type="button"
            onClick={() => insertFormatting("**")}
            className="px-3 py-1 text-sm font-bold hover:bg-gray-200 rounded"
            title="Bold"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => insertFormatting("_")}
            className="px-3 py-1 text-sm italic hover:bg-gray-200 rounded"
            title="Italic"
          >
            I
          </button>
          <div className="w-px h-6 bg-gray-300" />
          <button
            type="button"
            onClick={() => insertFormatting("[", "](url)")}
            className="px-3 py-1 text-sm hover:bg-gray-200 rounded"
            title="Link"
          >
            Link
          </button>
          <div className="w-px h-6 bg-gray-300" />
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={`px-3 py-1 text-sm hover:bg-gray-200 rounded ${
              showPreview ? "bg-indigo-100 text-indigo-700" : ""
            }`}
          >
            {showPreview ? "Edit" : "Preview"}
          </button>
        </div>

        {/* Editor / Preview */}
        {!showPreview ? (
          <div>
            <textarea
              id="signature-editor"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              rows={10}
              className="w-full px-4 py-3 border border-gray-300 border-t-0 rounded-b-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm resize-none"
              placeholder={`Best regards,
John Doe
CEO, Company Name
john@company.com | +1 (555) 123-4567
www.company.com`}
            />
            <p className="mt-2 text-xs text-gray-500">
              Supports basic Markdown formatting: **bold**, _italic_, [link](url)
            </p>
          </div>
        ) : (
          <div className="border border-gray-300 border-t-0 rounded-b-md p-4 bg-white min-h-[240px]">
            <div className="prose prose-sm max-w-none">
              {signature ? (
                <div
                  className="whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{
                    __html: signature
                      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                      .replace(/_(.*?)_/g, "<em>$1</em>")
                      .replace(
                        /\[(.*?)\]\((.*?)\)/g,
                        '<a href="$2" class="text-indigo-600 hover:text-indigo-500">$1</a>'
                      ),
                  }}
                />
              ) : (
                <p className="text-gray-400">Your signature preview will appear here...</p>
              )}
            </div>
          </div>
        )}

        {/* Examples */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Example Signature:</h4>
          <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">
            {`Best regards,
**John Doe**
_CEO, Project Loom_
john@projectloom.com | +1 (555) 123-4567
[projectloom.com](https://projectloom.com)`}
          </pre>
        </div>

        {/* Save Button */}
        <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saveStatus === "saving"}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saveStatus === "saving" ? "Saving..." : "Save Signature"}
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
