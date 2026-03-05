"use client";

import { useState, useRef, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = "upload" | "translating" | "done";

interface PreviewBlock {
  index: number;
  timestamp: string;
  text: string;
}

interface ConvertResult {
  srt: string;
  preview: PreviewBlock[];
  totalBlocks: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const SOURCE_LANGUAGES = [
  { value: "auto-detect", label: "Auto-detect" },
  { value: "English", label: "English" },
  { value: "Tamil", label: "Tamil" },
  { value: "Hindi", label: "Hindi" },
  { value: "Japanese", label: "Japanese" },
  { value: "Korean", label: "Korean" },
  { value: "Chinese (Simplified)", label: "Chinese (Simplified)" },
  { value: "Chinese (Traditional)", label: "Chinese (Traditional)" },
  { value: "Spanish", label: "Spanish" },
  { value: "French", label: "French" },
  { value: "German", label: "German" },
  { value: "Arabic", label: "Arabic" },
  { value: "Portuguese", label: "Portuguese" },
  { value: "Russian", label: "Russian" },
  { value: "Italian", label: "Italian" },
  { value: "Dutch", label: "Dutch" },
];

// ─── Stepper Component ────────────────────────────────────────────────────────

function Stepper({ step }: { step: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: "upload", label: "Upload" },
    { id: "translating", label: "Translating" },
    { id: "done", label: "Done" },
  ];

  const stepIndex = steps.findIndex((s) => s.id === step);

  return (
    <div className="flex items-center justify-center gap-0 mb-8">
      {steps.map((s, i) => {
        const isCompleted = i < stepIndex;
        const isActive = i === stepIndex;
        return (
          <div key={s.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                  isCompleted
                    ? "bg-green-500 text-white"
                    : isActive
                    ? "bg-blue-600 text-white ring-4 ring-blue-100"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>
              <span
                className={`mt-1 text-xs font-medium ${
                  isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-400"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-16 h-0.5 mx-2 mb-4 transition-all duration-300 ${
                  i < stepIndex ? "bg-green-400" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page Component ──────────────────────────────────────────────────────

export default function Home() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState("auto-detect");
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File validation ──────────────────────────────────────────────────────

  function validateFile(f: File): string | null {
    if (!f.name.toLowerCase().endsWith(".srt")) {
      return "Invalid file type. Please upload an .srt subtitle file.";
    }
    if (f.size > MAX_FILE_SIZE) {
      return `File too large (${(f.size / (1024 * 1024)).toFixed(1)} MB). Maximum size is 5 MB.`;
    }
    if (f.size === 0) {
      return "File is empty. Please upload a valid SRT file.";
    }
    return null;
  }

  // ── File selection handlers ──────────────────────────────────────────────

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setError(null);
    const err = validateFile(selected);
    if (err) {
      setError(err);
      return;
    }
    setFile(selected);
    setResult(null);
    setStep("upload");
  }

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped) return;
    setError(null);
    const err = validateFile(dropped);
    if (err) {
      setError(err);
      return;
    }
    setFile(dropped);
    setResult(null);
    setStep("upload");
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  function handleRemoveFile() {
    setFile(null);
    setError(null);
    setResult(null);
    setStep("upload");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ── Conversion ───────────────────────────────────────────────────────────

  async function handleConvert() {
    if (!file) return;
    setError(null);
    setStep("translating");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sourceLanguage", sourceLanguage);

      const response = await fetch("/api/convert", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Conversion failed. Please try again.");
      }

      setResult(data);
      setStep("done");
    } catch (err) {
      setStep("upload");
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred. Please try again."
      );
    }
  }

  // ── Download ─────────────────────────────────────────────────────────────

  function handleDownload() {
    if (!result) return;
    const blob = new Blob([result.srt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const baseName = file?.name.replace(/\.srt$/i, "") ?? "subtitles";
    a.download = `${baseName}_sinhala.srt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Retry ────────────────────────────────────────────────────────────────

  function handleRetry() {
    setError(null);
    setResult(null);
    setStep("upload");
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
            Si
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">
              SiSub
            </h1>
            <p className="text-xs text-gray-500">Sinhala Subtitle Converter</p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-4xl mx-auto px-4 py-10">
        {/* Hero */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-3">
            Convert Subtitles to{" "}
            <span className="text-blue-600">සිංහල</span>
          </h2>
          <p className="text-gray-500 text-base max-w-xl mx-auto">
            Upload an SRT subtitle file and get an AI-powered Sinhala
            translation in seconds — timestamps preserved.
          </p>
        </div>

        {/* Stepper */}
        <Stepper step={step} />

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          {/* ── Upload step ── */}
          {step !== "done" && (
            <>
              {/* Drop zone */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => !file && fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                  file
                    ? "border-green-300 bg-green-50 cursor-default"
                    : isDragging
                    ? "border-blue-400 bg-blue-50 cursor-copy"
                    : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50 cursor-pointer"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".srt"
                  onChange={handleFileChange}
                  className="hidden"
                  aria-label="Upload SRT file"
                />

                {file ? (
                  <div className="flex items-center justify-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-800 text-sm">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemoveFile(); }}
                      className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      aria-label="Remove file"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-blue-50 flex items-center justify-center">
                      <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                    </div>
                    <p className="text-gray-700 font-medium mb-1">
                      Drop your SRT file here
                    </p>
                    <p className="text-sm text-gray-400">
                      or{" "}
                      <span className="text-blue-600 font-medium">browse</span>{" "}
                      to upload
                    </p>
                    <p className="mt-2 text-xs text-gray-400">
                      .srt files only &middot; max 5 MB
                    </p>
                  </>
                )}
              </div>

              {/* Language selectors */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Source Language
                  </label>
                  <select
                    value={sourceLanguage}
                    onChange={(e) => setSourceLanguage(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition"
                  >
                    {SOURCE_LANGUAGES.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Target Language
                  </label>
                  <div className="w-full rounded-lg border border-gray-100 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 flex items-center gap-2">
                    <span className="text-base">&#x1F1F1;&#x1F1F0;</span>
                    Sinhala (si-LK) &mdash; fixed
                  </div>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div className="mt-5 rounded-xl bg-red-50 border border-red-100 p-4 flex gap-3">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-red-700">Error</p>
                    <p className="text-sm text-red-600 mt-0.5">{error}</p>
                    <button
                      onClick={handleRetry}
                      className="mt-2 text-xs font-medium text-red-600 hover:text-red-800 underline"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              )}

              {/* Convert button */}
              <button
                onClick={handleConvert}
                disabled={!file || step === "translating"}
                className={`mt-6 w-full py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 ${
                  !file || step === "translating"
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-sm hover:shadow-md"
                }`}
              >
                {step === "translating" ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Translating with Gemini AI&#8230;
                  </span>
                ) : (
                  "Convert to Sinhala \u2192"
                )}
              </button>
            </>
          )}

          {/* ── Translating progress ── */}
          {step === "translating" && (
            <div className="mt-6 p-5 rounded-xl bg-blue-50 border border-blue-100">
              <div className="flex items-center gap-3 mb-3">
                <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-sm font-semibold text-blue-700">
                  Translating your subtitles&#8230;
                </span>
              </div>
              <p className="text-xs text-blue-500">
                Gemini AI is translating your subtitles to Sinhala. This may take
                a few seconds depending on file size.
              </p>
            </div>
          )}

          {/* ── Done step ── */}
          {step === "done" && result && (
            <>
              {/* Success banner */}
              <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-100 mb-6">
                <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-green-800">
                    Translation complete!
                  </p>
                  <p className="text-xs text-green-600">
                    {result.totalBlocks} subtitle{result.totalBlocks !== 1 ? "s" : ""} translated to Sinhala
                  </p>
                </div>
              </div>

              {/* Download button */}
              <button
                onClick={handleDownload}
                className="w-full py-3 px-6 rounded-xl font-semibold text-sm bg-green-600 text-white hover:bg-green-700 active:scale-[0.98] shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Sinhala Subtitles (.srt)
              </button>

              {/* Preview */}
              {result.preview.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Preview (first {result.preview.length} entries)
                  </h3>
                  <div className="rounded-xl border border-gray-100 overflow-hidden">
                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                      {result.preview.map((block) => (
                        <div key={block.index} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span className="text-xs font-bold text-gray-400 w-5">
                              {block.index}
                            </span>
                            <span className="text-xs text-gray-400 font-mono">
                              {block.timestamp}
                            </span>
                          </div>
                          <p className="text-sm text-gray-800 pl-7 leading-relaxed">
                            {block.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Convert another */}
              <button
                onClick={handleRetry}
                className="mt-4 w-full py-2.5 px-6 rounded-xl font-medium text-sm text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Convert another file
              </button>
            </>
          )}
        </div>

        {/* Info footer */}
        <p className="text-center text-xs text-gray-400 mt-8">
          Powered by{" "}
          <span className="font-medium text-gray-500">Gemini 1.5 Flash</span>{" "}
          &middot; Translations are AI-generated and may require review
        </p>
      </main>
    </div>
  );
}
