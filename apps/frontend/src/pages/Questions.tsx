import { useMemo, useState } from "react";
import type { Question } from "@shared/types";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import useQuestions from "../hooks/useQuestions";

const emptyForm = {
  prompt: "",
  choicesText: "",
  correctIndex: 0,
  tagsText: ""
};

export default function Questions() {
  const { questions, loading, error, add, update, remove } = useQuestions();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("");

  const choices = useMemo(
    () =>
      form.choicesText
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0),
    [form.choicesText]
  );

  const tags = useMemo(
    () =>
      form.tagsText
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0),
    [form.tagsText]
  );

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
    if (form.correctIndex < 0 || form.correctIndex >= choices.length) {
      setStatus("Correct index is out of range.");
      return;
    }

    const payload = {
      prompt: form.prompt.trim(),
      choices,
      correctIndex: form.correctIndex,
      tags: tags.length > 0 ? tags : undefined
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
    const correctIndex = question.choices.findIndex(
      (choice) => choice.id === question.correctChoiceId
    );
    setEditingId(question.id);
    setForm({
      prompt: question.prompt,
      choicesText: question.choices.map((choice) => choice.text).join("\n"),
      correctIndex: correctIndex === -1 ? 0 : correctIndex,
      tagsText: (question.tags ?? []).join(", ")
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
          <label>
            Choices (one per line)
            <textarea
              value={form.choicesText}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, choicesText: event.target.value }))
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
              value={form.correctIndex}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, correctIndex: Number(event.target.value) }))
              }
            />
          </label>
          <label>
            Tags (comma separated)
            <input
              type="text"
              value={form.tagsText}
              onChange={(event) => setForm((prev) => ({ ...prev, tagsText: event.target.value }))}
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
