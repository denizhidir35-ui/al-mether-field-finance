"use client";

import { useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/core/supabase/client";
import type { ChiefAccount } from "../domain/chief-account";
import type { ChiefAuthRepository } from "../repositories/chief-auth.repository";
import { MemoryChiefAuthRepository } from "../repositories/memory-chief-auth.repository";
import { SupabaseChiefAuthRepository } from "../repositories/supabase-chief-auth.repository";

type ChiefAuthAdapter = ChiefAuthRepository & { signOut?: () => Promise<void> };

export function useChiefAuth() {
  const repository = useMemo<ChiefAuthAdapter>(() => {
    if (process.env.NODE_ENV === "development") return new MemoryChiefAuthRepository();
    if (!isSupabaseConfigured || !supabase) throw new Error("Production Chief Auth Supabase yap\u0131land\u0131rmas\u0131 gerektirir.");
    return new SupabaseChiefAuthRepository(supabase);
  }, []);
  const [chief, setChief] = useState<ChiefAccount | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function login(personnelNumber: string, password: string) {
    const authenticatedChief = await repository.authenticate(personnelNumber, password);
    if (!authenticatedChief) {
      setError("Personel No veya şifre doğrulanamadı.");
      return false;
    }
    setError(null);
    setChief(authenticatedChief);
    return true;
  }

  function loginDevelopment() {
    const developmentChief = repository.getDevelopmentAccount();
    if (!developmentChief) return false;
    setError(null);
    setChief(developmentChief);
    return true;
  }

  async function logout() {
    await repository.signOut?.();
    setChief(null);
  }

  return { chief, error, login, loginDevelopment, logout };
}
