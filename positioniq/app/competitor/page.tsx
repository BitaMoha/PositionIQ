"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CompetitorAnalysis } from "@/lib/types";
import { DEMO_PROJECT_ID } from "@/lib/constants";

function transparencyBadgeClass(level: "high" | "medium" | "low") {
  if (level === "high") return "bg-emerald-100 text-emerald-700";
  if (level === "medium") return "bg-amber-100 text-amber-700";
  return "bg-red-100 text-red-700";
}

export default function CompetitorPage() {
  const [competitors, setCompetitors] = useState<CompetitorAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchCompetitors = async () => {
      const { data } = await supabase
        .from("competitor_snapshots")
        .select("company_name, analysis")
        .eq("project_id", DEMO_PROJECT_ID)
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        const seen = new Set<string>();
        const deduped = (data as { company_name: string; analysis: CompetitorAnalysis }[])
          .map((r) => r.analysis)
          .filter((c) => {
            if (seen.has(c.company_name)) return false;
            seen.add(c.company_name);
            return true;
          });
        setCompetitors(deduped);
      }
      setLoading(false);
    };

    fetchCompetitors();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-10 px-8">
        <p className="text-base text-slate-500">Loading Adyen analysis…</p>
      </div>
    );
  }

  if (competitors.length === 0) {
    return (
      <div className="w-full py-10 px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Adyen Competitive Analysis</h1>
          <p className="mt-2 text-base text-slate-500">
            Positioning, messaging, pricing, and strategic weaknesses
          </p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white py-28 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
            <svg
              className="h-8 w-8 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-800">No competitor analysis yet</h2>
          <p className="mt-3 max-w-sm text-base text-slate-500">
            Run analysis from the Dashboard to generate Adyen competitive intelligence.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-10 px-8">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Adyen Competitive Analysis</h1>
        <p className="mt-2 text-base text-slate-500">
          Positioning, messaging, pricing, and strategic weaknesses
        </p>
      </div>

      <div className="space-y-8">
        {competitors.map((c) => (
          <div key={c.company_name} className="space-y-6">
            {/* 1. Positioning Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {c.positioning?.headline ?? c.company_name}
                  </h2>
                  {c.positioning?.tagline && (
                    <p className="mt-1.5 text-base font-medium text-violet-600">
                      {c.positioning.tagline}
                    </p>
                  )}
                </div>
                {c.positioning?.primary_audience && (
                  <span className="shrink-0 rounded-full bg-slate-100 px-4 py-1.5 text-base text-slate-600">
                    {c.positioning.primary_audience}
                  </span>
                )}
              </div>
              {c.positioning?.value_props && c.positioning.value_props.length > 0 && (
                <div>
                  <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
                    Value Propositions
                  </p>
                  <ul className="space-y-2">
                    {c.positioning.value_props.map((vp, i) => (
                      <li key={i} className="flex items-start gap-3 text-base text-slate-700">
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-violet-400" />
                        {vp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* 2. Messaging Themes */}
            {c.messaging_themes && c.messaging_themes.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
                <h3 className="mb-5 text-lg font-semibold text-slate-900">Messaging Themes</h3>
                <div className="flex flex-wrap gap-3">
                  {c.messaging_themes.map((theme, i) => (
                    <span
                      key={i}
                      className="rounded-full bg-slate-100 px-4 py-2 text-base text-slate-700"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Strengths vs Weaknesses */}
            {((c.strengths && c.strengths.length > 0) ||
              (c.weaknesses && c.weaknesses.length > 0)) && (
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Strengths */}
                <div className="rounded-xl border border-red-100 bg-red-50 p-7 shadow-sm">
                  <h3 className="mb-5 text-lg font-semibold text-red-800">
                    Adyen Strengths
                    <span className="ml-2 text-sm font-normal text-red-500">(threats to Stripe)</span>
                  </h3>
                  {c.strengths && c.strengths.length > 0 ? (
                    <ul className="space-y-3">
                      {c.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-3 text-base text-red-800">
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-red-400" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-base text-red-400">No strengths recorded.</p>
                  )}
                </div>

                {/* Weaknesses */}
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-7 shadow-sm">
                  <h3 className="mb-5 text-lg font-semibold text-emerald-800">
                    Adyen Weaknesses
                    <span className="ml-2 text-sm font-normal text-emerald-600">(Stripe&apos;s openings)</span>
                  </h3>
                  {c.weaknesses && c.weaknesses.length > 0 ? (
                    <ul className="space-y-3">
                      {c.weaknesses.map((w, i) => (
                        <li key={i} className="flex items-start gap-3 text-base text-emerald-800">
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-base text-emerald-400">No weaknesses recorded.</p>
                  )}
                </div>
              </div>
            )}

            {/* 4. Pricing Intelligence */}
            <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
              <div className="mb-5 flex items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-slate-900">Pricing Intelligence</h3>
                <span
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold capitalize ${transparencyBadgeClass(
                    c.pricing_transparency
                  )}`}
                >
                  {c.pricing_transparency} transparency
                </span>
              </div>

              {c.pricing_notes && (
                <p className="mb-5 text-base text-slate-700">{c.pricing_notes}</p>
              )}

              {c.pricing_model && (
                <div className="mb-5">
                  <p className="mb-1 text-sm font-semibold uppercase tracking-wider text-slate-400">
                    Pricing Model
                  </p>
                  <p className="text-base text-slate-700">{c.pricing_model}</p>
                </div>
              )}

              {/* Fee structures table */}
              {c.fee_structures && c.fee_structures.length > 0 && (
                <div className="mb-5">
                  <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
                    Fee Structures
                  </p>
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                          <th className="px-4 py-3 text-sm font-semibold text-slate-600">Tier</th>
                          <th className="px-4 py-3 text-sm font-semibold text-slate-600">Description</th>
                          <th className="px-4 py-3 text-sm font-semibold text-slate-600">Visibility</th>
                        </tr>
                      </thead>
                      <tbody>
                        {c.fee_structures.map((fee, i) => (
                          <tr
                            key={i}
                            className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                          >
                            <td className="px-4 py-3 text-base font-medium text-slate-800">
                              {fee.tier}
                            </td>
                            <td className="px-4 py-3 text-base text-slate-600">
                              {fee.description}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`rounded-full px-3 py-1 text-sm font-medium ${
                                  fee.is_transparent
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {fee.is_transparent ? "Transparent" : "Opaque"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Hidden costs */}
              {c.hidden_costs && c.hidden_costs.length > 0 && (
                <div className="mb-5">
                  <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
                    Hidden Costs
                  </p>
                  <ul className="space-y-2">
                    {c.hidden_costs.map((cost, i) => (
                      <li key={i} className="flex items-start gap-3 text-base text-slate-700">
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                        {cost}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Enterprise signals */}
              {c.enterprise_signals && c.enterprise_signals.length > 0 && (
                <div>
                  <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
                    Enterprise Signals
                  </p>
                  <ul className="space-y-2">
                    {c.enterprise_signals.map((signal, i) => (
                      <li key={i} className="flex items-start gap-3 text-base text-slate-700">
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-violet-400" />
                        {signal}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* 5. Differentiators */}
            {c.differentiators && c.differentiators.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
                <h3 className="mb-5 text-lg font-semibold text-slate-900">
                  Adyen&apos;s Claimed Differentiators
                </h3>
                <ul className="space-y-3">
                  {c.differentiators.map((d, i) => (
                    <li key={i} className="flex items-start gap-3 text-base text-slate-700">
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-slate-400" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
