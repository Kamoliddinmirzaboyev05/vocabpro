export interface Word {
  id: string;
  english: string;
  translation: string;
  correctAnswer?: string;
  exampleSentence?: string;
  options?: string[];
  collection_id?: string;
  user_id?: string;
}

export interface Collection {
  id: string;
  title: string;
  name: string;
  description?: string;
  wordCount: number;
  words: Word[];
}
