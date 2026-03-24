import { useMemo, useState } from "react";
import type { Question } from "@shared/types";
import PageHeader from "../components/PageHeader";
import useQuestions from "../hooks/useQuestions";

type ChoiceDraft = {
  id: string;
  text: string;
  isCorrect: boolean;
};

const emptyForm = {
  prompt: "",
  tags: [] as string[],
  tagInput: "",
  choices: [
    { id: "choice-1", text: "", isCorrect: false },
    { id: "choice-2", text: "", isCorrect: false }
  ] as ChoiceDraft[]
};

function createChoice(id: string): ChoiceDraft {
  return { id, text: "", isCorrect: false };
}

export default function Questions() {
  const { questions, loading, error, add, update, remove } = useQuestions();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [status, setStatus] = useState<string>("");

  const choices = useMemo(
    () => form.choices.map((choice) => choice.text.trim()).filter((text) => text.length > 0),
    [form.choices]
  );

  function updateChoice(id: string, patch: Partial<ChoiceDraft>) {
    setForm((prev) => ({
      ...prev,
      choices: prev.choices.map((choice) =>
        choice.id === id ? { ...choice, ...patch } : choice
      )
    }));
  }

  function addChoice() {
    setForm((prev) => ({
      ...prev,
      choices: [...prev.choices, createChoice(`choice-${prev.choices.length + 1}`)]
    }));
  }

  function removeChoice(id: string) {
    if (form.choices.length <= 2) {
      setStatus("There must be at least 2 choices.");
      return;
    }
    setForm((prev) => ({
      ...prev,
      choices: prev.choices.filter((choice) => choice.id !== id)
    }));
  }

  function addTag() {
    const value = form.tagInput.trim();
    if (!value) {
      return;
    }
    if (form.tags.includes(value)) {
      setForm((prev) => ({ ...prev, tagInput: "" }));
      return;
    }
    setForm((prev) => ({ ...prev, tags: [...prev.tags, value], tagInput: "" }));
  }

  function removeTag(tag: string) {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((item) => item !== tag) }));
  }

  async function handleSubmit() {
    setStatus("");

    if (!form.prompt.trim()) {
      setStatus("Question prompt is required.");
      return;
    }

    if (choices.length < 2) {
      setStatus("There must be at least two choices.");
      return;
    }

    const correctIndexes = form.choices
      .map((choice, index) => (choice.isCorrect ? index : -1))
      .filter((index) => index >= 0);

    if (correctIndexes.length === 0) {
      setStatus("At least one choice must be correct.");
      return;
    }

    if (correctIndexes.some((index) => index >= choices.length)) {
      setStatus("Remove empty choices or fill all fields.");
      return;
    }

    const payload = {
      prompt: form.prompt.trim(),
      choices: form.choices.map((choice) => choice.text.trim()).filter((text) => text.length > 0),
      correctIndexes,
      tags: form.tags.length > 0 ? form.tags : undefined
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

  function startEdit(question: Question) {
    const draftChoices = question.choices.map((choice, index) => ({
      id: `choice-${index + 1}`,
      text: choice.text,
      isCorrect: question.correctChoiceIds.includes(choice.id)
    }));

    setEditingId(question.id);
    setIsCreating(false);
    setForm({
      prompt: question.prompt,
      tags: question.tags ?? [],
      tagInput: "",
      choices: draftChoices
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setIsCreating(false);
    setForm(emptyForm);
  }

  if (loading) {
    return (
      <div className="panel empty">
        <p>Loading questions...</p>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header-row">
        <PageHeader
          title="Manage Questions"
          description="Create and edit questions with correct choices."
        />
        {!isCreating && (
          <button type="button" className="primary cta" onClick={startCreating}>
            <span className="icon-inline">+</span>
            New Question
          </button>
        )}
      </div>

      {status ? <div className="status">{status}</div> : null}
      {error ? <div className="status">{error}</div> : null}

      {isCreating ? (
        <div className="panel panel-highlight">
          <h2>New Question</h2>
          <QuestionForm
            form={form}
            setForm={setForm}
            onSave={handleSubmit}
            onCancel={cancelEdit}
            addChoice={addChoice}
            removeChoice={removeChoice}
            updateChoice={updateChoice}
            addTag={addTag}
            removeTag={removeTag}
          />
        </div>
      ) : null}

      <div className="stack">
        {questions.map((question) => {
          const correctIndexesSet = new Set(
            question.choices
              .map((choice, index) => (question.correctChoiceIds.includes(choice.id) ? index : -1))
              .filter((index) => index >= 0)
          );
          return (
            <div key={question.id} className="panel">
              {editingId === question.id ? (
                <QuestionForm
                  form={form}
                  setForm={setForm}
                  onSave={handleSubmit}
                  onCancel={cancelEdit}
                  addChoice={addChoice}
                  removeChoice={removeChoice}
                  updateChoice={updateChoice}
                  addTag={addTag}
                  removeTag={removeTag}
                />
              ) : (
                <div>
                  <div className="panel-header">
                    <p className="title">{question.prompt}</p>
                    <div className="panel-actions">
                      <button type="button" className="icon-btn" onClick={() => startEdit(question)}>
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="icon-btn danger"
                        onClick={() => remove(question.id)}
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
                  <div className="alt-list">
                    {question.choices.map((choice, index) => (
                      <div
                        key={choice.id}
                        className={correctIndexesSet.has(index) ? "alt-row alt-correct" : "alt-row"}
                      >
                        <span className="alt-label">{String.fromCharCode(65 + index)})</span>
                        <span>{choice.text}</span>
                        {correctIndexesSet.has(index) ? (
                          <span className="alt-tag">✓ Correct</span>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {questions.length === 0 && !isCreating ? (
          <div className="panel empty">
            <p>No questions yet</p>
            <button type="button" className="primary" onClick={startCreating}>
              Create first question
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

type QuestionFormProps = {
  form: typeof emptyForm;
  setForm: React.Dispatch<React.SetStateAction<typeof emptyForm>>;
  onSave: () => void;
  onCancel: () => void;
  addChoice: () => void;
  removeChoice: (id: string) => void;
  updateChoice: (id: string, patch: Partial<ChoiceDraft>) => void;
  addTag: () => void;
  removeTag: (tag: string) => void;
};

function QuestionForm({
  form,
  setForm,
  onSave,
  onCancel,
  addChoice,
  removeChoice,
  updateChoice,
  addTag,
  removeTag
}: QuestionFormProps) {
  return (
    <div>
      <div className="form-grid">
        <label className="form-span">
          Question Prompt
          <textarea
            value={form.prompt}
            onChange={(event) => setForm((prev) => ({ ...prev, prompt: event.target.value }))}
            rows={3}
            placeholder="Type the question prompt..."
          />
        </label>
      </div>

      <div className="field-group">
        <div className="field-group-header">
          <div>
            <span className="field-label">Choices</span>
            <span className="field-hint">Mark all correct answers.</span>
          </div>
          <button type="button" className="text-button" onClick={addChoice}>
            + Add
          </button>
        </div>

        <div className="alt-form-list">
          {form.choices.map((choice, index) => (
            <div key={choice.id} className="alt-form-row">
              <span className="alt-label">{String.fromCharCode(65 + index)})</span>
              <input
                type="text"
                value={choice.text}
                onChange={(event) => updateChoice(choice.id, { text: event.target.value })}
                placeholder="Choice description..."
              />
              <label className="choice-check">
                <input
                  type="checkbox"
                  checked={choice.isCorrect}
                  onChange={(event) => updateChoice(choice.id, { isCorrect: event.target.checked })}
                />
                <span>Correct</span>
              </label>
              {form.choices.length > 2 ? (
                <button
                  type="button"
                  className="icon-btn danger"
                  onClick={() => removeChoice(choice.id)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M3 6h18" />
                    <path d="M8 6V4h8v2" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                  </svg>
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="field-group">
        <div className="field-group-header">
          <div>
            <span className="field-label">Tags</span>
            <span className="field-hint">Add one tag at a time.</span>
          </div>
        </div>
        <div className="tag-input-row">
          <input
            type="text"
            value={form.tagInput}
            onChange={(event) => setForm((prev) => ({ ...prev, tagInput: event.target.value }))}
            placeholder="Add a tag"
          />
          <button type="button" className="secondary" onClick={addTag}>
            Add
          </button>
        </div>
        {form.tags.length > 0 ? (
          <div className="tag-list">
            {form.tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
                <button type="button" onClick={() => removeTag(tag)} aria-label="Remove tag">
                  ×
                </button>
              </span>
            ))}
          </div>
        ) : null}
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
