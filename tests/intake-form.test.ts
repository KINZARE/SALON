import test from "node:test";
import assert from "node:assert/strict";
import { isIntakeFieldVisible, validateIntakeAnswers, validateIntakeDefinition } from "../src/domain/intake-form.ts";

test("intake form accepts supported field types and normalizes order", () => {
  const result = validateIntakeDefinition({ title:"Nieuwe klant", fields:[{label:"Naam voorkeur",type:"short_text",required:true},{label:"Akkoord",type:"consent",required:true}] });
  assert.equal(result.fields[0].sortOrder,0);
  assert.equal(result.fields[1].sortOrder,1);
});

test("intake form rejects unsupported types and empty labels", () => {
  assert.throws(() => validateIntakeDefinition({title:"Test",fields:[{label:"",type:"short_text",required:false}]}));
  assert.throws(() => validateIntakeDefinition({title:"Test",fields:[{label:"X",type:"file",required:false} as never]}));
});

test("conditional intake only allows dependencies on earlier fields", () => {
  const result=validateIntakeDefinition({
    title:"Conditional",
    fields:[
      {label:"Allergie?",type:"yes_no",required:true},
      {label:"Welke allergie?",type:"short_text",required:true,condition:{sourceSortOrder:0,operator:"equals",value:"yes"}},
    ],
  });
  assert.deepEqual(result.fields[1].condition,{sourceSortOrder:0,operator:"equals",value:"yes"});
  assert.throws(()=>validateIntakeDefinition({
    title:"Invalid",
    fields:[
      {label:"Eerste",type:"short_text",required:false},
      {label:"Tweede",type:"short_text",required:false,condition:{sourceSortOrder:1,operator:"equals",value:"x"}},
    ],
  }),/INVALID_CONDITION/);
});

test("hidden conditional required fields do not block submit and hidden answers are discarded", () => {
  const fields=[
    {id:"source",sortOrder:0,type:"yes_no" as const,required:true,options:[]},
    {id:"detail",sortOrder:1,type:"short_text" as const,required:true,options:[],condition:{sourceSortOrder:0,operator:"equals" as const,value:"yes"}},
  ];
  assert.equal(isIntakeFieldVisible(fields[1],fields,{source:"no"}),false);
  assert.deepEqual(validateIntakeAnswers(fields,{source:"no",detail:"should disappear"}),{source:"no"});
  assert.throws(()=>validateIntakeAnswers(fields,{source:"yes"}),/REQUIRED_FIELD_MISSING/);
});
