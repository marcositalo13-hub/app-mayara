"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/data/today-types";

export const WATER_MAX_ML = 6000;
const WATER_DEBOUNCE_MS = 600;
const GOAL_TOAST_KEY = "mayara:water-goal-on";

type UseWaterLogOptions = {
  /** Today's ml as last read from the server. */
  serverMl: number;
  goalMl: number;
  /** 'YYYY-MM-DD' from the server (never the client clock). */
  today: string;
  setWater: (input: { ml: number }) => Promise<ActionResult>;
};

/**
 * Today's water with instant UI: taps change a draft immediately, rapid taps collapse
 * into one debounced write, failures roll back with a toast, and a pending write is sent
 * right away if the app is hidden or the page unmounts.
 * "Meta de água batida" is toasted at most once per day (and once per page load without storage).
 */
export function useWaterLog({ serverMl, goalMl, today, setWater }: UseWaterLogOptions) {
  // Confirmed value follows the server whenever fresh props arrive.
  const [syncedMl, setSyncedMl] = useState(serverMl);
  const [confirmedMl, setConfirmedMl] = useState(serverMl);
  if (syncedMl !== serverMl) {
    setSyncedMl(serverMl);
    setConfirmedMl(serverMl);
  }

  const [optimisticMl, setOptimisticMl] = useOptimistic(confirmedMl);
  const [draftMl, setDraftMl] = useState<number | null>(null);
  const waterMl = draftMl ?? optimisticMl;

  const [, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingMl = useRef<number | null>(null);
  const confirmedRef = useRef(serverMl);
  const toastedThisLoad = useRef(false);

  function announceGoal() {
    if (toastedThisLoad.current) return;
    toastedThisLoad.current = true;
    try {
      if (localStorage.getItem(GOAL_TOAST_KEY) === today) return;
      localStorage.setItem(GOAL_TOAST_KEY, today);
    } catch {}
    toast.success("Meta de água batida");
  }

  function save(ml: number) {
    startTransition(async () => {
      setOptimisticMl(ml);
      setDraftMl(null);
      const result = await setWater({ ml });
      if (!result.ok) {
        toast.error(result.message, { id: "save-error" });
        return;
      }
      const before = confirmedRef.current;
      confirmedRef.current = ml;
      setConfirmedMl(ml);
      if (before < goalMl && ml >= goalMl) announceGoal();
    });
  }

  /** Set today's total (clamped to 0..6000, multiples of 250 expected). */
  function setMl(next: number) {
    const ml = Math.min(WATER_MAX_ML, Math.max(0, next));
    setDraftMl(ml);
    pendingMl.current = ml;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      pendingMl.current = null;
      save(ml);
    }, WATER_DEBOUNCE_MS);
  }

  /** Add/remove from the latest value, including taps not rendered yet. */
  function addMl(delta: number) {
    setMl((pendingMl.current ?? waterMl) + delta);
  }

  const saveRef = useRef<(ml: number) => void>(() => {});
  useEffect(() => {
    saveRef.current = save;
  });
  useEffect(() => {
    const flush = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
      if (pendingMl.current === null) return;
      const ml = pendingMl.current;
      pendingMl.current = null;
      saveRef.current(ml);
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      flush();
    };
  }, []);

  return { waterMl, setMl, addMl };
}
