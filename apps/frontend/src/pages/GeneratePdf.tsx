import { useMemo, useState } from "react";
import PageHeader from "../components/PageHeader";
import useExams from "../hooks/useExams";
import { downloadPdfZip } from "../api";

const MIN_COPIES = 1;
const MAX_COPIES = 100;

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

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");
}

export default function GeneratePdf() {
  const { exams, error } = useExams();
  const [selectedExamId, setSelectedExamId] = useState("");
  const [numberOfCopies, setNumberOfCopies] = useState(1);
  const [institution, setInstitution] = useState("");
  const [status, setStatus] = useState("");
  const [generating, setGenerating] = useState(false);

  const selectedExam = useMemo(
    () => exams.find((exam) => exam.id === selectedExamId),
    [exams, selectedExamId]
  );

  async function handleGenerate() {
    setStatus("");

    if (!selectedExamId) {
      setStatus("Select an exam first.");
      return;
    }

    if (numberOfCopies < MIN_COPIES || numberOfCopies > MAX_COPIES) {
      setStatus(`Number of copies must be between ${MIN_COPIES} and ${MAX_COPIES}.`);
      return;
    }

    const exam = exams.find((item) => item.id === selectedExamId);
    if (!exam) {
      setStatus("Exam not found.");
      return;
    }

    if (exam.questionIds.length === 0) {
      setStatus("This exam has no questions.");
      return;
    }

    setGenerating(true);

    try {
      const examSlug = slugify(exam.title) || exam.id;
      const institutionSlug = institution.trim() ? `-${slugify(institution)}` : "";
      const fileBase = `exam-${examSlug}${institutionSlug}`;

      const zipBlob = await downloadPdfZip(exam.id, {
        copies: numberOfCopies,
        institution: institution.trim() || undefined
      });

      triggerDownload(zipBlob, `${fileBase}.zip`);
      setStatus(`Generated ${numberOfCopies} PDF(s) in a single zip.`);
    } catch (err) {
      console.error("Error generating PDFs:", err);
      setStatus("Failed to generate PDF zip. Try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="Generate PDFs"
        description="Generate multiple randomized variants and download them as a single zip."
      />

      {status ? <div className="status">{status}</div> : null}
      {error ? <div className="status">{error}</div> : null}

      {exams.length === 0 ? (
        <div className="card">
          <p className="muted">Create an exam before generating PDFs.</p>
        </div>
      ) : (
        <div className="card">
          <div className="form">
            <label>
              Select exam
              <select
                value={selectedExamId}
                onChange={(event) => setSelectedExamId(event.target.value)}
              >
                <option value="">-- Select an exam --</option>
                {exams.map((exam) => (
                  <option key={exam.id} value={exam.id}>
                    {exam.title} • {exam.subject} ({exam.questionIds.length} questions)
                  </option>
                ))}
              </select>
            </label>

            {selectedExam ? (
              <div className="panel panel-highlight">
                <h3>Exam details</h3>
                <div className="panel-meta">
                  <span>
                    <strong>Subject:</strong> {selectedExam.subject}
                  </span>
                  <span>
                    <strong>Teacher:</strong> {selectedExam.teacher}
                  </span>
                  <span>
                    <strong>Date:</strong> {formatDate(selectedExam.date)}
                  </span>
                  <span>
                    <strong>Questions:</strong> {selectedExam.questionIds.length}
                  </span>
                  <span>
                    <strong>Format:</strong>{" "}
                    {selectedExam.answerLabelingMode === "letters" ? "Letters" : "Powers of Two"}
                  </span>
                </div>
              </div>
            ) : null}

            <label>
              Number of copies ({MIN_COPIES}-{MAX_COPIES})
              <input
                type="number"
                min={MIN_COPIES}
                max={MAX_COPIES}
                value={numberOfCopies}
                onChange={(event) =>
                  setNumberOfCopies(Math.max(MIN_COPIES, Number(event.target.value) || MIN_COPIES))
                }
              />
            </label>

            <label>
              Institution (optional)
              <input
                type="text"
                value={institution}
                onChange={(event) => setInstitution(event.target.value)}
                placeholder="Institution name"
              />
            </label>

            <div className="form-span">
              <button
                type="button"
                className="primary"
                onClick={handleGenerate}
                disabled={!selectedExamId || generating}
              >
                {generating
                  ? "Generating zip..."
                  : `Generate zip with ${numberOfCopies} ${numberOfCopies === 1 ? "PDF" : "PDFs"}`}
              </button>
            </div>
          </div>

          <div className="list-item">
            <p className="title">What you will get</p>
            <ul>
              <li>One zip file containing {numberOfCopies} randomized PDF variants</li>
              <li>Each PDF includes the exam header and answer lines</li>
              <li>One combined CSV answer key inside the zip</li>
            </ul>
          </div>
        </div>
      )}
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
