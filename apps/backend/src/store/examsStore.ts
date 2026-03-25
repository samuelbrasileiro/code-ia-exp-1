import type { AnswerLabelingMode, Exam } from "@exam/shared";
import { readJson, writeJson } from "./fileStore.js";

const FILE = "exams.json";

type LegacyExam = Exam & {
  subject?: string;
  teacher?: string;
  date?: string;
  answerLabelingMode?: AnswerLabelingMode;
};

export async function getExams(): Promise<Exam[]> {
  const data = await readJson<LegacyExam[]>(FILE, []);
  return data.map((exam) => ({
    ...exam,
    subject: exam.subject ?? "",
    teacher: exam.teacher ?? "",
    date: exam.date ?? "",
    answerLabelingMode: exam.answerLabelingMode ?? "letters"
  }));
}

export async function saveExams(exams: Exam[]): Promise<void> {
  await writeJson(FILE, exams);
}
