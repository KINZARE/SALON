// Compatibility entry point; Playwright Test owns browser lifecycle and artifacts.
import { spawnSync } from "node:child_process";
const result=spawnSync(process.execPath,["node_modules/@playwright/test/cli.js","test","--project=workspace"],{stdio:"inherit",env:process.env});
process.exit(result.status??1);
