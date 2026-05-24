"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CompetitorAnalysis, NarrativeGapReport } from "@/lib/types";
import { DEMO_PROJECT_ID } from "@/lib/constants";

export default function PricingPage() {
  const [analysis, setAnalysis] = useState<CompetitorAnalysis | null>(null);
  const [gapReport, setGapReport] = useState<NarrativeGapReport | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      const [snapshotRes, reportRes] = await Promise.all([
        supabase
          .from("competitor_snapshots")
          .select("analysis")
          .eq("project_id", DEMO_PROJECT_ID)
          .eq("company_name", "Adyen")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("narrative_gap_reports")
          .select("content")
          .eq("project_id", DEMO_PROJECT_ID)
          .order("generated_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      if (snapshotRes.data) {
        setAnalysis(snapshotRes.data.analysis as CompetitorAnalysis);
      }
      if (reportRes.data) {
        setGapReport(reportRes.data.content as NarrativeGapReport);
      }
      setLoading(false);
    };

    fetchData();
  }, [supabase]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-10 px-8">
        <p className="text-base text-slate-500">Loading pricing intelligence…</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="py-10 px-8">
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white py-24">
          <h2 className="text-lg font-semibold text-slate-800">No analysis yet</h2>
          <p className="mt-2 text-base text-slate-500 text-center max-w-sm">
            No analysis yet. Run analysis from the Dashboard to populate pricing intelligence.
          </p>
        </div>
      </div>
    );
  }

  const transparencyBadgeClass =
    analysis.pricing_transparency === "high"
      ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
      : analysis.pricing_transparency === "medium"
      ? "bg-amber-100 text-amber-700 border border-amber-200"
      : "bg-red-100 text-red-700 border border-red-200";

  const pricingNarratives = gapReport?.pricing_narratives ?? [];
  const competitivePositioning = gapReport?.competitive_positioning ?? null;

  return (
    <div className="py-10 px-8">
      {/* Page Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900">Pricing Intelligence</h1>
        <p className="mt-2 text-base text-slate-500">
          Adyen&apos;s pricing model, Stripe&apos;s positioning angles, where we win and lose on price
        </p>
      </div>

      {/* ── Section 1: Competitive Pricing Analysis ─────────────────────── */}
      <section className="mb-10">
        <h2 className="mb-6 text-xl font-semibold text-slate-900">Adyen Pricing Analysis</h2>

        {/* Pricing Model Card */}
        <div className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm p-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">
                Pricing Model
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {analysis.pricing_model ?? "Interchange++ / negotiated"}
              </p>
            </div>
            <span className={`rounded-full px-3 py-1 text-sm font-semibold capitalize ${transparencyBadgeClass}`}>
              {analysis.pricing_transparency} transparency
            </span>
          </div>
          <p className="text-base text-slate-700 leading-relaxed">{analysis.pricing_notes}</p>
        </div>

        {/* Fee Structures Table */}
        {analysis.fee_structures && analysis.fee_structures.length > 0 && (
          <div className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-semibold text-slate-800">Fee Structures</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">
                      Tier
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-semibold text-slate-600">
                      Description
                    </th>
                    <th className="text-center px-6 py-3 text-sm font-semibold text-slate-600">
                      Transparent?
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {analysis.fee_structures.map((fee, i) => (
                    <tr
                      key={i}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4 text-base font-medium text-slate-900">
                        {fee.tier}
                      </td>
                      <td className="px-6 py-4 text-base text-slate-600">{fee.description}</td>
                      <td className="px-6 py-4 text-center">
                        {fee.is_transparent ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100">
                            <svg
                              className="w-4 h-4 text-emerald-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100">
                            <svg
                              className="w-4 h-4 text-red-600"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2.5}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Side-by-side Comparison */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          {/* Adyen Column */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 shadow-sm p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-4">
              Adyen
            </p>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Model</p>
                <p className="text-base text-slate-800">
                  {analysis.pricing_model ?? "Interchange++ / negotiated rates"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Transparency</p>
                <span className={`inline-block rounded-full px-2.5 py-0.5 text-sm font-medium capitalize ${transparencyBadgeClass}`}>
                  {analysis.pricing_transparency}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Key Differentiator</p>
                <p className="text-base text-slate-800">
                  {analysis.differentiators?.[0] ?? "Enterprise-focused, volume-based pricing"}
                </p>
              </div>
            </div>
          </div>

          {/* Stripe Column */}
          <div className="rounded-xl border border-violet-200 bg-violet-50 shadow-sm p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-400 mb-4">
              Stripe
            </p>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-violet-500 mb-1">Model</p>
                <p className="text-base text-slate-800">
                  Flat-rate + transparent interchange
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-violet-500 mb-1">Transparency</p>
                <span className="inline-block rounded-full px-2.5 py-0.5 text-sm font-medium bg-emerald-100 text-emerald-700 border border-emerald-200">
                  High — all fees published
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-violet-500 mb-1">Key Differentiator</p>
                <p className="text-base text-slate-800">
                  No minimums, no negotiation required
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden Costs */}
        {analysis.hidden_costs && analysis.hidden_costs.length > 0 && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 shadow-sm p-6">
            <h3 className="text-base font-semibold text-red-800 mb-4">
              Hidden Costs &amp; Gotchas
            </h3>
            <ul className="space-y-3">
              {analysis.hidden_costs.map((cost, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-0.5 flex-shrink-0 text-red-500">⚠️</span>
                  <p className="text-base text-red-700">{cost}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Enterprise Signals */}
        {analysis.enterprise_signals && analysis.enterprise_signals.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-6">
            <h3 className="text-base font-semibold text-slate-800 mb-4">
              Enterprise Targeting Signals
            </h3>
            <p className="text-sm text-slate-500 mb-3">
              Evidence that Adyen targets enterprise accounts only
            </p>
            <ul className="space-y-3">
              {analysis.enterprise_signals.map((signal, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-1 flex-shrink-0 h-2 w-2 rounded-full bg-amber-400" />
                  <p className="text-base text-slate-700">{signal}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* ── Section 2: Pricing Narrative Builder ────────────────────────── */}
      <section className="mb-10">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900">Pricing Narratives for Stripe</h2>
          <p className="mt-1 text-base text-slate-500">
            AI-generated messaging angles based on Adyen customer pain points
          </p>
        </div>

        {pricingNarratives.length > 0 ? (
          <div className="space-y-4">
            {pricingNarratives.map((narrative, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex"
              >
                <div className="w-1 flex-shrink-0 bg-violet-600" />
                <div className="flex-1 p-6">
                  <p className="text-lg font-semibold text-slate-900 mb-2">{narrative.angle}</p>
                  <p className="text-base font-medium text-violet-700 mb-3">
                    &ldquo;{narrative.headline}&rdquo;
                  </p>
                  <p className="text-base text-slate-600">{narrative.rationale}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white py-16">
            <p className="text-base text-slate-500">
              Run analysis to generate pricing narratives
            </p>
          </div>
        )}
      </section>

      {/* ── Section 3: Positioning Against Adyen ───────────────────────── */}
      <section className="mb-10">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-slate-900">
            Where Stripe Wins and Loses on Price
          </h2>
        </div>

        {competitivePositioning ? (
          <div className="space-y-4">
            {/* Where Stripe Wins */}
            {competitivePositioning.where_stripe_wins &&
              competitivePositioning.where_stripe_wins.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex">
                  <div className="w-1 flex-shrink-0 bg-emerald-500" />
                  <div className="flex-1 p-6">
                    <h3 className="text-base font-semibold text-emerald-700 mb-4 uppercase tracking-wide text-sm">
                      Where Stripe Wins
                    </h3>
                    <ul className="space-y-3">
                      {competitivePositioning.where_stripe_wins.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="mt-0.5 flex-shrink-0 font-bold text-emerald-500">✓</span>
                          <p className="text-base text-slate-700">{item}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

            {/* Where Stripe Loses */}
            {competitivePositioning.where_stripe_loses &&
              competitivePositioning.where_stripe_loses.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex">
                  <div className="w-1 flex-shrink-0 bg-red-500" />
                  <div className="flex-1 p-6">
                    <h3 className="text-base font-semibold text-red-700 mb-4 uppercase tracking-wide text-sm">
                      Where Stripe Loses
                    </h3>
                    <ul className="space-y-3">
                      {competitivePositioning.where_stripe_loses.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="mt-0.5 flex-shrink-0 font-bold text-red-500">✗</span>
                          <p className="text-base text-slate-700">{item}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

            {/* How to Reframe Losses */}
            {competitivePositioning.how_to_reframe_losses &&
              competitivePositioning.how_to_reframe_losses.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex">
                  <div className="w-1 flex-shrink-0 bg-violet-600" />
                  <div className="flex-1 p-6">
                    <h3 className="text-base font-semibold text-violet-700 mb-4 uppercase tracking-wide text-sm">
                      How to Reframe Losses
                    </h3>
                    <ul className="space-y-3">
                      {competitivePositioning.how_to_reframe_losses.map((item, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="mt-0.5 flex-shrink-0 font-bold text-violet-500">→</span>
                          <p className="text-base text-slate-700">{item}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white py-16">
            <p className="text-base text-slate-500">
              Run analysis to generate competitive positioning data
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
