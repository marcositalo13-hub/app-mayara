"use server";

// Dev-only stand-ins for the real actions: no database access.
import type { ActionResult } from "@/lib/data/today-types";

function assertDev() {
  if (process.env.NODE_ENV !== "development") throw new Error("Not available");
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function respond(fail: boolean): Promise<ActionResult> {
  assertDev();
  await sleep(500);
  return fail ? { ok: false, message: "Não foi possível salvar. Tente de novo." } : { ok: true };
}

export async function mockSetMealDone(
  fail: boolean,
  input: { mealId: string; optionId: string; done: boolean },
): Promise<ActionResult> {
  void input;
  return respond(fail);
}

export async function mockSetWater(fail: boolean, input: { ml: number }): Promise<ActionResult> {
  void input;
  return respond(fail);
}

export async function mockSignOut(): Promise<void> {
  assertDev();
}
