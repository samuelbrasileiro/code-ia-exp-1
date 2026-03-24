import type { Exam, ExamVariant, Question } from "../../../packages/shared/src/types.js";
import { createId } from "../utils/id.js";

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function createVariant(exam: Exam, questions: Question[]): ExamVariant {
  const orderedQuestions = shuffle(questions);
  return {
    examId: exam.id,
    variantId: createId(),
    questions: orderedQuestions.map((question) => ({
      questionId: question.id,
      shuffledChoiceIds: shuffle(question.choices.map((choice) => choice.id))
    }))
  };
}
