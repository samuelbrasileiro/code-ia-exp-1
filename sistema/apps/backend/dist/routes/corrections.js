import { Router } from "express";
import multer from "multer";
import { parse } from "csv-parse/sync";
const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
function detectDelimiter(buffer) {
    const sample = buffer.toString("utf8", 0, 2048);
    const commaCount = (sample.match(/,/g) ?? []).length;
    const semicolonCount = (sample.match(/;/g) ?? []).length;
    return semicolonCount > commaCount ? ";" : ",";
}
function parseDelimited(value) {
    if (!value) {
        return [];
    }
    return value
        .split(/[|,]/)
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
}
function parseNumericSum(value) {
    if (!value) {
        return null;
    }
    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }
    if (trimmed.includes("|") || trimmed.includes(",")) {
        const parts = parseDelimited(trimmed);
        if (parts.length === 0) {
            return null;
        }
        let total = 0;
        for (const part of parts) {
            const num = Number(part);
            if (Number.isNaN(num)) {
                return null;
            }
            total += num;
        }
        return total;
    }
    const num = Number(trimmed);
    return Number.isNaN(num) ? null : num;
}
function decomposeToPowersOfTwo(value) {
    if (!Number.isFinite(value) || value <= 0) {
        return [];
    }
    const parts = [];
    let remaining = Math.floor(value);
    let bit = 1;
    while (remaining > 0) {
        if (remaining & 1) {
            parts.push(String(bit));
        }
        remaining >>= 1;
        bit <<= 1;
    }
    return parts;
}
function sameSet(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    const setA = new Set(a);
    return b.every((item) => setA.has(item));
}
router.post("/", upload.fields([
    { name: "keyCsv", maxCount: 1 },
    { name: "answersCsv", maxCount: 1 }
]), (req, res) => {
    const files = req.files;
    const keyFile = files?.keyCsv?.[0];
    const answersFile = files?.answersCsv?.[0];
    if (!keyFile || !answersFile) {
        return res.status(400).json({ error: "Missing keyCsv or answersCsv file" });
    }
    const keyRows = parse(keyFile.buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        delimiter: detectDelimiter(keyFile.buffer)
    });
    const answerRows = parse(answersFile.buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        delimiter: detectDelimiter(answersFile.buffer)
    });
    if (keyRows.length === 0) {
        return res.status(400).json({ error: "Answer key CSV is empty" });
    }
    if (answerRows.length === 0) {
        return res.status(400).json({ error: "Student answers CSV is empty" });
    }
    const keySample = keyRows[0] ?? {};
    const keyQuestionColumns = Object.keys(keySample)
        .map((key) => ({ key, match: key.match(/^question(\d+)-answer$/i) }))
        .filter((item) => item.match)
        .sort((a, b) => Number(a.match?.[1]) - Number(b.match?.[1]))
        .map((item) => item.key);
    if (!keySample["exam-id"]) {
        return res
            .status(400)
            .json({ error: "Answer key CSV must include an exam-id column" });
    }
    if (keyQuestionColumns.length === 0) {
        return res.status(400).json({
            error: "Answer key CSV must include columns question1-answer, question2-answer, ..."
        });
    }
    const keyRowsByExamNumber = new Map();
    keyRows.forEach((row) => {
        const examNumber = row["exam-id"]?.trim();
        if (!examNumber) {
            return;
        }
        const expected = keyQuestionColumns.map((column) => row[column] ?? "");
        keyRowsByExamNumber.set(examNumber, expected);
    });
    if (keyRowsByExamNumber.size === 0) {
        return res.status(400).json({ error: "Answer key CSV is missing exam-id values" });
    }
    const sampleRow = answerRows[0] ?? {};
    const answerColumns = Object.keys(sampleRow)
        .map((key) => ({ key, match: key.match(/^question(\d+)-answer$/i) }))
        .filter((item) => item.match)
        .sort((a, b) => Number(a.match?.[1]) - Number(b.match?.[1]))
        .map((item) => item.key);
    if (answerColumns.length === 0) {
        return res
            .status(400)
            .json({
            error: "Student answers CSV must include columns question1-answer, question2-answer, ..."
        });
    }
    const missingExamNumbers = new Set();
    const results = [];
    const mode = req.body?.mode === "lenient" ? "lenient" : "strict";
    answerRows.forEach((row) => {
        const studentId = row.cpf?.trim();
        const examNumber = row["exam-id"]?.trim();
        if (!studentId || !examNumber) {
            return;
        }
        const expectedSet = keyRowsByExamNumber.get(examNumber);
        if (!expectedSet) {
            missingExamNumbers.add(examNumber);
            return;
        }
        let score = 0;
        const details = expectedSet.map((expectedRaw, index) => {
            const answerValue = row[answerColumns[index]] ?? "";
            const expectedValue = expectedRaw.trim();
            const expectedSum = expectedValue.match(/^\d+$/) ? Number(expectedValue) : null;
            let isCorrect = false;
            let selected = [];
            let pointsAwarded = 0;
            let expectedChoiceIds = [];
            if (expectedSum !== null) {
                const selectedSum = parseNumericSum(answerValue);
                isCorrect = selectedSum !== null && selectedSum === expectedSum;
                if (selectedSum !== null) {
                    selected = decomposeToPowersOfTwo(selectedSum);
                }
                expectedChoiceIds = decomposeToPowersOfTwo(expectedSum);
                if (isCorrect) {
                    pointsAwarded = 1;
                }
                else if (mode === "lenient") {
                    const expectedSetValues = new Set(expectedChoiceIds);
                    const selectedSet = new Set(selected);
                    const intersectionSize = [...selectedSet].filter((item) => expectedSetValues.has(item)).length;
                    const unionSize = new Set([...expectedChoiceIds, ...selected]).size;
                    pointsAwarded = unionSize === 0 ? 0 : intersectionSize / unionSize;
                    pointsAwarded = clamp(pointsAwarded, 0, 1);
                }
            }
            else {
                const expected = parseDelimited(expectedValue);
                selected = parseDelimited(answerValue);
                isCorrect = sameSet(selected, expected);
                expectedChoiceIds = expected;
                if (isCorrect) {
                    pointsAwarded = 1;
                }
                else if (mode === "lenient") {
                    const expectedSetValues = new Set(expected);
                    const selectedSet = new Set(selected);
                    const intersectionSize = [...selectedSet].filter((item) => expectedSetValues.has(item)).length;
                    const unionSize = new Set([...expected, ...selected]).size;
                    pointsAwarded = unionSize === 0 ? 0 : intersectionSize / unionSize;
                    pointsAwarded = clamp(pointsAwarded, 0, 1);
                }
            }
            score += pointsAwarded;
            return {
                questionId: `Q${index + 1}`,
                isCorrect,
                selectedChoiceIds: selected,
                expectedChoiceIds,
                pointsAwarded
            };
        });
        results.push({
            examNumber,
            studentId,
            score,
            details
        });
    });
    if (missingExamNumbers.size > 0) {
        return res.status(400).json({
            error: "Unknown exam-id values in student answers CSV",
            missing: Array.from(missingExamNumbers)
        });
    }
    res.json({ results });
});
export default router;
