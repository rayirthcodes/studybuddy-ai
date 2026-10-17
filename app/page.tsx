
"use client";

import { useState } from "react";

type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
};

export default function Home() {
  const [notes, setNotes] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploadedFilename, setUploadedFilename] = useState("");

  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function handleUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError("");
    setUploadedFilename("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const responseText = await response.text();

      let data: {
        error?: string;
        text?: string;
        filename?: string;
      };

      try {
        data = JSON.parse(responseText);
      } catch {
        throw new Error(
          `Upload API returned a non-JSON response (${response.status}): ${
            responseText.slice(0, 250) || "Empty response"
          }`
        );
      }

      if (!response.ok) {
        throw new Error(data.error || "Upload failed.");
      }

      if (typeof data.text !== "string" || !data.text.trim()) {
        throw new Error("No readable text was extracted from the file.");
      }

      setNotes(data.text);
      setUploadedFilename(data.filename || file.name);

      setSummary("");
      setSummaryError("");
      setAnswer("");
      setError("");
      setQuiz([]);
      setSelectedAnswers([]);
      setQuizError("");
      setSubmitted(false);
    } catch (err) {
      setUploadError(
        err instanceof Error
          ? err.message
          : "Could not upload the file."
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleAsk() {
    if (!notes.trim() || !question.trim() || loading) return;

    setLoading(true);
    setAnswer("");
    setError("");

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes: notes.trim(),
          question: question.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get an answer.");
      }

      const result =
        data.answer ?? data.response ?? data.message?.content;

      if (typeof result !== "string" || !result.trim()) {
        throw new Error("The API returned no answer.");
      }

      setAnswer(result);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateSummary() {
    if (!notes.trim() || summaryLoading) return;

    setSummaryLoading(true);
    setSummaryError("");
    setSummary("");

    try {
      const response = await fetch("/api/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notes.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to generate revision notes."
        );
      }

      if (typeof data.summary !== "string" || !data.summary.trim()) {
        throw new Error("The API returned an empty summary.");
      }

      setSummary(data.summary);
    } catch (err) {
      setSummaryError(
        err instanceof Error
          ? err.message
          : "Could not generate revision notes. Please try again."
      );
    } finally {
      setSummaryLoading(false);
    }
  }

  async function handleCopySummary() {
    if (!summary) return;

    try {
      await navigator.clipboard.writeText(summary);
      setSummaryError("");
    } catch {
      setSummaryError(
        "Copy failed. You can select the summary text and copy it manually."
      );
    }
  }

  async function handleGenerateQuiz() {
    if (!notes.trim() || quizLoading) return;

    setQuizLoading(true);
    setQuizError("");
    setQuiz([]);
    setSelectedAnswers([]);
    setSubmitted(false);

    try {
      const response = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notes.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate quiz.");
      }

      if (!Array.isArray(data.questions) || data.questions.length !== 5) {
        throw new Error(
          "The quiz response was invalid. Please try again."
        );
      }

      setQuiz(data.questions);
      setSelectedAnswers(Array(5).fill(-1));
    } catch (err) {
      setQuizError(
        err instanceof Error
          ? err.message
          : "Could not generate quiz. Please try again."
      );
    } finally {
      setQuizLoading(false);
    }
  }

  function handleSubmitQuiz() {
    if (selectedAnswers.some((answer) => answer === -1)) {
      setQuizError("Please answer all 5 questions before submitting.");
      return;
    }

    setQuizError("");
    setSubmitted(true);
  }

  const score = quiz.reduce(
    (total, q, index) =>
      total + (selectedAnswers[index] === q.correctAnswer ? 1 : 0),
    0
  );

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-xl font-bold">
            S
          </div>

          <div>
            <h1 className="text-xl font-bold">StudyBuddy AI</h1>
            <p className="text-xs text-slate-400">
              Your personal AI study companion
            </p>
          </div>

          <span className="ml-auto rounded-full border border-emerald-500/30 px-3 py-1 text-xs text-emerald-300">
            Study mode
          </span>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="mb-10 max-w-2xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-300">
            Learn smarter
          </p>

          <h2 className="text-4xl font-bold leading-tight sm:text-5xl">
            Your notes.
            <br />
            Your questions.
            <br />
            <span className="text-indigo-400">Your understanding.</span>
          </h2>

          <p className="mt-4 text-slate-400">
            Add your study notes, ask questions, and prepare for exams
            with the help of AI.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Study notes and file upload */}
          <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-indigo-500/15 p-3 text-indigo-300">
                01
              </div>

              <div>
                <h3 className="text-lg font-semibold">Your study notes</h3>
                <p className="text-sm text-slate-400">
                  Paste notes or upload a document
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label
                htmlFor="study-file"
                className={`inline-flex items-center gap-2 rounded-xl border border-indigo-400/40 px-4 py-3 text-sm font-medium text-indigo-300 ${
                  uploading
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer hover:bg-indigo-500/10"
                }`}
              >
                {uploading ? "Reading file..." : "↑ Upload PDF / DOCX"}
              </label>

              <input
                id="study-file"
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
              />

              {uploadedFilename && (
                <p className="mt-2 break-words text-sm text-emerald-300">
                  ✓ Loaded: {uploadedFilename}
                </p>
              )}

              {uploadError && (
                <p role="alert" className="mt-2 text-sm text-red-400">
                  {uploadError}
                </p>
              )}
            </div>

            <textarea
              value={notes}
              onChange={(event) => {
                setNotes(event.target.value);
                setUploadedFilename("");
                setSummary("");
                setSummaryError("");
              }}
              placeholder="Paste your lecture notes here, or upload a PDF/DOCX file above..."
              className="min-h-64 w-full resize-y rounded-xl border border-white/10 bg-slate-950 p-4 text-sm leading-6 outline-none transition focus:border-indigo-400"
            />

            <p className="mt-3 text-xs text-slate-500">
              {notes.length} characters entered
            </p>
          </section>

          {/* AI tutor */}
          <section className="rounded-2xl border border-white/10 bg-slate-900 p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-violet-500/15 p-3 text-violet-300">
                02
              </div>

              <div>
                <h3 className="text-lg font-semibold">Ask your AI tutor</h3>
                <p className="text-sm text-slate-400">
                  Understand difficult concepts
                </p>
              </div>
            </div>

            <label
              htmlFor="question"
              className="mb-2 block text-sm text-slate-300"
            >
              What would you like to understand?
            </label>

            <textarea
              id="question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="e.g. Explain this concept in simple words..."
              className="min-h-32 w-full resize-y rounded-xl border border-white/10 bg-slate-950 p-4 text-sm leading-6 outline-none transition focus:border-indigo-400"
            />

            <button
              type="button"
              onClick={handleAsk}
              disabled={!notes.trim() || !question.trim() || loading}
              className="mt-4 w-full rounded-xl bg-indigo-500 px-5 py-3 font-semibold transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? "Thinking..." : "Ask StudyBuddy →"}
            </button>

            <div
              aria-live="polite"
              className="mt-4 min-h-16 whitespace-pre-wrap break-words rounded-xl border border-dashed border-white/15 p-4 text-sm"
            >
              {loading ? (
                <p className="text-indigo-300">
                  StudyBuddy is thinking. The first response may take a
                  little longer while Ollama loads the model.
                </p>
              ) : error ? (
                <p className="text-red-400">{error}</p>
              ) : answer ? (
                <p className="leading-7 text-slate-200">{answer}</p>
              ) : (
                <p className="text-slate-500">
                  Your AI explanation will appear here.
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Quick Revision Notes */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold">
                Quick Revision Notes
              </h3>
              <p className="mt-1 text-sm text-slate-400">
                Turn your study material into concise, exam-focused revision
                notes.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGenerateSummary}
              disabled={!notes.trim() || summaryLoading}
              className="rounded-xl bg-violet-500 px-5 py-3 font-semibold transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {summaryLoading
                ? "Creating revision notes..."
                : "Generate revision notes →"}
            </button>
          </div>

          {summaryLoading && (
            <p className="mt-5 text-sm text-violet-300">
              Gemma is reviewing your material. This may take a little while.
            </p>
          )}

          {summaryError && (
            <p role="alert" className="mt-5 text-sm text-red-400">
              {summaryError}
            </p>
          )}

          {summary && (
            <div className="mt-5 rounded-xl border border-white/10 bg-slate-950 p-5">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h4 className="font-semibold text-violet-300">
                  Your revision summary
                </h4>

                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="rounded-lg border border-white/15 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/5"
                >
                  Copy summary
                </button>
              </div>

              <div className="whitespace-pre-wrap break-words text-sm leading-7 text-slate-200">
                {summary}
              </div>
            </div>
          )}
        </section>

        {/* Quiz generator */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-slate-900 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold">Test your knowledge</h3>
              <p className="mt-1 text-sm text-slate-400">
                Generate five MCQs from your own study notes.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGenerateQuiz}
              disabled={!notes.trim() || quizLoading}
              className="rounded-xl border border-indigo-400/40 px-5 py-3 font-medium text-indigo-300 transition hover:bg-indigo-500/10 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {quizLoading ? "Generating quiz..." : "Generate a quiz →"}
            </button>
          </div>

          {quizLoading && (
            <p className="mt-5 text-sm text-indigo-300">
              Gemma is preparing your questions. This may take a little while.
            </p>
          )}

          {quizError && (
            <p role="alert" className="mt-5 text-sm text-red-400">
              {quizError}
            </p>
          )}

          {quiz.length > 0 && (
            <div className="mt-6 space-y-6">
              {quiz.map((q, index) => (
                <div
                  key={`${index}-${q.question}`}
                  className="rounded-xl border border-white/10 bg-slate-950 p-5"
                >
                  <h4 className="font-semibold leading-7">
                    {index + 1}. {q.question}
                  </h4>

                  <div className="mt-4 space-y-3">
                    {q.options.map((option, optionIndex) => {
                      const isCorrect =
                        optionIndex === q.correctAnswer;
                      const isSelected =
                        selectedAnswers[index] === optionIndex;

                      let optionStyle =
                        "border-white/10 hover:border-indigo-400/60";

                      if (!submitted && isSelected) {
                        optionStyle =
                          "border-indigo-400 bg-indigo-500/15";
                      }

                      if (submitted && isCorrect) {
                        optionStyle =
                          "border-emerald-500/60 bg-emerald-500/10";
                      } else if (submitted && isSelected && !isCorrect) {
                        optionStyle =
                          "border-red-500/60 bg-red-500/10";
                      }

                      return (
                        <button
                          key={optionIndex}
                          type="button"
                          disabled={submitted}
                          onClick={() => {
                            setSelectedAnswers((previous) =>
                              previous.map((value, i) =>
                                i === index ? optionIndex : value
                              )
                            );
                            setQuizError("");
                          }}
                          className={`w-full rounded-lg border p-3 text-left text-sm transition ${optionStyle} disabled:cursor-default`}
                        >
                          <span className="mr-3 font-semibold text-slate-400">
                            {String.fromCharCode(65 + optionIndex)}.
                          </span>
                          {option}
                        </button>
                      );
                    })}
                  </div>

                  {submitted && (
                    <p className="mt-4 text-sm leading-6 text-slate-300">
                      <span className="font-semibold text-indigo-300">
                        Explanation:{" "}
                      </span>
                      {q.explanation}
                    </p>
                  )}
                </div>
              ))}

              {!submitted ? (
                <button
                  type="button"
                  onClick={handleSubmitQuiz}
                  className="w-full rounded-xl bg-indigo-500 px-5 py-3 font-semibold transition hover:bg-indigo-400"
                >
                  Submit answers
                </button>
              ) : (
                <div className="rounded-xl border border-indigo-400/30 bg-indigo-500/10 p-6 text-center">
                  <p className="text-sm text-indigo-300">
                    Your final score
                  </p>

                  <p className="mt-2 text-4xl font-bold">
                    {score} / {quiz.length}
                  </p>

                  <p className="mt-2 text-sm text-slate-300">
                    {score === 5
                      ? "Perfect score! Amazing work!"
                      : score >= 3
                        ? "Good job! Review the explanations to improve."
                        : "Keep practising! Review the explanations and try again."}
                  </p>

                  <button
                    type="button"
                    onClick={handleGenerateQuiz}
                    disabled={quizLoading}
                    className="mt-5 rounded-xl border border-indigo-400/40 px-5 py-3 font-medium text-indigo-300 hover:bg-indigo-500/10 disabled:opacity-40"
                  >
                    Try another quiz →
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        <footer className="py-8 text-center text-xs text-slate-500">
          StudyBuddy AI · Built for learning with open-weight AI
        </footer>
      </section>
    </main>
  );
}
