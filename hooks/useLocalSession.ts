"use client";

import { useCallback, useEffect, useState } from "react";
import { clearSession, readSession, writeSession } from "@/core/auth/session";
import type { AppUser } from "@/types/auth";

export function useLocalSession() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    setUser(readSession());
    setInitialized(true);
  }, []);

  const startSession = useCallback((authenticatedUser: AppUser) => {
    writeSession(authenticatedUser);
    setUser(authenticatedUser);
  }, []);

  const endSession = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  return { user, initialized, startSession, endSession };
}

