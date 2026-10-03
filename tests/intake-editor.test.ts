import test from "node:test";
import assert from "node:assert/strict";
import { IntakeEditorSchema, serializeIntakeFields } from "../src/domain/intake-editor.ts";

test("intake draft validation and serialization keep types required and order",()=>{
  const fields=[{label:"Keuze",type:"select" as const,required:true,options:" A, B, "},{label:"Toestemming",type:"consent" as const,required:true,options:"old"}];
  assert.equal(IntakeEditorSchema.safeParse({title:"Test",fields}).success,true);
  assert.deepEqual(JSON.parse(serializeIntakeFields(fields)),[{label:"Keuze",type:"select",required:true,options:["A","B"]},{label:"Toestemming",type:"consent",required:true,options:[]}]);
  assert.equal(IntakeEditorSchema.safeParse({title:"Test",fields:[{...fields[0],options:" , "}]}).success,false);
  assert.equal(IntakeEditorSchema.safeParse({title:"Test",fields:Array(41).fill(fields[1])}).success,false);
});
