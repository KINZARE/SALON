import test from "node:test";
import assert from "node:assert/strict";
import { IntakeEditorSchema, serializeIntakeFields } from "../src/domain/intake-editor.ts";
import { zodResolver } from "@hookform/resolvers/zod";

test("intake draft validation and serialization keep types required and order",()=>{
  const fields=[{label:"Keuze",type:"select" as const,required:true,options:" A, B, "},{label:"Toestemming",type:"consent" as const,required:true,options:"old"}];
  assert.equal(IntakeEditorSchema.safeParse({title:"Test",fields}).success,true);
  assert.deepEqual(JSON.parse(serializeIntakeFields(fields)),[{label:"Keuze",type:"select",required:true,options:["A","B"]},{label:"Toestemming",type:"consent",required:true,options:[]}]);
  assert.equal(IntakeEditorSchema.safeParse({title:"Test",fields:[{...fields[0],options:" , "}]}).success,false);
  assert.equal(IntakeEditorSchema.safeParse({title:"Test",fields:Array(41).fill(fields[1])}).success,false);
});

test("official resolver preserves Mini schema normalization and field errors",async()=>{
  const resolver=zodResolver(IntakeEditorSchema);
  const options={fields:{},shouldUseNativeValidation:false};
  const fields=[{label:" Vraag ",type:"select" as const,required:true,options:"A, B"}];
  const valid=await resolver({title:" Test ",fields},{},options);
  assert.equal(valid.values.title,"Test");
  assert.equal(valid.values.fields[0].label,"Vraag");
  const invalid=await resolver({title:"Test",fields:[{...fields[0],options:" , "}]},{},options);
  assert.ok(invalid.errors.fields?.[0]?.options);
});
