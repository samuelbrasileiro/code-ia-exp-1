import { Router } from "express";
import { z } from "zod";
import PDFDocument from "pdfkit";
import archiver from "archiver";
import { PassThrough } from "node:stream";
import type {
  Exam,
  ExamVariant,
  PdfGenerationRecord,
  Question
} from "@exam/shared";
import { createId } from "../utils/id.js";
import { getExams, saveExams } from "../store/examsStore.js";
import { getQuestions } from "../store/questionsStore.js";
import { appendPdfHistory, getPdfHistory } from "../store/pdfHistoryStore.js";
import { createSequentialExamNumber, createVariant } from "../services/variant.js";

const router = Router();

const examSchema = z.object({
  title: z.string().min(1),
  subject: z.string().min(1),
  teacher: z.string().min(1),
  date: z.string().min(1),
  answerLabelingMode: z.enum(["letters", "powersOfTwo"]),
  questionIds: z.array(z.string().min(1)).min(1)
});

const variantSchema: z.ZodType<ExamVariant> = z.object({
  examId: z.string().min(1),
  variantId: z.string().min(1),
  examNumber: z.string().min(1),
  questions: z
    .array(
      z.object({
        questionId: z.string().min(1),
        shuffledChoiceIds: z.array(z.string().min(1)).min(2)
      })
    )
    .min(1)
});

const pdfZipSchema = z.object({
  copies: z.number().int().min(1).max(100),
  institution: z.string().trim().optional()
});

function labelForChoice(index: number, mode: Exam["answerLabelingMode"]): string {
  if (mode === "powersOfTwo") {
    return String(2 ** index);
  }
  return String.fromCharCode(65 + index);
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-_]/g, "");
}

async function validateQuestionIds(questionIds: string[]) {
  const questions = await getQuestions();
  const knownIds = new Set(questions.map((q) => q.id));
  const missing = questionIds.filter((id) => !knownIds.has(id));
  if (missing.length > 0) {
    return missing;
  }
  return [];
}

function renderExamPdf(
  doc: PDFKit.PDFDocument,
  exam: Exam,
  variant: ExamVariant,
  questionMap: Map<string, Question>
) {
  const pageWidth = doc.page.width;
  const left = doc.page.margins.left;
  const right = pageWidth - doc.page.margins.right;
  const contentWidth = right - left;

  const drawFooter = () => {
    const currentX = doc.x;
    const currentY = doc.y;
    const footerY = doc.page.height - doc.page.margins.bottom - 12;
    doc.save();
    doc.font("Helvetica").fontSize(9).fillColor("#666666");
    doc.text(`Exam number: ${variant.examNumber}`, left, footerY, {
      width: contentWidth,
      align: "center",
      lineBreak: false
    });
    doc.restore();
    doc.x = currentX;
    doc.y = currentY;
  };

  const drawSectionDivider = () => {
    const y = doc.y;
    doc
      .strokeColor("#DDDDDD")
      .lineWidth(1)
      .moveTo(left, y)
      .lineTo(right, y)
      .stroke();
    doc.moveDown(0.6);
    doc.strokeColor("#000000");
  };

  const drawAnswerLine = (mode: Exam["answerLabelingMode"]) => {
    const label = mode === "powersOfTwo" ? "Sum:" : "Answer:";
    doc.fontSize(11).fillColor("#333333").text(label, { continued: true });

    const startX = doc.x + 6;
    const y = doc.y + 2;
    const lineWidth = mode === "powersOfTwo" ? contentWidth * 0.5 : contentWidth * 0.35;
    doc
      .strokeColor("#333333")
      .lineWidth(1)
      .moveTo(startX, y)
      .lineTo(startX + lineWidth, y)
      .stroke();
    doc.fillColor("#000000");
    doc.moveDown(0.8);
  };

  doc.on("pageAdded", drawFooter);
  drawFooter();

  doc.font("Helvetica-Bold").fontSize(18).text(exam.title, { align: "center" });
  doc.moveDown(0.4);
  doc.font("Helvetica").fontSize(11).fillColor("#555555");
  doc.text(`Subject: ${exam.subject}`);
  doc.text(`Teacher: ${exam.teacher}`);
  doc.text(`Date: ${exam.date}`);
  doc.text(`Answer labels: ${exam.answerLabelingMode === "letters" ? "Letters" : "Powers of Two"}`);
  doc.fillColor("#000000");
  doc.moveDown(0.6);
  drawSectionDivider();

  variant.questions.forEach((entry, index) => {
    const question = questionMap.get(entry.questionId);
    if (!question) {
      return;
    }
    doc.font("Helvetica-Bold").fontSize(12).text(`${index + 1}. ${question.prompt}`);
    doc.font("Helvetica");
    doc.moveDown(0.35);

    const choices = entry.shuffledChoiceIds
      .map((choiceId) => question.choices.find((c) => c.id === choiceId))
      .filter(Boolean) as Question["choices"];

    choices.forEach((choice, choiceIndex) => {
      const label = labelForChoice(choiceIndex, exam.answerLabelingMode);
      doc.text(`   ${label}. ${choice.text}`, {
        indent: 12
      });
    });
    doc.moveDown(0.4);
    drawAnswerLine(exam.answerLabelingMode);
    drawSectionDivider();
  });
}

