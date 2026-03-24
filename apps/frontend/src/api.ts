import type { Exam, ExamVariant, Question } from "@shared/types";

const BASE = "/api";

export async function fetchQuestions(): Promise<Question[]> {
  const res = await fetch(`${BASE}/questions`);
  if (!res.ok) {
    throw new Error("Failed to load questions");
  }
  return res.json();
}

export async function createQuestion(payload: {
  prompt: string;
  choices: string[];
  correctIndex: number;
  tags?: string[];
}): Promise<Question> {
  const res = await fetch(`${BASE}/questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error("Failed to create question");
  }
  return res.json();
}

export async function updateQuestion(
  id: string,
  payload: {
    prompt: string;
    choices: string[];
    correctIndex: number;
    tags?: string[];
  }
): Promise<Question> {
  const res = await fetch(`${BASE}/questions/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error("Failed to update question");
  }
  return res.json();
}

export async function deleteQuestion(id: string): Promise<void> {
  const res = await fetch(`${BASE}/questions/${id}`, { method: "DELETE" });
  if (!res.ok) {
    throw new Error("Failed to delete question");
  }
}

export async function fetchExams(): Promise<Exam[]> {
  const res = await fetch(`${BASE}/exams`);
  if (!res.ok) {
    throw new Error("Failed to load exams");
  }
  return res.json();
}

export async function createExam(payload: {
  title: string;
  questionIds: string[];
}): Promise<Exam> {
  const res = await fetch(`${BASE}/exams`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    throw new Error("Failed to create exam");
  }
  return res.json();
}

export async function createVariant(examId: string): Promise<ExamVariant> {
  const res = await fetch(`${BASE}/exams/${examId}/variant`, {
    method: "POST"
  });
  if (!res.ok) {
    throw new Error("Failed to create variant");
  }
  return res.json();
}

export async function downloadPdf(examId: string, variant: ExamVariant): Promise<Blob> {
  const res = await fetch(`${BASE}/exams/${examId}/pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ variant })
  });
  if (!res.ok) {
    throw new Error("Failed to generate PDF");
  }
  return res.blob();
}

export async function downloadAnswerKey(
  examId: string,
  variant: ExamVariant
): Promise<Blob> {
  const res = await fetch(`${BASE}/exams/${examId}/answer-key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ variant })
  });
  if (!res.ok) {
    throw new Error("Failed to generate answer key");
  }
  return res.blob();
}

export async function uploadCorrections(payload: {
  keyCsv: File;
  answersCsv: File;
}): Promise<{ examId: string; variantId: string; results: any[] }> {
  const formData = new FormData();
  formData.append("keyCsv", payload.keyCsv);
  formData.append("answersCsv", payload.answersCsv);

  const res = await fetch(`${BASE}/corrections`, {
    method: "POST",
    body: formData
  });
  if (!res.ok) {
    throw new Error("Failed to correct answers");
  }
  return res.json();
}
