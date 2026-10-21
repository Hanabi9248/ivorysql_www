import fs from "node:fs";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = fs.readFileSync(path.join(root, "src/lib/event-status.ts"), "utf8");
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ESNext },
}).outputText;
const { getEventStatus } = await import(
  "data:text/javascript;base64," + Buffer.from(js).toString("base64")
);
const live={date:'2026-10-21',startsAt:'2026-10-21T19:00:00+08:00'};
const campus={date:'2026-10-22',startsAt:'2026-10-22T08:30:00+08:00',endsAt:'2026-10-22T11:30:00+08:00'};
const cases=[
 ['live before start',live,'2026-10-21T18:59:59+08:00','upcoming'],
 ['live at start',live,'2026-10-21T19:00:00+08:00','ongoing'],
 ['live has no supplied end time',live,'2026-10-21T21:00:00+08:00','ongoing'],
 ['live next day',live,'2026-10-22T00:00:00+08:00','ended'],
 ['campus before start',campus,'2026-10-22T08:29:59+08:00','upcoming'],
 ['campus underway',campus,'2026-10-22T10:00:00+08:00','ongoing'],
 ['campus at end',campus,'2026-10-22T11:30:00+08:00','ended'],
 ['date-only afternoon',{date:'2026-10-21'},'2026-10-21T16:00:00+08:00','ongoing'],
 ['multi-day final afternoon',{date:'2026-10-20',endDate:'2026-10-22'},'2026-10-22T16:00:00+08:00','ongoing'],
 ['same instant in UTC',live,'2026-10-21T10:59:59Z','upcoming'],
];
for(const [label,event,now,wanted]of cases)assert.equal(getEventStatus(event,new Date(now)),wanted,label);
console.log(`PASS: ${cases.length} time-boundary and timezone checks`);
