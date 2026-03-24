import type { Question } from "../../../packages/shared/src/types.js";
import { readJson, writeJson } from "./fileStore.js";

const FILE = "questions.json";

export async function getQuestions(): Promise<Question[]> {
  return readJson<Question[]>(FILE, []);
}

export async function saveQuestions(questions: Question[]): Promise<void> {
  await writeJson(FILE, questions);
}
