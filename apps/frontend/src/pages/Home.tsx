import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import SectionCard from "../components/SectionCard";

export default function Home() {
  return (
    <div className="page">
      <PageHeader
        title="Build and correct exams in minutes"
        description="Create questions, assemble an exam, generate randomized PDFs, export answer keys, and upload student answers for correction."
      />

      <SectionCard title="Quick Start">
        <div className="grid-links">
          <Link className="pill" to="/questions">
            1. Add Questions
          </Link>
          <Link className="pill" to="/exams">
            2. Create an Exam
          </Link>
          <Link className="pill" to="/generate">
            3. Generate PDFs
          </Link>
          <Link className="pill" to="/correction">
            4. Correct Answers
          </Link>
        </div>
      </SectionCard>

      <SectionCard title="How it Works">
        <ol className="steps">
          <li>Write multiple-choice questions with the correct option.</li>
          <li>Select questions to create an exam.</li>
          <li>Generate a randomized PDF and the answer key CSV.</li>
          <li>Upload student answers CSV and see the scores.</li>
        </ol>
      </SectionCard>
    </div>
  );
}
