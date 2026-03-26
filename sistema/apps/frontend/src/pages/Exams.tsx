import { useMemo, useState } from "react";
import type { Exam, Question } from "@shared/types";
import PageHeader from "../components/PageHeader";
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

function formatDate(value: string): string {
  if (!value) {
    return "";
  }
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) {
    return value;
  }
  return `${day}/${month}/${year}`;
}

function getQuestionPreview(question: Question | undefined): string {
  if (!question) {
    return "Questão não encontrada";
  }
  return question.prompt.length > 80 ? `${question.prompt.slice(0, 80)}…` : question.prompt;
}

export default function Exams() {
  const { exams, error: examError, add, update, remove } = useExams();
  const { questions, error: questionError } = useQuestions();
  const [form, setForm] = useState<ExamFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [status, setStatus] = useState("");

  const selected = useMemo(() => new Set(form.questionIds), [form.questionIds]);
  const questionMap = useMemo(
    () => new Map(questions.map((question) => [question.id, question])),
    [questions]
  );

  async function handleSubmit() {
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
    setIsCreating(false);
  }

  function startCreating() {
    setIsCreating(true);
    setEditingId(null);
    setForm(emptyForm);
  }

  function startEdit(exam: Exam) {
    setEditingId(exam.id);
    setIsCreating(false);
    setForm({
      title: exam.title,
      subject: exam.subject,
      teacher: exam.teacher,
      date: exam.date,
      answerLabelingMode: exam.answerLabelingMode,
      questionIds: exam.questionIds
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setIsCreating(false);
    setForm(emptyForm);
  }

  function toggleQuestion(id: string, checked: boolean) {
    setForm((prev) => ({
      ...prev,
      questionIds: checked ? [...prev.questionIds, id] : prev.questionIds.filter((q) => q !== id)
    }));
  }

  return (
    <div className="page">
      <div className="page-header-row">
        <PageHeader
          title="Manage Exams"
          description="Create, edit, and organize exams with complete details."
        />
        {!isCreating && (
          <button type="button" className="primary cta" onClick={startCreating}>
            <span className="icon-inline">+</span>
            New Exam
          </button>
        )}
      </div>

      {status ? <div className="status">{status}</div> : null}
      {examError ? <div className="status">{examError}</div> : null}
      {questionError ? <div className="status">{questionError}</div> : null}

      {isCreating ? (
        <div className="panel panel-highlight">
          <h2>New Exam</h2>
          <ExamForm
            form={form}
            setForm={setForm}
            selected={selected}
            questions={questions}
            onToggleQuestion={toggleQuestion}
            onCancel={cancelEdit}
            onSave={handleSubmit}
          />
        </div>
      ) : null}

      <div className="stack">
        {exams.map((exam) => (
          <div key={exam.id} className="panel">
            {editingId === exam.id ? (
              <ExamForm
                form={form}
                setForm={setForm}
                selected={selected}
                questions={questions}
                onToggleQuestion={toggleQuestion}
                onCancel={cancelEdit}
                onSave={handleSubmit}
              />
            ) : (
              <div>
                <div className="panel-header">
                  <div>
                    <h3>{exam.title}</h3>
                    <div className="panel-meta">
                      <span>
                        <strong>Subject:</strong> {exam.subject}
                      </span>
                      <span>
                        <strong>Teacher:</strong> {exam.teacher}
                      </span>
                      <span>
                        <strong>Date:</strong> {formatDate(exam.date)}
                      </span>
                      <span>
                        <strong>Format:</strong>{" "}
                        {exam.answerLabelingMode === "letters" ? "Letters" : "Powers of Two"}
                      </span>
                    </div>
                  </div>
                  <div className="panel-actions">
                    <button type="button" className="icon-btn" onClick={() => startEdit(exam)}>
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      className="icon-btn danger"
                      onClick={() => remove(exam.id)}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M3 6h18" />
                        <path d="M8 6V4h8v2" />
                        <path d="M19 6l-1 14H6L5 6" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="divider" />
                <div className="panel-questions">
                  <p>
                    <strong>Questions ({exam.questionIds.length}):</strong>
                  </p>
                  <div className="question-preview">
                    {exam.questionIds.map((id, index) => (
                      <div key={id} className="preview-item">
                        <span className="pill-number">{index + 1}</span>
                        <span>{getQuestionPreview(questionMap.get(id))}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {exams.length === 0 && !isCreating ? (
          <div className="panel empty">
            <p>No exams yet</p>
            <button type="button" className="primary" onClick={startCreating}>
              Create first exam
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

type ExamFormProps = {
  form: ExamFormState;
  setForm: React.Dispatch<React.SetStateAction<ExamFormState>>;
  selected: Set<string>;
  questions: Question[];
  onToggleQuestion: (id: string, checked: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
};

function ExamForm({
  form,
  setForm,
  selected,
  questions,
  onToggleQuestion,
  onSave,
  onCancel
}: ExamFormProps) {
  return (
    <div>
      <div className="form-grid">
        <label>
          Exam Title
          <input
            type="text"
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="e.g. Midterm Exam"
          />
        </label>
        <label>
          Subject
          <input
            type="text"
            value={form.subject}
            onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
            placeholder="Mathematics"
          />
        </label>
        <label>
          Teacher
          <input
            type="text"
            value={form.teacher}
            onChange={(event) => setForm((prev) => ({ ...prev, teacher: event.target.value }))}
            placeholder="Teacher name"
          />
        </label>
        <label>
          Date
          <input
            type="date"
            value={form.date}
            onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
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
      </div>

      <div className="field-group">
        <div className="field-group-header">
          <div>
            <span className="field-label">Questions</span>
            <span className="field-hint">Select the questions for this exam.</span>
          </div>
        </div>
        <div className="checkbox-grid">
          {questions.map((question) => (
            <label key={question.id} className="checkbox">
              <input
                type="checkbox"
                checked={selected.has(question.id)}
                onChange={(event) => onToggleQuestion(question.id, event.target.checked)}
              />
              <span>{question.prompt}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="actions">
        <button type="button" className="secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="button" className="primary" onClick={onSave}>
          Save
        </button>
      </div>
    </div>
  );
}
