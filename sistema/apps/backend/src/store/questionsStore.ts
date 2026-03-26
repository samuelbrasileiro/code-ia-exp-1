import type { Question } from "@exam/shared";
import { readJson, writeJson } from "./fileStore.js";

const FILE = "questions.json";

type LegacyQuestion = Question & {
  correctChoiceId?: string;
};

export async function getQuestions(): Promise<Question[]> {
  const data = await readJson<LegacyQuestion[]>(FILE, []);
  return data.map((item) => {
    if (item.correctChoiceIds && item.correctChoiceIds.length > 0) {
      return item as Question;
    }
    if (item.correctChoiceId) {
      return {
        ...item,
        correctChoiceIds: [item.correctChoiceId]
      } as Question;
    }
    return {
      ...item,
      correctChoiceIds: []
    } as Question;
  });
}

export async function saveQuestions(questions: Question[]): Promise<void> {
  await writeJson(FILE, questions);
}
