export type Choice = {
  id: string;
  text: string;
};

export type Question = {
  id: string;
  prompt: string;
  choices: Choice[];
  correctChoiceIds: string[];
  tags?: string[];
  createdAt: string;
};

export type AnswerLabelingMode = "letters" | "powersOfTwo";

export type Exam = {
  id: string;
  title: string;
  subject: string;
  teacher: string;
  date: string;
  answerLabelingMode: AnswerLabelingMode;
  questionIds: string[];
  createdAt: string;
};

export type ExamVariant = {
  examId: string;
  variantId: string;
  examNumber: string;
  questions: {
    questionId: string;
    shuffledChoiceIds: string[];
  }[];
};

export type AnswerKey = {
  examId: string;
  variantId: string;
  answers: {
    questionId: string;
    correctChoiceIds: string[];
  }[];
};

export type CorrectionResult = {
  examNumber: string;
  examId?: string;
  variantId?: string;
  studentId: string;
  score: number;
  details: {
    questionId: string;
    isCorrect: boolean;
    selectedChoiceIds: string[];
    pointsAwarded?: number;
  }[];
};

export type PdfGenerationRecord = {
  id: string;
  examId: string;
  examTitle: string;
  subject: string;
  teacher: string;
  date: string;
  answerLabelingMode: AnswerLabelingMode;
  copies: number;
  variantIds: string[];
  institution?: string;
  createdAt: string;
};
