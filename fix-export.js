const fs = require('fs');

let content = fs.readFileSync('apps/web/components/themes/LightModeTheme.tsx', 'utf8');

// Replace component definition
content = content.replace(
  /export default function PublicFormPage[\s\S]*?const \[countryCodes, setCountryCodes\] = useState\(COUNTRY_CODES_FALLBACK\);/g,
  `export function LightModeTheme(props: ThemeProps) {
  const {
    mode, fields, answers, setAnswer, stepIndex, setStepIndex,
    handleNext, handleBack, handleSubmit, submitted, submitError, validationError,
    isUploading: isUploadingProp, shouldReduceMotion: shouldReduceMotionProp,
    isNavigating: isNavigatingProp, isCardShaking: isCardShakingProp,
    isSubmitting
  } = props;
  
  // Create local wrappers for setValidationError and setIsCardShaking since they are handled externally or can be local
  const [localValidationError, setLocalValidationError] = useState(validationError || "");
  const [localIsCardShaking, setLocalIsCardShaking] = useState(isCardShakingProp || false);
  const [localIsNavigating, setLocalIsNavigating] = useState(isNavigatingProp || false);

  useEffect(() => {
    if (validationError !== undefined) setLocalValidationError(validationError);
  }, [validationError]);

  const [ratingHover, setRatingHover] = useState(0);
  const [sliderValue, setSliderValue] = useState(50);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [phoneCountry, setPhoneCountry] = useState({ code: "US", flag: "🇺🇸", dialCode: "+1" });
  const [phoneSearch, setPhoneSearch] = useState("");
  const [phoneDropdownOpen, setPhoneDropdownOpen] = useState(false);
  const [countryCodes, setCountryCodes] = useState(COUNTRY_CODES_FALLBACK);`
);

fs.writeFileSync('apps/web/components/themes/LightModeTheme.tsx', content);
console.log('Fixed export');
