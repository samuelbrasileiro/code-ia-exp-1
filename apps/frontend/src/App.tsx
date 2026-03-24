import { useEffect, useMemo, useState } from "react";
import type { Exam, ExamVariant, Question } from "@shared/types";
import {
  createExam,
  createQuestion,
  createVariant,
  deleteQuestion,
  downloadAnswerKey,
  downloadPdf,
  fetchExams,
  fetchQuestions,
  updateQuestion,
  uploadCorrections
} from "./api";

const emptyQuestionForm = {
  prompt: "",
  choicesText: "",
  correctIndex: 0,
  tagsText: ""
};

type CorrectionResult = {
  examId: string;
  variantId: string;
  results: {
    studentId: string;
    score: number;
    details: { questionId: string; isCorrect: boolean }[];
  }[];
};

export default function App() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [variants, setVariants] = useState<Record<string, ExamVariant>>({});
  const [status, setStatus] = useState<string>("");
  const [questionForm, setQuestionForm] = useState(emptyQuestionForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [examTitle, setExamTitle] = useState("");
  const [keyCsv, setKeyCsv] = useState<File | null>(null);
  const [answersCsv, setAnswersCsv] = useState<File | null>(null);
  const [correctionResult, setCorrectionResult] = useState<CorrectionResult | null>(null);

  const choices = useMemo(
    () =>
      questionForm.choicesText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0),
    [questionForm.choicesText]
  );

  const tags = useMemo(
    () =>
      questionForm.tagsText
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0),
    [questionForm.tagsText]
  );

  async function loadAll() {
    try {
      const [q, e] = await Promise.all([fetchQuestions(), fetchExams()]);
      setQuestions(q);
      setExams(e);
    } catch (err) {
      setStatus((err as Error).message);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleQuestionSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      setStatus("");
      if (choices.length < 2) {
        setStatus("Please provide at least two choices.");
        return;
      }
      if (questionForm.correctIndex < 0 || questionForm.correctIndex >= choices.length) {
        setStatus("Correct index is out of range.");
        return;
      }
      const payload = {
        prompt: questionForm.prompt.trim(),
        choices,
        correctIndex: questionForm.correctIndex,
        tags: tags.length > 0 ? tags : undefined
      };
      if (!payload.prompt) {
        setStatus("Question prompt is required.");
        return;
      }

      if (editingId) {
        await updateQuestion(editingId, payload);
      } else {
        await createQuestion(payload);
      }
      setQuestionForm(emptyQuestionForm);
      setEditingId(null);
      await loadAll();
    } catch (err) {
      setStatus((err as Error).message);
    }
  }

  function startEdit(question: Question) {
    const correctIndex = question.choices.findIndex(
      (choice) => choice.id === question.correctChoiceId
    );
    setEditingId(question.id);
    setQuestionForm({
      prompt: question.prompt,
      choicesText: question.choices.map((c) => c.text).join("\n"),
      correctIndex: correctIndex === -1 ? 0 : correctIndex,
      tagsText: (question.tags ?? []).join(", ")
    });
  }

  async function handleDeleteQuestion(id: string) {
    try {
      setStatus("");
      await deleteQuestion(id);
      await loadAll();
    } catch (err) {
      setStatus((err as Error).message);
    }
  }

  async function handleCreateExam(event: React.FormEvent) {
    event.preventDefault();
    try {
      setStatus("");
      if (!examTitle.trim()) {
        setStatus("Exam title is required.");
        return;
      }
      if (selectedQuestionIds.length === 0) {
        setStatus("Select at least one question.");
        return;
      }
      await createExam({ title: examTitle.trim(), questionIds: selectedQuestionIds });
      setExamTitle("");
      setSelectedQuestionIds([]);
      await loadAll();
    } catch (err) {
      setStatus((err as Error).message);
    }
  }

  async function handleCreateVariant(exam: Exam) {
    try {
      setStatus("");
      const variant = await createVariant(exam.id);
      setVariants((prev) => ({ ...prev, [exam.id]: variant }));
    } catch (err) {
      setStatus((err as Error).message);
    }
  }

  async function handleDownloadPdf(exam: Exam) {
    try {
      setStatus("");
      const variant = variants[exam.id];
      if (!variant) {
        setStatus("Create a variant first.");
        return;
      }
      const blob = await downloadPdf(exam.id, variant);
      triggerDownload(blob, `exam-${exam.id}-${variant.variantId}.pdf`);
    } catch (err) {
      setStatus((err as Error).message);
    }
  }

  async function handleDownloadKey(exam: Exam) {
    try {
      setStatus("");
      const variant = variants[exam.id];
      if (!variant) {
        setStatus("Create a variant first.");
        return;
      }
      const blob = await downloadAnswerKey(exam.id, variant);
      triggerDownload(blob, `answer-key-${exam.id}-${variant.variantId}.csv`);
    } catch (err) {
      setStatus((err as Error).message);
    }
  }

  async function handleCorrectionSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!keyCsv || !answersCsv) {
      setStatus("Select both CSV files.");
      return;
    }
    try {
      setStatus("");
      const result = await uploadCorrections({ keyCsv, answersCsv });
      setCorrectionResult(result);
    } catch (err) {
      setStatus((err as Error).message);
    }
  }

  return (
    <div className="page">
      <header className="hero">
        <div>
          <p className="eyebrow">Exam Builder</p>
          <h1>Create, randomize, and correct multiple-choice exams.</h1>
          <p className="sub">
            Simple workflow: build questions, assemble an exam, generate a randomized PDF,
            export the answer key CSV, and correct student answers with one upload.
          </p>
        </div>
      </header>

      {status ? <div className="status">{status}</div> : null}

      <section className="card">
        <h2>1) Question Management</h2>
        <form onSubmit={handleQuestionSubmit} className="form">
          <label>
            Prompt
            <textarea
              value={questionForm.prompt}
              onChange={(event) =>
                setQuestionForm((prev) => ({ ...prev, prompt: event.target.value }))
              }
              rows={3}
              required
            />
          </label>

          <label>
            Choices (one per line)
            <textarea
              value={questionForm.choicesText}
              onChange={(event) =>
                setQuestionForm((prev) => ({ ...prev, choicesText: event.target.value }))
              }
              rows={4}
              required
            />
          </label>

          <label>
            Correct Choice Index (starts at 0)
            <input
              type="number"
              min={0}
              value={questionForm.correctIndex}
              onChange={(event) =>
                setQuestionForm((prev) => ({
                  ...prev,
                  correctIndex: Number(event.target.value)
                }))
              }
            />
          </label>

          <label>
            Tags (comma separated)
            <input
              type="text"
              value={questionForm.tagsText}
              onChange={(event) =>
                setQuestionForm((prev) => ({ ...prev, tagsText: event.target.value }))
              }
            />
          </label>

          <div className="actions">
            <button type="submit" className="primary">
              {editingId ? "Save Question" : "Add Question"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setQuestionForm(emptyQuestionForm);
                }}
              >
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>

        <div className="list">
          {questions.length === 0 ? (
            <p className="muted">No questions yet.</p>
          ) : (
            questions.map((question) => {
              const correctIndex = question.choices.findIndex(
                (choice) => choice.id === question.correctChoiceId
              );
              return (
                <div className="list-item" key={question.id}>
                  <div>
                    <p className="title">{question.prompt}</p>
                    <ul>
                      {question.choices.map((choice, index) => (
                        <li key={choice.id}>
                          {index === correctIndex ? "✓ " : ""}
                          {choice.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="actions">
                    <button type="button" onClick={() => startEdit(question)}>
                      Edit
                    </button>
                    <button type="button" onClick={() => handleDeleteQuestion(question.id)}>
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="card">
        <h2>2) Exam Creation</h2>
        <form onSubmit={handleCreateExam} className="form">
          <label>
            Exam Title
            <input
              type="text"
              value={examTitle}
              onChange={(event) => setExamTitle(event.target.value)}
              required
            />
          </label>

          <div className="checkbox-grid">
            {questions.map((question) => (
              <label key={question.id} className="checkbox">
                <input
                  type="checkbox"
                  checked={selectedQuestionIds.includes(question.id)}
                  onChange={(event) => {
                    setSelectedQuestionIds((prev) =>
                      event.target.checked
                        ? [...prev, question.id]
                        : prev.filter((id) => id !== question.id)
                    );
                  }}
                />
                <span>{question.prompt}</span>
              </label>
            ))}
          </div>

          <button type="submit" className="primary">
            Create Exam
          </button>
        </form>

        <div className="list">
          {exams.length === 0 ? (
            <p className="muted">No exams yet.</p>
          ) : (
            exams.map((exam) => (
              <div key={exam.id} className="list-item">
                <div>
                  <p className="title">{exam.title}</p>
                  <p className="muted">Questions: {exam.questionIds.length}</p>
                  {variants[exam.id] ? (
                    <p className="muted">Variant: {variants[exam.id].variantId}</p>
                  ) : null}
                </div>
                <div className="actions">
                  <button type="button" onClick={() => handleCreateVariant(exam)}>
                    Create Variant
                  </button>
                  <button type="button" onClick={() => handleDownloadPdf(exam)}>
                    Download PDF
                  </button>
                  <button type="button" onClick={() => handleDownloadKey(exam)}>
                    Export Answer Key CSV
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="card">
        <h2>3) Correction</h2>
        <p className="muted">
          CSV formats:
          <br />- Answer key: <code>examId,variantId,questionId,correctChoiceId</code>
          <br />- Student answers: <code>studentId,questionId,selectedChoiceId</code>
        </p>

        <form onSubmit={handleCorrectionSubmit} className="form">
          <label>
            Answer Key CSV
            <input
              type="file"
              accept=".csv"
              onChange={(event) => setKeyCsv(event.target.files?.[0] ?? null)}
            />
          </label>
          <label>
            Student Answers CSV
            <input
              type="file"
              accept=".csv"
              onChange={(event) => setAnswersCsv(event.target.files?.[0] ?? null)}
            />
          </label>
          <button type="submit" className="primary">
            Upload & Correct
          </button>
        </form>

        {correctionResult ? (
          <div className="list">
            {correctionResult.results.map((result) => (
              <div key={result.studentId} className="list-item">
                <div>
                  <p className="title">Student: {result.studentId}</p>
                  <p className="muted">Score: {result.score}</p>
                </div>
                <div className="muted">
                  {result.details.map((detail) => (
                    <span key={detail.questionId} className={detail.isCorrect ? "ok" : "bad"}>
                      {detail.questionId}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
