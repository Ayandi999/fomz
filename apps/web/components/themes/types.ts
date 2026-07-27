export type FieldType =
  | "LONG_TEXT" | "SHORT_TEXT" | "IMAGE" | "VIDEO" | "AUDIO" | "FILE"
  | "MULTIPLE_CHOICE" | "YES_NO" | "CHECKBOX" | "DROPDOWN" | "SLIDER"
  | "NUMBER" | "EMAIL" | "CONTACT_INFO" | "ADDRESS" | "PHONE" | "WEBSITE"
  | "RATING" | "DATE" | "WELCOME" | "THANK_YOU" | "INFO";

export interface ThemeField {
  id?: string;
  clientTempId?: string;
  formId?: string | null;
  label: string | null;
  placeholder: string | null;
  description?: string;
  fieldType: FieldType;
  isRequired: boolean;
  parentId?: string | null;
  index: number;
  labelKey: string;
}

export interface ThemeProps {
  mode: "preview" | "public";
  fields: ThemeField[];
  answers: Record<string, string>;
  setAnswer: (fieldId: string, value: string) => void;
  stepIndex: number;
  setStepIndex: (index: number | ((prev: number) => number)) => void;
  handleNext: () => void;
  handleBack: () => void;
  handleSubmit: () => Promise<void>;
  submitted: boolean;
  submitError: string;
  validationError: string;
  isUploading?: boolean;
  shouldReduceMotion?: boolean;
  isNavigating?: boolean;
  isCardShaking?: boolean;
  isSubmitting?: boolean;
}