async function generatePdfBuffer(
  exam: Exam,
  variant: ExamVariant,
  questionMap: Map<string, Question>
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    doc.on("error", reject);
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    renderExamPdf(doc, exam, variant, questionMap);
    doc.end();
  });
}

function buildAnswerKeyCsv(
  exam: Exam,
  variants: ExamVariant[],
  questionMap: Map<string, Question>
): string {
  if (variants.length === 0) {
    return "exam-id\n";
  }
  const questionCount = variants[0].questions.length;
  const header = [
    "exam-id",
    ...Array.from({ length: questionCount }, (_, index) => `question${index + 1}-answer`)
  ];
  const lines = [header.join(",")];

  variants.forEach((variant) => {
    const answers = variant.questions.map((entry) => {
      const question = questionMap.get(entry.questionId);
      if (!question) {
        return "";
      }
      const correctLabels = question.correctChoiceIds
        .map((choiceId) => entry.shuffledChoiceIds.indexOf(choiceId))
        .filter((choiceIndex) => choiceIndex >= 0)
        .map((choiceIndex) => labelForChoice(choiceIndex, exam.answerLabelingMode));
      if (exam.answerLabelingMode === "powersOfTwo") {
        const sum = correctLabels.reduce(
          (total, value) => total + Number.parseInt(value, 10),
          0
        );
        return String(sum);
      }
      return correctLabels.join("|");
    });
    lines.push([variant.examNumber, ...answers].join(","));
  });
  return `${lines.join("\n")}\n`;
}

router.get("/", async (_req, res) => {
  const exams = await getExams();
  res.json(exams);
});

router.get("/:id", async (req, res) => {
  const exams = await getExams();
  const exam = exams.find((item) => item.id === req.params.id);
  if (!exam) {
    return res.status(404).json({ error: "Exam not found" });
  }
  res.json(exam);
});

router.post("/", async (req, res) => {
  const parsed = examSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { title, subject, teacher, date, answerLabelingMode, questionIds } = parsed.data;
  const missing = await validateQuestionIds(questionIds);
  if (missing.length > 0) {
    return res.status(400).json({ error: "Unknown questionIds", missing });
  }

  const now = new Date().toISOString();
  const exam: Exam = {
    id: createId(),
    title,
    subject,
    teacher,
    date,
    answerLabelingMode,
    questionIds,
    createdAt: now
  };

  const exams = await getExams();
  exams.push(exam);
  await saveExams(exams);
  res.status(201).json(exam);
});

router.put("/:id", async (req, res) => {
  const parsed = examSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { title, subject, teacher, date, answerLabelingMode, questionIds } = parsed.data;
  const missing = await validateQuestionIds(questionIds);
  if (missing.length > 0) {
    return res.status(400).json({ error: "Unknown questionIds", missing });
  }

  const exams = await getExams();
  const index = exams.findIndex((item) => item.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Exam not found" });
  }

  const updated: Exam = {
    id: exams[index].id,
    title,
    subject,
    teacher,
    date,
    answerLabelingMode,
    questionIds,
    createdAt: exams[index].createdAt
  };

  exams[index] = updated;
  await saveExams(exams);
  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const exams = await getExams();
  const next = exams.filter((item) => item.id !== req.params.id);
  if (next.length === exams.length) {
    return res.status(404).json({ error: "Exam not found" });
  }
  await saveExams(next);
  res.status(204).send();
});

