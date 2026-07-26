import React from "react";
import type { FieldCardProps } from "./types";
import { ShortTextCard } from "./ShortTextCard";
import { LongTextCard } from "./LongTextCard";
import { EmailCard } from "./EmailCard";
import { PhoneCard } from "./PhoneCard";
import { WebsiteCard } from "./WebsiteCard";
import { NumberCard } from "./NumberCard";
import { DateCard } from "./DateCard";
import { MultipleChoiceCard } from "./MultipleChoiceCard";
import { DropdownCard } from "./DropdownCard";
import { SliderCard } from "./SliderCard";
import { RatingCard } from "./RatingCard";
import { CheckboxCard } from "./CheckboxCard";
import { ContactInfoCard } from "./ContactInfoCard";
import { AddressCard } from "./AddressCard";
import { WelcomeCard } from "./WelcomeCard";
import { ThankYouCard } from "./ThankYouCard";

export function DynamicFieldCard(props: FieldCardProps) {
  switch (props.question.fieldType) {
    case "SHORT_TEXT": return <ShortTextCard {...props} />;
    case "LONG_TEXT": return <LongTextCard {...props} />;
    case "EMAIL": return <EmailCard {...props} />;
    case "PHONE": return <PhoneCard {...props} />;
    case "WEBSITE": return <WebsiteCard {...props} />;
    case "NUMBER": return <NumberCard {...props} />;
    case "DATE": return <DateCard {...props} />;
    case "MULTIPLE_CHOICE": return <MultipleChoiceCard {...props} />;
    case "DROPDOWN": return <DropdownCard {...props} />;
    case "SLIDER": return <SliderCard {...props} />;
    case "RATING": return <RatingCard {...props} />;
    case "CHECKBOX": return <CheckboxCard {...props} />;
    case "CONTACT_INFO": return <ContactInfoCard {...props} />;
    case "ADDRESS": return <AddressCard {...props} />;
    case "WELCOME": return <WelcomeCard {...props} />;
    case "THANK_YOU": return <ThankYouCard {...props} />;
    default:
      return <div className="text-neutral-500 italic">Preview not available for {props.question.fieldType}</div>;
  }
}
