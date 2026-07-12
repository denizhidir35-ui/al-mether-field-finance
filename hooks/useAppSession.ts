"use client";

import { useCallback, useEffect, useState } from "react";
import { getAuthenticatedAppUser, signIn, signOut } from "@/core/auth/supabase-auth";
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

  const endSession = useCallback(async () => {
    await signOut();
    setUser(null);
  }, []);

  return { user, initialized, startSession, endSession };
}