router.post("/:id/variant", async (req, res) => {
  const exams = await getExams();
  const exam = exams.find((item) => item.id === req.params.id);
  if (!exam) {
    return res.status(404).json({ error: "Exam not found" });
  }

  const questions = await getQuestions();
  const examQuestions = questions.filter((q) => exam.questionIds.includes(q.id));
  if (examQuestions.length === 0) {
    return res.status(400).json({ error: "Exam has no questions" });
  }

  const variant = createVariant(exam, examQuestions);
  res.json(variant);
});

router.post("/:id/pdf", async (req, res) => {
  const parsed = variantSchema.safeParse(req.body.variant);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const variant = parsed.data;
  if (variant.examId !== req.params.id) {
    return res.status(400).json({ error: "Variant does not match exam" });
  }

  const exams = await getExams();
  const exam = exams.find((item) => item.id === req.params.id);
  if (!exam) {
    return res.status(404).json({ error: "Exam not found" });
  }

  const questions = await getQuestions();
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="exam-${exam.id}-${variant.variantId}.pdf"`
  );

  const doc = new PDFDocument({ margin: 50, size: "A4" });
  doc.pipe(res);
  renderExamPdf(doc, exam, variant, questionMap);
  doc.end();
});

router.post("/:id/pdf-zip", async (req, res) => {
  const parsed = pdfZipSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { copies, institution } = parsed.data;
  const exams = await getExams();
  const exam = exams.find((item) => item.id === req.params.id);
  if (!exam) {
    return res.status(404).json({ error: "Exam not found" });
  }

  const questions = await getQuestions();
  const examQuestions = questions.filter((q) => exam.questionIds.includes(q.id));
  if (examQuestions.length === 0) {
    return res.status(400).json({ error: "Exam has no questions" });
  }

  const questionMap = new Map(questions.map((q) => [q.id, q]));
  const variants: ExamVariant[] = [];

  for (let i = 0; i < copies; i += 1) {
    const examNumber = createSequentialExamNumber(i + 1);
    variants.push(createVariant(exam, examQuestions, examNumber));
  }

  const pdfBuffers = await Promise.all(
    variants.map((variant) => generatePdfBuffer(exam, variant, questionMap))
  );

  const answerKeyCsv = buildAnswerKeyCsv(exam, variants, questionMap);
  const examSlug = slugify(exam.title) || exam.id;
  const institutionSlug = institution ? `-${slugify(institution)}` : "";
  const fileBase = `exam-${examSlug}${institutionSlug}`;

  const zipBuffer = await new Promise<Buffer>((resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 9 } });
    const stream = new PassThrough();
    const chunks: Buffer[] = [];

    stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    archive.on("error", reject);

    archive.pipe(stream);

    pdfBuffers.forEach((buffer, index) => {
      archive.append(buffer, { name: `${fileBase}-${index + 1}.pdf` });
    });

    archive.append(answerKeyCsv, { name: `answer-key-${examSlug}${institutionSlug}.csv` });

    void archive.finalize();
  });

  const record: PdfGenerationRecord = {
    id: createId(),
    examId: exam.id,
    examTitle: exam.title,
    subject: exam.subject,
    teacher: exam.teacher,
    date: exam.date,
    answerLabelingMode: exam.answerLabelingMode,
    copies,
    variantIds: variants.map((variant) => variant.variantId),
    institution: institution?.trim() || undefined,
    createdAt: new Date().toISOString()
  };

  await appendPdfHistory(record);

  res.setHeader("Content-Type", "application/zip");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${fileBase}.zip"`
  );
  res.send(zipBuffer);
});

router.get("/:id/pdf-history", async (req, res) => {
  const history = await getPdfHistory();
  res.json(history.filter((record) => record.examId === req.params.id));
});

router.post("/:id/answer-key", async (req, res) => {
  const parsed = variantSchema.safeParse(req.body.variant);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const exams = await getExams();
  const exam = exams.find((item) => item.id === req.params.id);
  if (!exam) {
    return res.status(404).json({ error: "Exam not found" });
  }

  const variant = parsed.data;
  if (variant.examId !== req.params.id) {
    return res.status(400).json({ error: "Variant does not match exam" });
  }

  const questions = await getQuestions();
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  const csvContent = buildAnswerKeyCsv(exam, [variant], questionMap);

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="answer-key-${variant.examId}-${variant.variantId}.csv"`
  );
  res.send(csvContent);
});

export default router;
