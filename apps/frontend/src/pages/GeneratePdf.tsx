import { useState } from "react";
import type { Exam, ExamVariant } from "@shared/types";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";
import useExams from "../hooks/useExams";
import { createVariant, downloadAnswerKey, downloadPdf } from "../api";

export default function GeneratePdf() {
  const { exams, error } = useExams();
  const [variants, setVariants] = useState<Record<string, ExamVariant>>({});
  const [status, setStatus] = useState("");

  async function handleCreateVariant(exam: Exam) {
    setStatus("");
    const variant = await createVariant(exam.id);
    setVariants((prev) => ({ ...prev, [exam.id]: variant }));
  }

  async function handleDownloadPdf(exam: Exam) {
    const variant = variants[exam.id];
    if (!variant) {
      setStatus("Create a variant first.");
      return;
    }
    const blob = await downloadPdf(exam.id, variant);
    triggerDownload(blob, `exam-${exam.id}-${variant.variantId}.pdf`);
  }

  async function handleDownloadKey(exam: Exam) {
    const variant = variants[exam.id];
    if (!variant) {
      setStatus("Create a variant first.");
      return;
    }
    const blob = await downloadAnswerKey(exam.id, variant);
    triggerDownload(blob, `answer-key-${exam.id}-${variant.variantId}.csv`);
  }

  return (
    <div className="page">
      <PageHeader
        title="Generate PDFs"
        description="Randomize questions and answer order, then download the PDF and answer key."
      />

      {status ? <div className="status">{status}</div> : null}
      {error ? <div className="status">{error}</div> : null}

      <SectionCard title="Exam Variants">
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
          ))}
        </div>
      </SectionCard>
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
