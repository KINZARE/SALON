export const INTAKE_FIELD_TYPES=["short_text","long_text","yes_no","select","checkbox","date","consent"] as const;
export type IntakeFieldType=typeof INTAKE_FIELD_TYPES[number];
