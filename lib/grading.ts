import type { QuestionType } from "@/lib/types";

interface MCOption {
  id: string;
  text: string;
  correct?: boolean;
}

export function gradeObjectiveAnswer(
  questionType: QuestionType,
  correctAnswer: string | null,
  options: unknown,
  studentAnswer: string
): { score: number; maxScore: number } {
  const trimmed = studentAnswer?.toString().trim() ?? "";

  switch (questionType) {
    case "MULTIPLE_CHOICE": {
      const opts = (options as MCOption[]) ?? [];
      const correct = opts.find((o) => o.correct);
      const maxScore = 1;
      const score = correct && trimmed === correct.id ? 1 : 0;
      return { score, maxScore };
    }
    case "TRUE_FALSE": {
      const opts = (options as MCOption[]) ?? [];
      const correct = opts.find((o) => o.correct);
      const maxScore = 1;
      const score =
        correct &&
        (trimmed.toLowerCase() === "true" ||
          trimmed === "t" ||
          trimmed === correct.id)
          ? 1
          : 0;
      return { score, maxScore };
    }
    case "IDENTIFICATION":
    case "SHORT_ANSWER": {
      if (!correctAnswer) return { score: 0, maxScore: 1 };
      const expected = correctAnswer.toString().trim().toLowerCase();
      const given = trimmed.toLowerCase();
      const maxScore = 1;
      const score = expected === given ? 1 : 0;
      return { score, maxScore };
    }
    case "ESSAY":
      return { score: 0, maxScore: 1 }; // Manual grading required
    default:
      return { score: 0, maxScore: 1 };
  }
}
