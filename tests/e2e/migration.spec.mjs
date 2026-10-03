import {randomUUID} from "node:crypto";
import {test,expect,qaDatabase} from "./fixtures.mjs";

test("malformed API bodies are rejected before mutations",async({request})=>{
  const paths=["/api/public/salon/book","/api/public/salon/waitlist","/api/internal/book","/api/internal/reschedule","/api/internal/move","/api/internal/booking-links","/api/book-link/invalid/book","/api/self-service/invalid/reschedule"];
  for(const path of paths)for(const payload of [null,[],{}]) {
    const response=await request.post(path,{data:JSON.stringify(payload),headers:{"content-type":"application/json"}});
    expect(response.status(),`${path}: ${JSON.stringify(payload)}`).toBe(400);
  }
  expect((await request.get("/api/internal/reports/export?preset=custom&from=2026-02-30&to=2026-03-01")).status()).toBe(400);
});

test("intake arrays preserve edits through move remove validation save and refresh",async({page,runtimeErrors})=>{
  const title=`QA migration ${randomUUID()}`;
  const db=qaDatabase();
  const {data:salon,error}=await db.from("salons").select("id").eq("slug","salon").single();
  if(error)throw error;
  try {
    await page.goto("/app/intake");
    const form=page.locator("form").filter({has:page.getByRole("heading",{name:"Nieuw intakeformulier",exact:true})});
    await form.getByLabel("Titel",{exact:true}).fill(title);
    await form.getByRole("button",{name:"Formulier toevoegen",exact:true}).click();
    await expect(form.getByRole("alert")).toBeVisible();
    await form.getByLabel("Label veld 1",{exact:true}).fill("Eerste vraag");
    await form.getByRole("button",{name:"+ Veld",exact:true}).click();
    await form.getByLabel("Label veld 2",{exact:true}).fill("Keuzevraag");
    await form.getByLabel("Type veld 2",{exact:true}).selectOption("select");
    await form.getByLabel("Opties veld 2",{exact:true}).fill("A, B");
    await form.getByRole("checkbox",{name:"Verplicht",exact:true}).nth(1).check();
    await form.getByRole("button",{name:"Omhoog",exact:true}).nth(1).click();
    await expect(form.getByLabel("Label veld 1",{exact:true})).toHaveValue("Keuzevraag");
    await expect(form.getByLabel("Opties veld 1",{exact:true})).toHaveValue("A, B");
    await expect(form.getByRole("checkbox",{name:"Verplicht",exact:true}).first()).toBeChecked();
    await form.getByRole("button",{name:"Verwijder",exact:true}).nth(1).click();
    await form.getByLabel("Opties veld 1",{exact:true}).fill(" , ");
    await form.getByRole("button",{name:"Formulier toevoegen",exact:true}).click();
    await expect(form.getByRole("alert")).toBeVisible();
    await form.getByLabel("Opties veld 1",{exact:true}).fill("A, B");
    await form.getByRole("button",{name:"+ Veld",exact:true}).click();
    await form.getByLabel("Label veld 2",{exact:true}).fill("Akkoord");
    await form.getByLabel("Type veld 2",{exact:true}).selectOption("consent");
    await form.getByLabel(/^Toestemmingstekst \(optioneel\)/).fill("QA toestemming");
    await form.locator('input[name="serviceIds"]').first().check();
    await form.getByRole("button",{name:"Formulier toevoegen",exact:true}).click();
    await page.waitForURL(/\/app\/intake\?saved=1$/);
    await page.reload();
    await expect(page.getByText(title,{exact:true})).toBeVisible();
    const {data:saved,error:savedError}=await db.from("intake_forms").select("id,consent_statement,version").eq("salon_id",salon.id).eq("title",title).single();
    if(savedError)throw savedError;
    expect(saved.consent_statement).toBe("QA toestemming");
    const {data:fields,error:fieldError}=await db.from("intake_form_fields").select("label,field_type,required,options").eq("form_id",saved.id).order("sort_order");
    if(fieldError)throw fieldError;
    expect(fields).toEqual([{label:"Keuzevraag",field_type:"select",required:true,options:["A","B"]},{label:"Akkoord",field_type:"consent",required:false,options:[]}]);
    const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1);
    expect(overflow).toBe(false);
    expect(runtimeErrors).toEqual([]);
  } finally {
    const {error:cleanupError}=await db.from("intake_forms").delete().eq("salon_id",salon.id).eq("title",title);
    if(cleanupError)throw cleanupError;
  }
});
