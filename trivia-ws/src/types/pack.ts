export interface Question {
  id: string;
  question: string;
  // answers[0] is ALWAYS the correct answer (randomize display order on the client)
  answers: [string, string, string, string];
  comment: string;
  taunt: string;
}

export interface Pack {
  id: string;
  name: string;
  easy: Question[];
  medium: Question[];
  hard: Question[];
}

export interface PackSummary {
  id: string;
  name: string;
  questionCount: {
    easy: number;
    medium: number;
    hard: number;
    total: number;
  };
}
