"use server";

// Dev-only stand-ins for the Treino actions: no database access.

function assertDev() {
  if (process.env.NODE_ENV !== "development") throw new Error("Not available");
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const FAIL = { ok: false as const, message: "Não foi possível salvar. Tente de novo." };

async function respond(fail: boolean) {
  assertDev();
  await sleep(400);
  return fail ? FAIL : { ok: true as const };
}

export async function mockStartSession(input: { workoutId: string }) {
  void input;
  assertDev();
  await sleep(400);
  return { ok: true as const, sessionId: "dev" };
}

export async function mockSaveSet(
  fail: boolean,
  input: { sessionId: string; workoutExerciseId: string; setNo: number; loadKg: number | null; reps: number },
) {
  void input;
  return respond(fail);
}

export async function mockDeleteSet(
  fail: boolean,
  input: { sessionId: string; workoutExerciseId: string; setNo: number },
) {
  void input;
  return respond(fail);
}

export async function mockFinishSession(fail: boolean, input: { sessionId: string }) {
  void input;
  const r = await respond(fail);
  return r.ok ? { ok: true as const, finishedAt: new Date().toISOString() } : r;
}

export async function mockDiscardSession(fail: boolean, input: { sessionId: string }) {
  void input;
  return respond(fail);
}

export async function mockLogCardio(fail: boolean, input: { minutes: number; rpe: number; modality: string }) {
  void input;
  return respond(fail);
}
