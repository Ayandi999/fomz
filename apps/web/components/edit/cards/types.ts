import type { QuestionItem } from "~/app/dashboard/edit/[formId]/page";

export interface FieldCardProps {
  question: QuestionItem;
  mode: "builder" | "test";
  value?: any;
  onChange?: (val: any) => void;
  
  getQuestionChoices?: (q: QuestionItem) => string[];
  getSliderBoundaries?: (q: QuestionItem) => { min: number; max: number };
  
  childrenFields?: QuestionItem[];
}