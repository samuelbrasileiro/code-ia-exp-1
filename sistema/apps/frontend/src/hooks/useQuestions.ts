import { useCallback, useEffect, useState } from "react";
import type { Question } from "@shared/types";
import { createQuestion, deleteQuestion, fetchQuestions, updateQuestion } from "../api";

type QuestionPayload = {
  prompt: string;
  choices: string[];
  correctIndexes: number[];
  tags?: string[];
};

export default function useQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchQuestions();
      setQuestions(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const add = useCallback(
    async (payload: QuestionPayload) => {
      await createQuestion(payload);
      await reload();
    },
    [reload]
  );

  const update = useCallback(
    async (id: string, payload: QuestionPayload) => {
      await updateQuestion(id, payload);
      await reload();
    },
    [reload]
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteQuestion(id);
      await reload();
    },
    [reload]
  );

  return { questions, loading, error, reload, add, update, remove };
}
