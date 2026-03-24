import { useCallback, useEffect, useState } from "react";
import type { Exam } from "@shared/types";
import { createExam, fetchExams } from "../api";

type ExamPayload = {
  title: string;
  questionIds: string[];
};

export default function useExams() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchExams();
      setExams(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const add = useCallback(async (payload: ExamPayload) => {
    await createExam(payload);
    await reload();
  }, [reload]);

  return { exams, loading, error, reload, add };
}
