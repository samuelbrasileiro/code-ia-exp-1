import { useState } from "react";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import useExams from "../hooks/useExams";
import useQuestions from "../hooks/useQuestions";

export default function Exams() {
  const { exams, error: examError, add } = useExams();
  const { questions, error: questionError } = useQuestions();
  const [title, setTitle] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [status, setStatus] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("");

    if (!title.trim()) {
      setStatus("Exam title is required.");
      return;
    }
    if (selected.length === 0) {
      setStatus("Select at least one question.");
      return;
    }

    await add({ title: title.trim(), questionIds: selected });
    setTitle("");
    setSelected([]);
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

      <SectionCard title="Create Exam">
        <form onSubmit={handleSubmit} className="form">
          <label>
            Exam Title
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
            />
          </label>
          <div className="checkbox-grid">
            {questions.map((question) => (
              <label key={question.id} className="checkbox">
                <input
                  type="checkbox"
                  checked={selected.includes(question.id)}
                  onChange={(event) => {
                    setSelected((prev) =>
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
      </SectionCard>

      <SectionCard title="Existing Exams">
        {exams.length === 0 ? <p className="muted">No exams yet.</p> : null}
        <div className="list">
          {exams.map((exam) => (
            <div key={exam.id} className="list-item">
              <div>
                <p className="title">{exam.title}</p>
                <p className="muted">Questions: {exam.questionIds.length}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
