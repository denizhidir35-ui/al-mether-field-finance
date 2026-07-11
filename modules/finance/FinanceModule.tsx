"use client";

import { useState } from "react";
import { Plus, WalletCards } from "lucide-react";
import type { AppUser } from "@/types/auth";
import { supabase } from "@/core/supabase/client";
import { Metric } from "@/components/ui/Metric";
import { formatTry } from "@/core/formatters/currency";
import { useFinanceEntries } from "./useFinanceEntries";

type FinanceModuleProps = {
  user: AppUser;
};

export function FinanceModule({ user }: FinanceModuleProps) {
  const { entries, totals, reload } = useFinanceEntries();
  const [type, setType] = useState<"income" | "expense">("income");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Hakediş");
  const [amount, setAmount] = useState("");

  async function saveEntry() {
    const db = supabase;

    if (!db) {
      alert("Supabase bağlantısı henüz kurulmadı.");
      return;
    }

    if (!title.trim() || Number(amount) <= 0) {
      alert("Açıklama ve geçerli tutar gir.");
      return;
    }

    const { error } = await db.from("finance_entries").insert({
      company_id: "al_mether",
      type,
      title: title.trim(),
      category,
      amount: Number(amount),
      status: type === "income" ? "Bekleyen Tahsilat" : "Bekleyen Ödeme",
      created_by: user.email
    });

    if (error) {
      alert(error.message);
      return;
    }

    setTitle("");
    setAmount("");
    await reload();
  }

  return (
    <div className="space-y-3.5">
      <header className="mether-surface rounded-[26px] p-4 sm:p-5">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-400/80">
          Finance
        </div>
        <h1 className="mt-2 text-2xl font-black tracking-[-0.04em] text-white sm:text-[30px]">
          Para yönetimi
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Gelir, gider, tahsilat, ödeme ve ortak şirket bakiyesi.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Net bakiye"
          value={formatTry(totals.balance)}
          icon={<WalletCards size={17} />}
          tone={totals.balance >= 0 ? "positive" : "negative"}
          emphasis
        />
        <Metric label="Toplam gelir" value={formatTry(totals.income)} tone="positive" />
        <Metric label="Toplam gider" value={formatTry(totals.expense)} tone="negative" />
        <Metric label="Kayıt sayısı" value={String(entries.length)} />
      </section>

      <section className="grid gap-3.5 xl:grid-cols-[.78fr_1.22fr]">
        <article className="mether-surface rounded-[24px] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">
                New transaction
              </div>
              <h2 className="mt-1 text-lg font-bold text-white">
                Finans kaydı
              </h2>
            </div>

            <div className="flex rounded-xl border border-white/[0.07] bg-black/20 p-1">
              <button
                onClick={() => {
                  setType("income");
                  setCategory("Hakediş");
                }}
                className={`rounded-lg px-3 py-1.5 text-[10px] font-bold ${
                  type === "income"
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "text-slate-600"
                }`}
              >
                Gelir
              </button>

              <button
                onClick={() => {
                  setType("expense");
                  setCategory("Yakıt");
                }}
                className={`rounded-lg px-3 py-1.5 text-[10px] font-bold ${
                  type === "expense"
                    ? "bg-rose-500/15 text-rose-300"
                    : "text-slate-600"
                }`}
              >
                Gider
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            <input
              value={title}
              onChange={event => setTitle(event.target.value)}
              className="mether-input h-11 rounded-xl px-3 text-sm"
              placeholder="Açıklama"
            />

            <select
              value={category}
              onChange={event => setCategory(event.target.value)}
              className="mether-input h-11 rounded-xl px-3 text-sm"
            >
              {type === "income" ? (
                <>
                  <option>Hakediş</option>
                  <option>Fiber iş</option>
                  <option>Tahsilat</option>
                  <option>Ek iş</option>
                </>
              ) : (
                <>
                  <option>Yakıt</option>
                  <option>Araç</option>
                  <option>Personel</option>
                  <option>Malzeme</option>
                  <option>Fatura</option>
                  <option>Diğer</option>
                </>
              )}
            </select>

            <input
              value={amount}
              onChange={event => setAmount(event.target.value)}
              type="number"
              className="mether-input h-11 rounded-xl px-3 text-sm"
              placeholder="Tutar"
            />

            <button
              onClick={() => void saveEntry()}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-bold text-white transition hover:bg-blue-500"
            >
              <Plus size={16} />
              Kaydet
            </button>
          </div>
        </article>

        <article className="mether-surface rounded-[24px] p-4">
          <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">
            Shared finance stream
          </div>
          <h2 className="mt-1 text-lg font-bold text-white">
            Ortak kayıtlar
          </h2>

          <div className="mether-scroll mt-3 max-h-[430px] overflow-auto">
            {entries.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/[0.08] p-8 text-center text-xs text-slate-600">
                Henüz ortak finans kaydı yok.
              </div>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {entries.map(entry => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold text-slate-200">
                        {entry.title}
                      </div>
                      <div className="mt-1 truncate text-[10px] text-slate-600">
                        {entry.category} · {entry.created_by} ·{" "}
                        {new Date(entry.created_at).toLocaleString("tr-TR")}
                      </div>
                    </div>

                    <div
                      className={`shrink-0 text-xs font-black ${
                        entry.type === "income"
                          ? "text-emerald-400"
                          : "text-rose-400"
                      }`}
                    >
                      {entry.type === "income" ? "+" : "-"}
                      {formatTry(Number(entry.amount))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
