import {test} from "./fixtures.mjs";
import {runWorkspaceQa} from "./workspace-browser-qa-scenarios.mjs";
test("existing workspace flows and nine responsive widths",async({page,context,baseURL,runtimeErrors,qaCalendarDate})=>{
  await runWorkspaceQa({page,context,base:baseURL,runtimeErrors,qaCalendarDate});
});
