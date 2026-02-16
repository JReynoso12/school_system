"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

interface ExamTakerProps {
  exam: { id: string; title: string; timeLimit: number | null; shuffleOptions: boolean };
  items: Array<{
    id: string;
    questionId: string;
    type: string;
    content: string;
    options: { id: string; text: string; correct?: boolean }[] | null;
    points: number;
  }>;
  attemptId: string;
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ExamTaker({ exam, items: initialItems, attemptId }: ExamTakerProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [currentIdx, setCurrentIdx] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(
    exam.timeLimit ? exam.timeLimit * 60 : null
  );
  const [submitted, setSubmitted] = useState(false);
  const submittingRef = useRef(false);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const items = exam.shuffleOptions && initialItems
    ? initialItems.map((item) => {
        if (item.options && Array.isArray(item.options)) {
          return {
            ...item,
            options: [...item.options].sort(() => Math.random() - 0.5),
          };
        }
        return item;
      })
    : initialItems;

  const currentItem = items[currentIdx];

  const saveProgress = useCallback(async () => {
    await fetch("/api/exams/attempt", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptId, answers }),
    });
  }, [attemptId, answers]);

  const handleSubmit = useCallback(async () => {
    if (submitted || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitted(true);
    await fetch("/api/exams/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attemptId, answers: answersRef.current }),
    });
    router.push(`/student/attempts/${attemptId}`);
    router.refresh();
  }, [attemptId, router, submitted]);

  useEffect(() => {
    if (secondsLeft === null || submitted) return;
    const t = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev == null || prev <= 1) {
          clearInterval(t);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [secondsLeft, submitted, handleSubmit]);

  useEffect(() => {
    const interval = setInterval(saveProgress, 30000);
    return () => clearInterval(interval);
  }, [saveProgress]);

  function toggleMarkForReview(itemId: string) {
    setMarkedForReview((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{exam.title}</h1>
        {secondsLeft !== null && (
          <div
            className={`text-xl font-mono font-bold ${
              secondsLeft <= 60 ? "text-destructive" : ""
            }`}
          >
            {formatTime(secondsLeft)}
          </div>
        )}
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {items.map((item, idx) => (
          <button
            key={item.id}
            onClick={() => setCurrentIdx(idx)}
            className={`shrink-0 w-10 h-10 rounded-lg font-medium ${
              currentIdx === idx
                ? "bg-primary text-primary-foreground"
                : answers[item.id]
                  ? "bg-primary/20"
                  : markedForReview.has(item.id)
                    ? "bg-amber-500/30"
                    : "bg-muted hover:bg-muted/80"
            }`}
          >
            {idx + 1}
          </button>
        ))}
      </div>
      <div className="bg-card border border-border rounded-xl p-6">
        <p className="text-sm text-muted-foreground mb-2">
          Question {currentIdx + 1} of {items.length} • {currentItem.type} •{" "}
          {currentItem.points} pt(s)
        </p>
        <p className="font-medium mb-4">{currentItem.content}</p>
        <div className="space-y-3">
          {currentItem.type === "MULTIPLE_CHOICE" && currentItem.options && (
            currentItem.options.map((opt) => (
              <label
                key={opt.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer"
              >
                <input
                  type="radio"
                  name={currentItem.id}
                  value={opt.id}
                  checked={answers[currentItem.id] === opt.id}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [currentItem.id]: e.target.value,
                    }))
                  }
                />
                {opt.text}
              </label>
            ))
          )}
          {currentItem.type === "TRUE_FALSE" && currentItem.options && (
            currentItem.options.map((opt) => (
              <label
                key={opt.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer"
              >
                <input
                  type="radio"
                  name={currentItem.id}
                  value={opt.id}
                  checked={answers[currentItem.id] === opt.id}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [currentItem.id]: e.target.value,
                    }))
                  }
                />
                {opt.text}
              </label>
            ))
          )}
          {(currentItem.type === "IDENTIFICATION" ||
            currentItem.type === "SHORT_ANSWER" ||
            currentItem.type === "ESSAY") && (
            <textarea
              value={answers[currentItem.id] ?? ""}
              onChange={(e) =>
                setAnswers((prev) => ({
                  ...prev,
                  [currentItem.id]: e.target.value,
                }))
              }
              className="w-full px-4 py-2 border border-input rounded-lg min-h-[100px]"
              placeholder="Your answer..."
            />
          )}
        </div>
        <div className="mt-6 flex justify-between">
          <button
            type="button"
            onClick={() => toggleMarkForReview(currentItem.id)}
            className="px-4 py-2 border border-border rounded-lg hover:bg-muted"
          >
            {markedForReview.has(currentItem.id)
              ? "Unmark for review"
              : "Mark for review"}
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
              className="px-4 py-2 border border-border rounded-lg hover:bg-muted disabled:opacity-50"
            >
              Previous
            </button>
            {currentIdx < items.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIdx((i) => i + 1)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitted}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                Submit Exam
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitted}
          className="px-6 py-2 bg-destructive text-destructive-foreground rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          Submit Exam
        </button>
      </div>
    </div>
  );
}
