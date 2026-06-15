import assert from "node:assert/strict";
import test from "node:test";

import { findNextMadridMondayAt10 } from "../src/infrastructure/scheduling/weekly-bmsb-scheduler.ts";

test("schedules Monday 10:00 Madrid in summer using CEST", () => {
  const next = findNextMadridMondayAt10(new Date("2026-06-14T12:00:00.000Z"));

  assert.equal(next.toISOString(), "2026-06-15T08:00:00.000Z");
});

test("schedules Monday 10:00 Madrid in winter using CET", () => {
  const next = findNextMadridMondayAt10(new Date("2026-01-04T12:00:00.000Z"));

  assert.equal(next.toISOString(), "2026-01-05T09:00:00.000Z");
});

test("moves to the following week after the scheduled minute", () => {
  const next = findNextMadridMondayAt10(new Date("2026-06-15T08:00:01.000Z"));

  assert.equal(next.toISOString(), "2026-06-22T08:00:00.000Z");
});
