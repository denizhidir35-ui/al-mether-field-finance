"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { HrCreateCommand, HrFoundationSnapshot } from "../domain/hr-foundation";
import { HttpHrRepository } from "../repositories/http-hr.repository";

export function useHrFoundation() {
  const repository = useMemo(() => new HttpHrRepository(), []);
  const [snapshot, setSnapshot] = useState<HrFoundationSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try { setSnapshot(await repository.loadFoundation()); setError(""); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "HR Foundation yüklenemedi."); }
    finally { setLoading(false); }
  }, [repository]);

  useEffect(() => { void refresh(); }, [refresh]);

  const execute = useCallback(async (command: HrCreateCommand) => {
    setLoading(true);
    try { setSnapshot(await repository.execute(command)); setError(""); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "HR işlemi tamamlanamadı."); throw reason; }
    finally { setLoading(false); }
  }, [repository]);

  return { snapshot, loading, error, refresh, execute };
}
