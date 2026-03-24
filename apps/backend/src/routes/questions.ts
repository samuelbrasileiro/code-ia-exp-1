import { Router } from "express";
import { z } from "zod";
import type { Question } from "../../../packages/shared/src/types.js";
import { createId } from "../utils/id.js";
import { getQuestions, saveQuestions } from "../store/questionsStore.js";

const router = Router();

const questionSchema = z.object({
  prompt: z.string().min(1),
  choices: z.array(z.string().min(1)).min(2),
  correctIndex: z.number().int().nonnegative(),
  tags: z.array(z.string().min(1)).optional()
});

router.get("/", async (_req, res) => {
  const questions = await getQuestions();
  res.json(questions);
});

router.post("/", async (req, res) => {
  const parsed = questionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { prompt, choices, correctIndex, tags } = parsed.data;
  if (correctIndex >= choices.length) {
    return res.status(400).json({ error: "correctIndex out of range" });
  }

  const now = new Date().toISOString();
  const question: Question = {
    id: createId(),
    prompt,
    choices: choices.map((text) => ({ id: createId(), text })),
    correctChoiceId: "",
    tags,
    createdAt: now
  };
  question.correctChoiceId = question.choices[correctIndex].id;

  const questions = await getQuestions();
  questions.push(question);
  await saveQuestions(questions);
  res.status(201).json(question);
});

router.put("/:id", async (req, res) => {
  const parsed = questionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const { prompt, choices, correctIndex, tags } = parsed.data;
  if (correctIndex >= choices.length) {
    return res.status(400).json({ error: "correctIndex out of range" });
  }

  const questions = await getQuestions();
  const index = questions.findIndex((q) => q.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: "Question not found" });
  }

  const updated: Question = {
    id: questions[index].id,
    prompt,
    choices: choices.map((text) => ({ id: createId(), text })),
    correctChoiceId: "",
    tags,
    createdAt: questions[index].createdAt
  };
  updated.correctChoiceId = updated.choices[correctIndex].id;

  questions[index] = updated;
  await saveQuestions(questions);
  res.json(updated);
});

router.delete("/:id", async (req, res) => {
  const questions = await getQuestions();
  const next = questions.filter((q) => q.id !== req.params.id);
  if (next.length === questions.length) {
    return res.status(404).json({ error: "Question not found" });
  }
  await saveQuestions(next);
  res.status(204).send();
});

export default router;
