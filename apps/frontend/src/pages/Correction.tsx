import { useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import { uploadCorrections } from "../api";

type CorrectionResponse = {
  results: {
    examNumber: string;
    studentId: string;
    score: number;
    details: {
      questionId: string;
      isCorrect: boolean;
      selectedChoiceIds: string[];
      pointsAwarded?: number;
    }[];
  }[];
};

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function Correction() {
  const [keyCsv, setKeyCsv] = useState<File | null>(null);
  const [answersCsv, setAnswersCsv] = useState<File | null>(null);
  const [answerFormat, setAnswerFormat] = useState<"letters" | "powers">("letters");
  const [mode, setMode] = useState<"strict" | "lenient">("strict");
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<CorrectionResponse | null>(null);
  const [processing, setProcessing] = useState(false);

  const stats = useMemo(() => {
    if (!result || result.results.length === 0) {
      return null;
    }
    const percentages = result.results.map((item) => {
      const maxScore = item.details.length;
      return maxScore === 0 ? 0 : (item.score / maxScore) * 100;
    });
    const avg =
      percentages.reduce((total, value) => total + value, 0) / percentages.length;
    const approved = percentages.filter((value) => value >= 70).length;
    const failed = percentages.filter((value) => value < 70).length;
    return { avg, approved, failed };
  }, [result]);

  async function handleSubmit() {
    if (!keyCsv || !answersCsv) {
      setStatus("Select both CSV files.");
      return;
    }
    setStatus("");
    setProcessing(true);
    try {
      const response = await uploadCorrections({ keyCsv, answersCsv, mode });
      setResult(response);
      setStatus(`${response.results.length} exams corrected successfully.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to correct exams.";
      setResult(null);
      setStatus(message);
    } finally {
      setProcessing(false);
    }
  }

  function downloadReport() {
    if (!result || result.results.length === 0) {
      setStatus("No results to export.");
      return;
    }
    const lines = ["cpf,exam-id,score,maxScore,percentage"];
    result.results.forEach((item) => {
      const maxScore = item.details.length;
      const percentage = maxScore === 0 ? 0 : (item.score / maxScore) * 100;
      lines.push(
        [
          item.studentId,
          item.examNumber,
          item.score.toFixed(2),
          maxScore,
          percentage.toFixed(2)
        ].join(",")
      );
    });
    downloadCsv(`${lines.join("\n")}\n`, "relatorio_notas.csv");
    setStatus("Report exported successfully.");
  }

  return (
    <div className="page grade-page">
      <PageHeader
        title="Grade Exams"
        description="Upload the answer key and student answers for automatic grading."
      />

      {status ? <div className="status">{status}</div> : null}

      <div className="grade-grid">
        <div className="grade-panel">
          <div>
            <h2 className="grade-panel-title">Configuration</h2>
            <div className="grade-stack">
              <div>
                <label className="grade-label">Answer Format</label>
                <div className="grade-radio-group">
                  <label className="grade-radio">
                    <input
                      type="radio"
                      checked={answerFormat === "letters"}
                      onChange={() => setAnswerFormat("letters")}
                    />
                    <span>Letters (A, B, C)</span>
                  </label>
                  <label className="grade-radio">
                    <input
                      type="radio"
                      checked={answerFormat === "powers"}
                      onChange={() => setAnswerFormat("powers")}
                    />
                    <span>Powers of Two (use sum)</span>
                  </label>
                </div>
                <p className="grade-help">
                  The answer key is exported in the correct format. For powers of two, use the
                  numeric sum.
                </p>
              </div>

              <div>
                <label className="grade-label">Grading Mode</label>
                <div className="grade-radio-group">
                  <label className="grade-radio">
                    <input
                      type="radio"
                      checked={mode === "strict"}
                      onChange={() => setMode("strict")}
                    />
                    <span>
                      <strong>Strict</strong>
                      <span className="grade-subtext">Incorrect answers earn zero points.</span>
                    </span>
                  </label>
                  <label className="grade-radio">
                    <input
                      type="radio"
                      checked={mode === "lenient"}
                      onChange={() => setMode("lenient")}
                    />
                    <span>
                      <strong>Proportional</strong>
                      <span className="grade-subtext">Partial credit based on overlap.</span>
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="grade-divider">
            <h3 className="grade-section-title">Student CSV Format</h3>
            <div className="grade-list">
              <p>Required columns:</p>
              <ul>
                <li>exam-id</li>
                <li>cpf</li>
                <li>question1-answer, question2-answer, ...</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="grade-panel">
          <div className="grade-stack">
            <div>
              <label className="grade-label">1. Answer Key File (CSV)</label>
              <div className="grade-dropzone">
                <input
                  type="file"
                  accept=".csv"
                  id="answer-key-file"
                  onChange={(event) => setKeyCsv(event.target.files?.[0] ?? null)}
                />
                <label htmlFor="answer-key-file">
                  {keyCsv ? (
                    <span className="grade-file-ok">✓ {keyCsv.name}</span>
                  ) : (
                    <span> Click to select the answer key file</span>
                  )}
                </label>
              </div>
            </div>

            <div>
              <label className="grade-label">2. Student Answers File (CSV)</label>
              <div className="grade-dropzone">
                <input
                  type="file"
                  accept=".csv"
                  id="student-answers-file"
                  onChange={(event) => setAnswersCsv(event.target.files?.[0] ?? null)}
                />
                <label htmlFor="student-answers-file">
                  {answersCsv ? (
                    <span className="grade-file-ok">✓ {answersCsv.name}</span>
                  ) : (
                    <span> Click to select the student answers file</span>
                  )}
                </label>
              </div>
            </div>

            <button
              type="button"
              className="grade-primary"
              onClick={handleSubmit}
              disabled={!keyCsv || !answersCsv || processing}
            >
              {processing ? "Processing..." : "Grade Exams"}
            </button>
          </div>

          {result && result.results.length > 0 ? (
            <div className="grade-results">
              <div className="grade-results-header">
                <h2>Results ({result.results.length} students)</h2>
                <button type="button" className="grade-secondary" onClick={downloadReport}>
                  Export CSV
                </button>
              </div>

              <div className="grade-table-wrapper">
                <table className="grade-table">
                  <thead>
                    <tr>
                      <th>CPF</th>
                      <th>Exam</th>
                      <th>Score</th>
                      <th>Percent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.results.map((item) => {
                      const maxScore = item.details.length;
                      const percentage = maxScore === 0 ? 0 : (item.score / maxScore) * 100;
                      return (
                        <tr key={`${item.studentId}-${item.examNumber}`}>
                          <td>{item.studentId}</td>
                          <td>{item.examNumber}</td>
                          <td>
                            {item.score.toFixed(2)} / {maxScore}
                          </td>
                          <td>
                            <span
                              className={
                                percentage >= 70
                                  ? "grade-pill grade-pill--ok"
                                  : percentage >= 50
                                  ? "grade-pill grade-pill--mid"
                                  : "grade-pill grade-pill--bad"
                              }
                            >
                              {percentage.toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {stats ? (
                <div className="grade-summary">
                  <div className="grade-summary-card grade-summary-card--blue">
                    <p>Média da Turma</p>
                      <strong>{stats.avg.toFixed(1)}%</strong>
                  </div>
                  <div className="grade-summary-card grade-summary-card--green">
                    <p>Passing (≥70%)</p>
                    <strong>{stats.approved}</strong>
                  </div>
                  <div className="grade-summary-card grade-summary-card--red">
                    <p>Failing (&lt;70%)</p>
                    <strong>{stats.failed}</strong>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
