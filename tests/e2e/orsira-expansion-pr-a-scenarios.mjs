import assert from "node:assert/strict";

export async function runExpansionPrAQa({page,base}) {
  await page.setViewportSize({width:390,height:900});
  await page.goto(base+"/app/intake",{waitUntil:"networkidle"});
  const intake=page.locator("[data-intake-workspace]");
  await intake.waitFor();
  const newForm=intake.locator("section").filter({hasText:"Formulier toevoegen"});
  await newForm.getByRole("button",{name:"+ Veld",exact:true}).click();
  const conditionSource=newForm.getByLabel("Voorwaarde bron veld 2");
  await conditionSource.waitFor();
  assert.equal(await conditionSource.isVisible(),true,"Second intake field must expose an earlier-field condition selector");
  assert.ok((await conditionSource.locator("option").allTextContents()).some(label=>label.includes("Veld 1")),"Conditional intake may depend on the earlier first field");

  await page.goto(base+"/app/waitlist",{waitUntil:"networkidle"});
  const waitlist=page.locator("[data-waitlist-workspace]");
  await waitlist.waitFor();
  await page.getByText(/Een aanbod reserveert de agenda niet/i).waitFor();
  const offerAction=page.getByRole("button",{name:"Bied eerstvolgende plek aan"});
  const activeOfferAction=page.getByRole("button",{name:"Trek aanbod in"});
  const emptyState=page.getByText("Niemand wacht op een plek.",{exact:true});
  assert.ok(
    await offerAction.count()>0||await activeOfferAction.count()>0||await emptyState.count()>0,
    "Waitlist must expose an offer action, active offer state, or explicit empty state",
  );
  if(await activeOfferAction.count()>0){
    await page.getByText(/Aanbod ·/).first().waitFor();
    await page.getByText(/niet gereserveerd/i).first().waitFor();
  }
}
