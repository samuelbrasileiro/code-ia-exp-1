import { useMemo, useState } from "react";
import type { Exam } from "@shared/types";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import useExams from "../hooks/useExams";
import useQuestions from "../hooks/useQuestions";

type ExamFormState = {
  title: string;
  subject: string;
  teacher: string;
  date: string;
  answerLabelingMode: "letters" | "powersOfTwo";
  questionIds: string[];
};

const emptyForm: ExamFormState = {
  title: "",
  subject: "",
  teacher: "",
  date: "",
  answerLabelingMode: "letters",
  questionIds: []
};

export default function Exams() {
  const { exams, error: examError, add, update, remove } = useExams();
  const { questions, error: questionError } = useQuestions();
  const [form, setForm] = useState<ExamFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  const selected = useMemo(() => new Set(form.questionIds), [form.questionIds]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("");

    if (!form.title.trim()) {
      setStatus("Exam title is required.");
      return;
    }
    if (!form.subject.trim()) {
      setStatus("Subject is required.");
      return;
    }
    if (!form.teacher.trim()) {
      setStatus("Teacher is required.");
      return;
    }
    if (!form.date.trim()) {
      setStatus("Date is required.");
      return;
    }
    if (form.questionIds.length === 0) {
      setStatus("Select at least one question.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      subject: form.subject.trim(),
      teacher: form.teacher.trim(),
      date: form.date,
      answerLabelingMode: form.answerLabelingMode,
      questionIds: form.questionIds
    };

    if (editingId) {
      await update(editingId, payload);
    } else {
      await add(payload);
    }

    setForm(emptyForm);
    setEditingId(null);
  }

  function startEdit(exam: Exam) {
    setEditingId(exam.id);
    setForm({
      title: exam.title,
      subject: exam.subject,
      teacher: exam.teacher,
      date: exam.date,
      answerLabelingMode: exam.answerLabelingMode,
      questionIds: exam.questionIds
    });
  }

  function toggleQuestion(id: string, checked: boolean) {
    setForm((prev) => ({
      ...prev,
      questionIds: checked ? [...prev.questionIds, id] : prev.questionIds.filter((q) => q !== id)
    }));
  }

  return (
    <div className="page">
      <PageHeader
        title="Exams"
        description="Select questions to create and store reusable exams."
      />

      {status ? <div className="status">{status}</div> : null}
      {examError ? <div className="status">{examError}</div> : null}
      {questionError ? <div className="status">{questionError}</div> : null}

      <SectionCard title={editingId ? "Edit Exam" : "Create Exam"}>
        <form onSubmit={handleSubmit} className="form">
          <label>
            Exam Title
            <input
              type="text"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              required
            />
          </label>
          <label>
            Subject
            <input
              type="text"
              value={form.subject}
              onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
              required
            />
          </label>
          <label>
            Teacher
            <input
              type="text"
              value={form.teacher}
              onChange={(event) => setForm((prev) => ({ ...prev, teacher: event.target.value }))}
              required
            />
          </label>
          <label>
            Date
            <input
              type="date"
              value={form.date}
              onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
              required
            />
          </label>
          <label>
            Answer Labeling Mode
            <select
              value={form.answerLabelingMode}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  answerLabelingMode: event.target.value as "letters" | "powersOfTwo"
                }))
              }
            >
              <option value="letters">Letters (A, B, C)</option>
              <option value="powersOfTwo">Powers of Two (1, 2, 4)</option>
            </select>
          </label>

          <div className="checkbox-grid">
            {questions.map((question) => (
              <label key={question.id} className="checkbox">
                <input
                  type="checkbox"
                  checked={selected.has(question.id)}
                  onChange={(event) => toggleQuestion(question.id, event.target.checked)}
                />
                <span>{question.prompt}</span>
              </label>
            ))}
          </div>
          <div className="actions">
            <button type="submit" className="primary">
              {editingId ? "Save Exam" : "Create Exam"}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
              >
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Existing Exams">
        {exams.length === 0 ? <p className="muted">No exams yet.</p> : null}
        <div className="list">
          {exams.map((exam) => (
            <div key={exam.id} className="list-item">
              <div>
                <p className="title">{exam.title}</p>
                <p className="muted">
                  {exam.subject} • {exam.teacher} • {exam.date}
                </p>
                <p className="muted">Questions: {exam.questionIds.length}</p>
                <p className="muted">
                  Labels: {exam.answerLabelingMode === "letters" ? "Letters" : "Powers of Two"}
                </p>
              </div>
              <div className="actions">
                <button type="button" onClick={() => startEdit(exam)}>
                  Edit
                </button>
                <button type="button" onClick={() => remove(exam.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
