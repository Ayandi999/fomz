const fs = require('fs');
let content = fs.readFileSync('apps/web/components/themes/LightModeTheme.tsx', 'utf8');

// 1. Imports
content = content.replace(
  /import \{ useState, use, useEffect, useRef, useTransition \} from "react";[\s\S]*?import \{ themeRegistry \} from "~\/components\/themes\/registry";/,
  `import React, { useState, useEffect, useRef } from "react";
import { 
  ChevronDown, Globe as GlobeIcon, Phone as PhoneIcon, 
  Mail, Star, CheckSquare, AlignLeft, Type, Hash, Calendar,
  ArrowRight, ArrowLeft, Check, Loader2, Upload, Music,
  RefreshCw, AlertCircle, FileText, Image as ImageIcon, Video as VideoIcon,
  Lock, Mic as MicIcon
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import type { ThemeProps, ThemeField } from "./types";`
);

// 2. Types
content = content.replace(
  /type FieldType =[\s\S]*?const getChoices = \(field: PublicField\): string\[\] => \{/,
  `const getChoices = (field: ThemeField): string[] => {`
);

content = content.replace(
  /const getSliderBounds = \(field: PublicField\) => \{/,
  `const getSliderBounds = (field: ThemeField) => {`
);

// 3. Component Signature
content = content.replace(
  /export default function PublicFormPage\(\{ params \}: \{ params: Promise<\{ slug: string \}> \}\) \{[\s\S]*?const \[submittedPassword, setSubmittedPassword\] = useState<string \| undefined>\(undefined\);[\s\S]*?const \{ formId, fields, themeKey, isLoading, isError, error \} = useGetPublicForm\(slug, submittedPassword\);[\s\S]*?const \{ submitResponseAsync, isPending: isSubmitting \} = useSubmitFormResponse\(\);[\s\S]*?const \[answers, setAnswers\] = useState<Record<string, string>>\(\{\}\);[\s\S]*?const \[stepIndex, setStepIndex\] = useState\(0\);[\s\S]*?const \[submitted, setSubmitted\] = useState\(false\);[\s\S]*?const \[submitError, setSubmitError\] = useState\(""\);[\s\S]*?const \[validationError, setValidationError\] = useState\(""\);/,
  `export function LightModeTheme(props: ThemeProps) {
  const {
    mode, fields, answers, setAnswer, stepIndex, setStepIndex,
    handleNext, handleBack, handleSubmit, submitted, submitError, validationError,
    isUploading: isUploadingProp, shouldReduceMotion: shouldReduceMotionProp,
    isNavigating: isNavigatingProp, isCardShaking: isCardShakingProp
  } = props;
  
  // Create local wrappers for setValidationError and setIsCardShaking since they are handled externally or can be local
  const [localValidationError, setLocalValidationError] = useState(validationError || "");
  const [localIsCardShaking, setLocalIsCardShaking] = useState(isCardShakingProp || false);
  const [localIsNavigating, setLocalIsNavigating] = useState(isNavigatingProp || false);
  const isSubmitting = false;

  useEffect(() => {
    if (validationError !== undefined) setLocalValidationError(validationError);
  }, [validationError]);
`
);

// 4. File states
content = content.replace(
  /const \[isUploading, setIsUploading\] = useState\(false\);/,
  `const [isUploadingInternal, setIsUploadingInternal] = useState(false);
  const isUploading = isUploadingProp ?? isUploadingInternal;`
);

// 5. Animation states
content = content.replace(
  /const shouldReduceMotion = useReducedMotion\(\);[\s\S]*?const \[isCardShaking, setIsCardShaking\] = useState\(false\);[\s\S]*?const \[isNavigating, setIsNavigating\] = useState\(false\);/,
  `const shouldReduceMotionInternal = useReducedMotion();
  const shouldReduceMotion = shouldReduceMotionProp ?? shouldReduceMotionInternal;
  const isCardShaking = isCardShakingProp ?? localIsCardShaking;
  const isNavigating = isNavigatingProp ?? localIsNavigating;`
);

// 6. Fix public fields types
content = content.replace(/topLevelFields = \(fields \|\| \[\]\)\.filter\(\(f: PublicField\)/g, `topLevelFields = (fields || []).filter((f: ThemeField)`);
content = content.replace(/getChildFields = \(parentId: string\) =>\s*\(fields \|\| \[\]\)\.filter\(\(f: PublicField\)/g, `getChildFields = (parentId: string) => (fields || []).filter((f: ThemeField)`);
content = content.replace(/isNonInteractive = \(type: FieldType\)/g, `isNonInteractive = (type: string)`);

// 7. Remove data fetching loading states and router errors
content = content.replace(
  /if \(isLoading\) \{[\s\S]*?if \(isError \|\| !fields \|\| !formId\) \{[\s\S]*?<\/main>[\s\S]*?\}/,
  ``
);

// 8. Fix missing methods
content = content.replace(
  /const triggerError = \(msg: string\) => \{[\s\S]*?setValidationError\(msg\);[\s\S]*?setIsCardShaking\(true\);[\s\S]*?setTimeout\(\(\) => setIsCardShaking\(false\), 400\);[\s\S]*?\};/g,
  `const triggerError = (msg: string) => {
    setLocalValidationError(msg);
    setLocalIsCardShaking(true);
    setTimeout(() => setLocalIsCardShaking(false), 400);
  };`
);

content = content.replace(/setValidationError\(/g, `setLocalValidationError(`);
content = content.replace(/setIsNavigating\(/g, `setLocalIsNavigating(`);
content = content.replace(/setIsUploading\(/g, `setIsUploadingInternal(`);

// 9. Remove duplicate handleNext/Back/Submit
content = content.replace(
  /const handleSubmit = async \(\) => \{[\s\S]*?try \{[\s\S]*?const payload = fields\.map[\s\S]*?await submitResponseAsync[\s\S]*?setSubmitted\(true\);[\s\S]*?\} catch \(err: any\) \{[\s\S]*?setSubmitError[\s\S]*?\}[\s\S]*?\};/,
  ``
);

content = content.replace(
  /submitResponseAsync\(\{ formId, answers \}\)\.then\(\(\) => setSubmitted\(true\)\)\.catch\(e => setSubmitError\(e\.message\)\);/,
  `props.handleSubmit();`
);

content = content.replace(/const thankYouSlide = topLevelFields\.find\(\(f: PublicField\)/, 'const thankYouSlide = topLevelFields.find((f: ThemeField)');

// Remove themeCode fetching logic in the render
content = content.replace(
  /\{themeCode\?\.css && \([\s\S]*?<style dangerouslySetInnerHTML=\{\{ __html: themeCode\.css \}\} \/>[\s\S]*?\)\}/,
  ``
);

fs.writeFileSync('apps/web/components/themes/LightModeTheme.tsx', content);
