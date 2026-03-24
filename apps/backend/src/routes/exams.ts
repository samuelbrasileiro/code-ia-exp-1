import { Router } from "express";
import { z } from "zod";
import PDFDocument from "pdfkit";
import type { Exam, ExamVariant, Question } from "../../../packages/shared/src/types.js";
import { createId } from "../utils/id.js";
import { getExams, saveExams } from "../store/examsStore.js";
import { getQuestions } from "../store/questionsStore.js";
import { createVariant } from "../services/variant.js";

const router = Router();

const examSchema = z.object({
  title: z.string().min(1),
  questionIds: z.array(z.string().min(1)).min(1)
});

const variantSchema: z.ZodType<ExamVariant> = z.object({
  examId: z.string().min(1),
  variantId: z.string().min(1),
  questions: z
    .array(
      z.object({
        questionId: z.string().min(1),
        shuffledChoiceIds: z.array(z.string().min(1)).min(2)
      })
    )
    .min(1)
});

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

  const { title, questionIds } = parsed.data;
  const questions = await getQuestions();
  const knownIds = new Set(questions.map((q) => q.id));
  const missing = questionIds.filter((id) => !knownIds.has(id));
  if (missing.length > 0) {
    return res.status(400).json({ error: "Unknown questionIds", missing });
  }

  const now = new Date().toISOString();
  const exam: Exam = {
    id: createId(),
    title,
    questionIds,
    createdAt: now
  };

  const exams = await getExams();
  exams.push(exam);
  await saveExams(exams);
  res.status(201).json(exam);
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

  doc.fontSize(18).text(exam.title, { align: "center" });
  doc.moveDown();

  variant.questions.forEach((entry, index) => {
    const question = questionMap.get(entry.questionId);
    if (!question) {
      return;
    }
    doc.fontSize(12).text(`${index + 1}. ${question.prompt}`);
    doc.moveDown(0.4);

    const choices = entry.shuffledChoiceIds
      .map((choiceId) => question.choices.find((c) => c.id === choiceId))
      .filter(Boolean) as Question["choices"];

    choices.forEach((choice, choiceIndex) => {
      const label = String.fromCharCode(65 + choiceIndex);
      doc.text(`   ${label}. ${choice.text}`);
    });
    doc.moveDown();
  });

  doc.end();
});

router.post("/:id/answer-key", async (req, res) => {
  const parsed = variantSchema.safeParse(req.body.variant);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const variant = parsed.data;
  if (variant.examId !== req.params.id) {
    return res.status(400).json({ error: "Variant does not match exam" });
  }

  const questions = await getQuestions();
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  const lines = ["examId,variantId,questionId,correctChoiceId"];
  variant.questions.forEach((entry) => {
    const question = questionMap.get(entry.questionId);
    if (!question) {
      return;
    }
    lines.push(
      `${variant.examId},${variant.variantId},${question.id},${question.correctChoiceId}`
    );
  });

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="answer-key-${variant.examId}-${variant.variantId}.csv"`
  );
  res.send(`${lines.join("\n")}\n`);
});

export default router;
