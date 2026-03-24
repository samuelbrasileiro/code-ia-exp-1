import { useState } from "react";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import { uploadCorrections } from "../api";

type CorrectionResponse = {
  examId: string;
  variantId: string;
  results: {
    studentId: string;
    score: number;
    details: { questionId: string; isCorrect: boolean }[];
  }[];
};

export default function Correction() {
  const [keyCsv, setKeyCsv] = useState<File | null>(null);
  const [answersCsv, setAnswersCsv] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<CorrectionResponse | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!keyCsv || !answersCsv) {
      setStatus("Select both CSV files.");
      return;
    }
    setStatus("");
    const response = await uploadCorrections({ keyCsv, answersCsv });
    setResult(response);
  }

  return (
    <div className="page">
      <PageHeader
        title="Correction"
        description="Upload the answer key and student answers CSVs to calculate scores."
      />

      {status ? <div className="status">{status}</div> : null}

      <SectionCard title="Upload CSVs">
        <p className="muted">
          CSV formats:
          <br />- Answer key: <code>examId,variantId,questionId,correctChoiceId</code>
          <br />- Student answers: <code>studentId,questionId,selectedChoiceId</code>
        </p>
        <form onSubmit={handleSubmit} className="form">
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
      </SectionCard>

      {result ? (
        <SectionCard title="Results">
          <div className="list">
            {result.results.map((item) => (
              <div key={item.studentId} className="list-item">
                <div>
                  <p className="title">Student: {item.studentId}</p>
                  <p className="muted">Score: {item.score}</p>
                </div>
                <div className="muted">
                  {item.details.map((detail) => (
                    <span key={detail.questionId} className={detail.isCorrect ? "ok" : "bad"}>
                      {detail.questionId}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      ) : null}
    </div>
  );
}
