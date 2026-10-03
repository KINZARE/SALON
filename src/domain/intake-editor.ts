import { z } from "zod";
import { INTAKE_FIELD_TYPES } from "./intake-form.ts";

export const IntakeEditorSchema = z.object({
  title: z.string().trim().min(1, "Vul een titel in.").max(120),
  fields: z.array(z.object({
    label: z.string().trim().min(1, "Vul een label in.").max(180),
    type: z.enum(INTAKE_FIELD_TYPES),
    required: z.boolean(),
    options: z.string(),
  }).refine(field => field.type !== "select" || field.options.split(",").some(option => option.trim()), {
    path: ["options"], message: "Voeg minstens één keuze toe.",
  })).min(1).max(40, "Gebruik maximaal 40 velden."),
});
export type IntakeEditorValues = z.infer<typeof IntakeEditorSchema>;
export function serializeIntakeFields(fields: IntakeEditorValues["fields"]) {
  return JSON.stringify(fields.map(field => ({
    label: field.label, type: field.type, required: field.required,
    options: field.type === "select" ? field.options.split(",").map(value => value.trim()).filter(Boolean) : [],
  })));
}
