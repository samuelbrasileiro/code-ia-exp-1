import { createId } from "../utils/id.js";
function formatExamNumber(value) {
    return value.toString(36).toUpperCase().padStart(5, "0").slice(-5);
}
function randomExamNumber() {
    const max = 36 ** 5;
    return formatExamNumber(Math.floor(Math.random() * max));
}
function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}
export function createVariant(exam, questions, examNumber) {
    const orderedQuestions = shuffle(questions);
    return {
        examId: exam.id,
        variantId: createId(),
        examNumber: examNumber ?? randomExamNumber(),
        questions: orderedQuestions.map((question) => ({
            questionId: question.id,
            shuffledChoiceIds: shuffle(question.choices.map((choice) => choice.id))
        }))
    };
}
export function createSequentialExamNumber(index) {
    return formatExamNumber(index);
}
