import { readJson, writeJson } from "./fileStore.js";
const FILE = "questions.json";
export async function getQuestions() {
    const data = await readJson(FILE, []);
    return data.map((item) => {
        if (item.correctChoiceIds && item.correctChoiceIds.length > 0) {
            return item;
        }
        if (item.correctChoiceId) {
            return {
                ...item,
                correctChoiceIds: [item.correctChoiceId]
            };
        }
        return {
            ...item,
            correctChoiceIds: []
        };
    });
}
export async function saveQuestions(questions) {
    await writeJson(FILE, questions);
}
