"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Battlecard } from "@/lib/types";
import { DEMO_PROJECT_ID } from "@/lib/constants";

interface BattlecardRow {
  competitor_name: string;
  content: Battlecard;
}

export default function BattlecardsPage() {
  const [battlecards, setBattlecards] = useState<BattlecardRow[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchBattlecards = async () => {
      const { data } = await supabase
        .from("battlecards")
        .select("competitor_name, content")
        .eq("project_id", DEMO_PROJECT_ID)
        .order("generated_at", { ascending: false });

      if (data && data.length > 0) {
        const seen = new Set<string>();
        const deduped = (data as BattlecardRow[]).filter((row) => {
          if (seen.has(row.competitor_name)) return false;
          seen.add(row.competitor_name);
          return true;
        });
        setBattlecards(deduped);
        setActiveTab(deduped[0].competitor_name);
      }
      setLoading(false);
    };

    fetchBattlecards();
  }, [supabase]);

  const activeCard = battlecards.find((b) => b.competitor_name === activeTab)?.content;

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-10 px-8">
        <p className="text-base text-slate-500">Loading battlecards…</p>
      </div>
    );
  }

  if (battlecards.length === 0) {
    return (
      <div className="py-10 px-8">
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white py-24 text-center">
          <p className="text-base font-semibold text-slate-800">No battlecards yet.</p>
          <p className="mt-2 text-base text-slate-500">
            Run analysis from the Dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-10 px-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Battlecards</h1>
        <p className="mt-2 text-base text-slate-500">
          How Stripe wins against Adyen
        </p>
      </div>

      {/* Tab switcher */}
      {battlecards.length > 1 && (
        <div className="mb-8 flex gap-0 border-b border-slate-200">
          {battlecards.map((b) => (
            <button
              key={b.competitor_name}
              onClick={() => setActiveTab(b.competitor_name)}
              className={`-mb-px border-b-2 px-5 py-3 text-base font-medium transition-colors ${
                activeTab === b.competitor_name
                  ? "border-violet-600 text-violet-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {b.competitor_name}
            </button>
          ))}
        </div>
      )}

      {activeCard && (
        <div className="flex flex-col gap-8">
          {/* 1. One-liner hero */}
          <div className="rounded-xl bg-[#0F1729] px-10 py-10 text-center">
            <p className="text-sm font-medium uppercase tracking-widest text-white/40">
              One-liner
            </p>
            <p className="mt-4 text-xl font-semibold leading-relaxed text-white">
              &ldquo;{activeCard.one_liner}&rdquo;
            </p>
          </div>

          {/* 2. Strengths & Weaknesses */}
          <div className="grid gap-6 sm:grid-cols-2">
            {/* Strengths */}
            <div className="rounded-xl border border-slate-200 bg-emerald-50 shadow-sm p-6">
              <h2 className="mb-4 text-base font-semibold text-slate-800">
                Strengths
              </h2>
              <ul className="flex flex-col gap-3">
                {activeCard.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" />
                    <span className="text-base leading-relaxed text-slate-700">{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="rounded-xl border border-slate-200 bg-red-50 shadow-sm p-6">
              <h2 className="mb-4 text-base font-semibold text-slate-800">
                Weaknesses
              </h2>
              <ul className="flex flex-col gap-3">
                {activeCard.weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />
                    <span className="text-base leading-relaxed text-slate-700">{w}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 3. When We Win / When We Lose */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-200 bg-white shadow-sm p-6">
              <h2 className="mb-3 text-base font-semibold text-emerald-700">
                When We Win
              </h2>
              <p className="text-base leading-relaxed text-slate-700">
                {activeCard.when_we_win}
              </p>
            </div>

            <div className="rounded-xl border border-red-200 bg-white shadow-sm p-6">
              <h2 className="mb-3 text-base font-semibold text-red-700">
                When We Lose
              </h2>
              <p className="text-base leading-relaxed text-slate-700">
                {activeCard.when_we_lose}
              </p>
            </div>
          </div>

          {/* 4. Objection Handles — native <details>/<summary> accordions */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">
              Objection Handles
            </h2>
            <div>
              {activeCard.objection_handles.map((oh, i) => (
                <details
                  key={i}
                  className="mb-3 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 font-semibold text-base text-slate-900 marker:hidden [&::-webkit-details-marker]:hidden">
                    <span className="pr-4 leading-snug">
                      &ldquo;{oh.objection}&rdquo;
                    </span>
                    <span
                      className={`flex-shrink-0 rounded-full px-3 py-1 text-sm font-medium ${
                        oh.source === "customer_language"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {oh.source === "customer_language" ? "Customer Language" : "Inferred"}
                    </span>
                  </summary>
                  <div className="px-5 pb-5 pt-1 text-base leading-relaxed text-slate-700 border-t border-slate-100">
                    {oh.response}
                  </div>
                </details>
              ))}
            </div>
          </section>

          {/* 5. Customer Language Pills */}
          {activeCard.customer_language_to_use && activeCard.customer_language_to_use.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold text-slate-900">
                Customer Language to Use
              </h2>
              <div className="flex flex-wrap gap-3">
                {activeCard.customer_language_to_use.map((phrase, i) => (
                  <span
                    key={i}
                    className="rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-base font-medium text-violet-800"
                  >
                    {phrase}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* 6. Pricing Intelligence (if present) */}
          {activeCard.pricing_section && (
            <section>
              <h2 className="mb-6 text-lg font-semibold text-slate-900">
                Pricing Intelligence
              </h2>

              <div className="flex flex-col gap-6">
                {/* Adyen's pricing weaknesses */}
                {activeCard.pricing_section.adyen_pricing_weaknesses.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
                    <h3 className="mb-4 text-base font-semibold text-red-700">
                      Adyen&apos;s Pricing Weaknesses
                    </h3>
                    <ul className="flex flex-col gap-3">
                      {activeCard.pricing_section.adyen_pricing_weaknesses.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-red-500" />
                          <span className="text-base leading-relaxed text-slate-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Stripe's pricing positives */}
                {activeCard.pricing_section.stripe_pricing_positives.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
                    <h3 className="mb-4 text-base font-semibold text-emerald-700">
                      Stripe&apos;s Pricing Advantages
                    </h3>
                    <ul className="flex flex-col gap-3">
                      {activeCard.pricing_section.stripe_pricing_positives.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" />
                          <span className="text-base leading-relaxed text-slate-700">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Pricing objection handles — mini accordions */}
                {activeCard.pricing_section.pricing_objection_handles.length > 0 && (
                  <div>
                    <h3 className="mb-4 text-base font-semibold text-slate-800">
                      Pricing Objection Handles
                    </h3>
                    {activeCard.pricing_section.pricing_objection_handles.map((oh, i) => (
                      <details
                        key={i}
                        className="mb-3 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 font-semibold text-base text-slate-900 marker:hidden [&::-webkit-details-marker]:hidden">
                          <span className="pr-4 leading-snug">
                            &ldquo;{oh.objection}&rdquo;
                          </span>
                        </summary>
                        <div className="px-5 pb-5 pt-1 text-base leading-relaxed text-slate-700 border-t border-slate-100">
                          {oh.response}
                        </div>
                      </details>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
