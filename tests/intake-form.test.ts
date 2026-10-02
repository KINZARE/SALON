import test from "node:test";
import assert from "node:assert/strict";
import { validateIntakeDefinition } from "../src/domain/intake-form.ts";

test("intake form accepts supported field types and normalizes order", () => {
  const result = validateIntakeDefinition({ title:"Nieuwe klant", fields:[{label:"Naam voorkeur",type:"short_text",required:true},{label:"Akkoord",type:"consent",required:true}] });
  assert.equal(result.fields[0].sortOrder,0);
  assert.equal(result.fields[1].sortOrder,1);
});

test("intake form rejects unsupported types and empty labels", () => {
  assert.throws(() => validateIntakeDefinition({title:"Test",fields:[{label:"",type:"short_text",required:false}]}));
  assert.throws(() => validateIntakeDefinition({title:"Test",fields:[{label:"X",type:"file",required:false} as never]}));
});
