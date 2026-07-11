"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/core/supabase/client";
import type { FinanceEntry } from "./types";

export function useFinanceEntries() {
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEntries = useCallback(async () => {
    const db = supabase;

    if (!db) {
      setLoading(false);
      return;
    }

    const { data } = await db
      .from("finance_entries")
      .select("*")
      .eq("company_id", "al_mether")
      .order("created_at", { ascending: false });

    setEntries((data ?? []) as FinanceEntry[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    const db = supabase;
    void loadEntries();

    if (!db) return;

    const channel = db
      .channel("al-mether-finance-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "finance_entries"
        },
        () => void loadEntries()
      )
      .subscribe();

    return () => {
      void db.removeChannel(channel);
    };
  }, [loadEntries]);

  const totals = useMemo(() => {
    const income = entries
      .filter(entry => entry.type === "income")
      .reduce((total, entry) => total + Number(entry.amount), 0);

    const expense = entries
      .filter(entry => entry.type === "expense")
      .reduce((total, entry) => total + Number(entry.amount), 0);

    return {
      income,
      expense,
      balance: income - expense
    };
  }, [entries]);

  return {
    entries,
    totals,
    loading,
    reload: loadEntries
  };
}