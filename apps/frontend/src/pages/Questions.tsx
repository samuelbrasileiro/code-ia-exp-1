import { useMemo, useState } from "react";
import type { Question } from "@shared/types";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("");

    if (!form.prompt.trim()) {
      setStatus("Question prompt is required.");
      return;
    }

    if (choices.length < 2) {
      setStatus("Please provide at least two choices.");
      return;
    }

    const correctIndexes = form.choices
      .map((choice, index) => (choice.isCorrect ? index : -1))
      .filter((index) => index >= 0);

    if (correctIndexes.length === 0) {
      setStatus("Select at least one correct choice.");
      return;
    }

    if (correctIndexes.some((index) => index >= choices.length)) {
      setStatus("Remove empty choices or fill them in.");
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
  }

  function startEdit(question: Question) {
    const draftChoices = question.choices.map((choice, index) => ({
      id: `choice-${index + 1}`,
      text: choice.text,
      isCorrect: question.correctChoiceIds.includes(choice.id)
    }));

    setEditingId(question.id);
    setForm({
      prompt: question.prompt,
      tags: question.tags ?? [],
      tagInput: "",
      choices: draftChoices
    });
  }

  return (
    <div className="page">
      <PageHeader
        title="Questions"
        description="Create, edit, and manage your multiple-choice question bank."
      />

      {status ? <div className="status">{status}</div> : null}
      {error ? <div className="status">{error}</div> : null}

      <SectionCard title="Add or Edit Question">
        <form onSubmit={handleSubmit} className="form">
          <label>
            Prompt
            <textarea
              value={form.prompt}
              onChange={(event) => setForm((prev) => ({ ...prev, prompt: event.target.value }))}
              rows={3}
              required
            />
          </label>

          <div className="field-group">
            <div className="field-group-header">
              <div>
                <span className="field-label">Choices</span>
                <span className="field-hint">Mark all correct answers and remove extra rows.</span>
              </div>
              <button type="button" className="secondary" onClick={addChoice}>
                Add Choice
              </button>
            </div>
            <div className="choice-list">
              {form.choices.map((choice, index) => (
                <div className="choice-row" key={choice.id}>
                  <label className="choice-check">
                    <input
                      type="checkbox"
                      checked={choice.isCorrect}
                      onChange={(event) =>
                        updateChoice(choice.id, { isCorrect: event.target.checked })
                      }
                    />
                    <span>Correct</span>
                  </label>
                  <input
                    type="text"
                    value={choice.text}
                    onChange={(event) => updateChoice(choice.id, { text: event.target.value })}
                    placeholder={`Choice ${index + 1}`}
                  />
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => removeChoice(choice.id)}
                    aria-label="Remove choice"
                  >
                    ×
                  </button>
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
                Add Tag
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
            <button type="submit" className="primary">
              {editingId ? "Save Question" : "Add Question"}
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

      <SectionCard title="Question Bank">
        {loading ? <p className="muted">Loading...</p> : null}
        {questions.length === 0 && !loading ? <p className="muted">No questions yet.</p> : null}
        <div className="list">
          {questions.map((question) => {
            const correctIndexesSet = new Set(
              question.choices
                .map((choice, index) => (question.correctChoiceIds.includes(choice.id) ? index : -1))
                .filter((index) => index >= 0)
            );
            return (
              <div className="list-item" key={question.id}>
                <div>
                  <p className="title">{question.prompt}</p>
                  <ul>
                    {question.choices.map((choice, index) => (
                      <li key={choice.id}>
                        {correctIndexesSet.has(index) ? "✓ " : ""}
                        {choice.text}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="actions">
                  <button type="button" onClick={() => startEdit(question)}>
                    Edit
                  </button>
                  <button type="button" onClick={() => remove(question.id)}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
    </div>
  );
}
