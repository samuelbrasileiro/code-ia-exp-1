export type Choice = {
  id: string;
  text: string;
};

export type Question = {
  id: string;
  prompt: string;
  choices: Choice[];
  correctChoiceId: string;
  tags?: string[];
  createdAt: string;
};

export type Exam = {
  id: string;
  title: string;
  questionIds: string[];
  createdAt: string;
};

export type ExamVariant = {
  examId: string;
  variantId: string;
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
    correctChoiceId: string;
  }[];
};

export type CorrectionResult = {
  examId: string;
  variantId: string;
  studentId: string;
  score: number;
  details: {
    questionId: string;
    isCorrect: boolean;
    selectedChoiceId: string;
  }[];
};
