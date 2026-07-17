"use client";

import { useCallback, useEffect, useState } from "react";
import { completeEmployeeActivation, getAuthenticatedAppUser, requestEmployeeActivation, signIn, signInEmployee, signOut } from "@/core/auth/supabase-auth";
import { supabase } from "@/core/supabase/client";
import type { AppUser } from "@/types/auth";

export function useAppSession() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let active = true;

    void getAuthenticatedAppUser()
      .then(currentUser => { if (active) setUser(currentUser); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setInitialized(true); });

    const listener = supabase?.auth.onAuthStateChange(event => {
      if (event === "SIGNED_OUT") setUser(null);
    });

    return () => {
      active = false;
      listener?.data.subscription.unsubscribe();
    };
  }, []);

  const startSession = useCallback(async (email: string, password: string) => {
    const authenticatedUser = await signIn(email, password);
    setUser(authenticatedUser);
  }, []);

  const startDevelopmentSession = useCallback((code: "CMTHR01" | "CMTHR02") => {
    if (process.env.NODE_ENV !== "development") throw new Error("Geliştirme oturumu üretimde kullanılamaz.");
    const account = code === "CMTHR01"
      ? { id: code, name: "Deniz Hıdır", email: "denizhidir@almether.com" }
      : { id: code, name: "Aytaç Türkbay", email: "aytacturkbay@almether.com" };
    setUser({ ...account, platformUserCode: code, companyId: "al_mether", role: "CEO", title: "CEO Developer" });
  }, []);

  const startEmployeeSession = useCallback(async (phone: string, password: string) => {
    const authenticatedUser = await signInEmployee(phone, password);
    setUser(authenticatedUser);
  }, []);

  const activateEmployee = useCallback(async (phone: string, token: string, password: string) => {
    const authenticatedUser = await completeEmployeeActivation(phone, token, password);
    setUser(authenticatedUser);
  }, []);

  const endSession = useCallback(async () => {
    await signOut();
    setUser(null);
  }, []);

  return { user, initialized, startSession, startEmployeeSession, requestEmployeeActivation, activateEmployee, startDevelopmentSession, endSession };
}
