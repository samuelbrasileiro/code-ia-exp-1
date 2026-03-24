import type { Exam } from "../../../packages/shared/src/types.js";
import { readJson, writeJson } from "./fileStore.js";

const FILE = "exams.json";

export async function getExams(): Promise<Exam[]> {
  return readJson<Exam[]>(FILE, []);
}

export async function saveExams(exams: Exam[]): Promise<void> {
  await writeJson(FILE, exams);
}
