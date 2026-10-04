import {test} from "./fixtures.mjs";
import {runResponsiveQa} from "./orsira-responsive-qa-scenarios.mjs";
test("existing ORSIRA brand navigation focus and responsive checks",async({page,context,baseURL,runtimeErrors})=>{
  await runResponsiveQa({page,context,base:baseURL,runtimeErrors});
});
