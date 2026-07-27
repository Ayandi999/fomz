const fs = require('fs');

let content = fs.readFileSync('apps/web/app/share/[slug]/page.tsx', 'utf8');

// The marker where the UI rendering starts
const marker = '  // Render thank you page';
const index = content.indexOf(marker);

if (index !== -1) {
  const newReturn = `
  const ThemeComponent = themeRegistry[themeKey || "lightMode"] || themeRegistry["lightMode"];

  return (
    <ThemeComponent
      mode="public"
      fields={topLevelFields as any}
      answers={answers}
      setAnswer={setAnswer}
      stepIndex={stepIndex}
      setStepIndex={setStepIndex}
      handleNext={handleNext}
      handleBack={handleBack}
      handleSubmit={handleSubmit}
      submitted={submitted}
      submitError={submitError}
      validationError={validationError}
      isUploading={isUploading}
      shouldReduceMotion={shouldReduceMotion}
      isNavigating={isNavigating}
      isCardShaking={isCardShaking}
    />
  );
}
`;
  
  content = content.substring(0, index) + newReturn;
  fs.writeFileSync('apps/web/app/share/[slug]/page.tsx', content);
  console.log("Successfully truncated and replaced return block");
} else {
  console.log("Marker not found, could not replace.");
}
