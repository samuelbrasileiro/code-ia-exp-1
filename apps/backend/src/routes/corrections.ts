import { Router } from "express";
import multer from "multer";
import { parse } from "csv-parse/sync";
import type { CorrectionResult } from "../../../packages/shared/src/types.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

type KeyRow = {
  examId: string;
  variantId: string;
  questionId: string;
  correctChoiceId: string;
};

type AnswerRow = {
  studentId: string;
  questionId: string;
  selectedChoiceId: string;
};

router.post(
  "/",
  upload.fields([
    { name: "keyCsv", maxCount: 1 },
    { name: "answersCsv", maxCount: 1 }
  ]),
  (req, res) => {
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;
    const keyFile = files?.keyCsv?.[0];
    const answersFile = files?.answersCsv?.[0];

    if (!keyFile || !answersFile) {
      return res.status(400).json({ error: "Missing keyCsv or answersCsv file" });
    }

    const keyRows = parse(keyFile.buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    }) as KeyRow[];

    const answerRows = parse(answersFile.buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    }) as AnswerRow[];

    if (keyRows.length === 0) {
      return res.status(400).json({ error: "Answer key CSV is empty" });
    }

    const examId = keyRows[0].examId;
    const variantId = keyRows[0].variantId;

    const keyMap = new Map(
      keyRows.map((row) => [row.questionId, row.correctChoiceId])
    );

    const answersByStudent = new Map<string, AnswerRow[]>();
    answerRows.forEach((row) => {
      if (!answersByStudent.has(row.studentId)) {
        answersByStudent.set(row.studentId, []);
      }
      answersByStudent.get(row.studentId)?.push(row);
    });

    const results: CorrectionResult[] = [];
    answersByStudent.forEach((rows, studentId) => {
      let correct = 0;
      const details = rows.map((row) => {
        const expected = keyMap.get(row.questionId);
        const isCorrect = expected === row.selectedChoiceId;
        if (isCorrect) {
          correct += 1;
        }
        return {
          questionId: row.questionId,
          isCorrect,
          selectedChoiceId: row.selectedChoiceId
        };
      });
      results.push({
        examId,
        variantId,
        studentId,
        score: keyMap.size === 0 ? 0 : correct,
        details
      });
    });

    res.json({ examId, variantId, results });
  }
);

export default router;
