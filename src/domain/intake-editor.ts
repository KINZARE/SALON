import * as z from "zod/mini";
import { INTAKE_FIELD_TYPES } from "./intake-types.ts";

export const IntakeEditorSchema = z.object({
  title: z.string().check(z.trim(), z.minLength(1, "Vul een titel in."), z.maxLength(120)),
  fields: z.array(z.object({
    label: z.string().check(z.trim(), z.minLength(1, "Vul een label in."), z.maxLength(180)),
    type: z.enum(INTAKE_FIELD_TYPES),
    required: z.boolean(),
    options: z.string(),
  }).check(z.refine(field => field.type !== "select" || field.options.split(",").some(option => option.trim()), {
    path: ["options"], error: "Voeg minstens één keuze toe.",
  }))).check(z.minLength(1), z.maxLength(40, "Gebruik maximaal 40 velden.")),
});
export type IntakeEditorValues = z.infer<typeof IntakeEditorSchema>;
export function serializeIntakeFields(fields: IntakeEditorValues["fields"]) {
  return JSON.stringify(fields.map(field => ({
    label: field.label, type: field.type, required: field.required,
    options: field.type === "select" ? field.options.split(",").map(value => value.trim()).filter(Boolean) : [],
  })));
}
