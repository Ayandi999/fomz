const fs = require('fs');

let content = fs.readFileSync('apps/web/components/themes/LightModeTheme.tsx', 'utf8');

content = content.replace(
  /const \{\s*mode, fields, answers, setAnswer, stepIndex, setStepIndex,\s*handleNext, handleBack, handleSubmit, submitted, submitError, validationError,/,
  `const {
    mode, fields, answers, setAnswer: propSetAnswer, stepIndex, setStepIndex,
    handleSubmit, submitted, submitError, validationError,`
);

content = content.replace(
  /const setAnswer = \(fieldId: string, value: string\) => \{[\s\S]*?setAnswers\(prev => \(\{ \.\.\.prev, \[fieldId\]: value \}\)\);/,
  `const setAnswer = (fieldId: string, value: string) => {
    propSetAnswer(fieldId, value);`
);

fs.writeFileSync('apps/web/components/themes/LightModeTheme.tsx', content);
console.log('Fixed destructuring');
