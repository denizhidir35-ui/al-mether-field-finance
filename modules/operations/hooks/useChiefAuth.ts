"use client";

import { useMemo, useState } from "react";
import type { ChiefAccount } from "../domain/chief-account";
import { MemoryChiefAuthRepository } from "../repositories/memory-chief-auth.repository";

export function useChiefAuth() {
  const repository = useMemo(() => new MemoryChiefAuthRepository(), []);
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

  return { chief, error, login, logout: () => setChief(null) };
}
