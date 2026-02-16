"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface Section {
  id: string;
  name: string;
  subject: { name: string };
}

interface Question {
  id: string;
  content: string;
  type: string;
  subject: { name: string };
}

interface ExamFormProps {
  subjects: Subject[];
  sections: Section[];
  questions: Question[];
  tenantId: string;
}

export function ExamForm({ subjects, sections, questions, tenantId }: ExamFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [sectionIds, setSectionIds] = useState<string[]>([]);
  const [timeLimit, setTimeLimit] = useState<number | "">(30);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredQuestions = subjectId
    ? questions.filter((q) => {
        const subj = subjects.find((s) => s.id === subjectId);
        return subj && q.subject?.name === subj.name;
      })
    : [];

  function toggleQuestion(id: string) {
    setSelectedQuestions((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          subjectId,
          sectionIds,
          timeLimit: timeLimit === "" ? null : Number(timeLimit),
          shuffleQuestions,
          shuffleOptions,
          questionIds: selectedQuestions,
          tenantId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create exam");
        setLoading(false);
        return;
      }
      router.push(`/teacher/exams/${data.id}`);
      router.refresh();
    } catch {
      setError("An error occurred");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div>
        <label className="block text-sm font-medium mb-2">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border border-input rounded-lg"
          placeholder="Math Quiz 1"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Description (optional)</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-2 border border-input rounded-lg"
          rows={2}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Subject</label>
        <select
          value={subjectId}
          onChange={(e) => {
            setSubjectId(e.target.value);
            setSelectedQuestions([]);
          }}
          className="w-full px-4 py-2 border border-input rounded-lg"
        >
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.code})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Assign to Sections</label>
        <div className="flex flex-wrap gap-2">
          {sections
            .filter((s) => {
              const subj = subjects.find((x) => x.id === subjectId);
              return subj && s.subject?.name === subj.name;
            })
            .map((sec) => (
              <label key={sec.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sectionIds.includes(sec.id)}
                  onChange={(e) =>
                    setSectionIds((prev) =>
                      e.target.checked ? [...prev, sec.id] : prev.filter((x) => x !== sec.id)
                    )
                  }
                />
                {sec.name}
              </label>
            ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Time Limit (minutes)</label>
        <input
          type="number"
          value={timeLimit}
          onChange={(e) =>
            setTimeLimit(e.target.value === "" ? "" : parseInt(e.target.value, 10))
          }
          className="w-full px-4 py-2 border border-input rounded-lg"
          placeholder="30"
          min={1}
        />
      </div>
      <div className="flex gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={shuffleQuestions}
            onChange={(e) => setShuffleQuestions(e.target.checked)}
          />
          Shuffle question order
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={shuffleOptions}
            onChange={(e) => setShuffleOptions(e.target.checked)}
          />
          Shuffle answer options
        </label>
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">
          Select Questions ({selectedQuestions.length} selected)
        </label>
        <div className="border border-border rounded-lg max-h-64 overflow-y-auto p-4 space-y-2">
          {filteredQuestions.map((q) => (
            <label
              key={q.id}
              className="flex items-start gap-3 p-2 rounded hover:bg-muted/50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedQuestions.includes(q.id)}
                onChange={() => toggleQuestion(q.id)}
              />
              <span className="text-sm line-clamp-2">{q.content}</span>
              <span className="text-xs text-muted-foreground shrink-0">{q.type}</span>
            </label>
          ))}
          {filteredQuestions.length === 0 && (
            <p className="text-muted-foreground text-sm">No questions for this subject.</p>
          )}
        </div>
      </div>
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading || selectedQuestions.length === 0}
        className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Creating..." : "Create Exam"}
      </button>
    </form>
  );
}
