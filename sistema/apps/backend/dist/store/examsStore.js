import { readJson, writeJson } from "./fileStore.js";
const FILE = "exams.json";
export async function getExams() {
    const data = await readJson(FILE, []);
    return data.map((exam) => ({
        ...exam,
        subject: exam.subject ?? "",
        teacher: exam.teacher ?? "",
        date: exam.date ?? "",
        answerLabelingMode: exam.answerLabelingMode ?? "letters"
    }));
}
export async function saveExams(exams) {
    await writeJson(FILE, exams);
}
