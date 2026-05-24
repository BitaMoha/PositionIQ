"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { NarrativeGapReport, Battlecard, PlaybookData } from "@/lib/types";
import { DEMO_PROJECT_ID } from "@/lib/constants";
import { triggerAnalysis, getJobStatus } from "@/app/actions";

type RefreshStatus = "idle" | "running" | "complete" | "error";

function Spinner() {
  return (
    <svg
      className="h-5 w-5 animate-spin text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

export default function PlaybookPage() {
  const [playbook, setPlaybook] = useState<PlaybookData | null>(null);
  const [battlecard, setBattlecard] = useState<Battlecard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshStatus, setRefreshStatus] = useState<RefreshStatus>("idle");
  const [currentStep, setCurrentStep] = useState<string>("");
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const [reportRes, battlecardRes] = await Promise.all([
      supabase
        .from("narrative_gap_reports")
        .select("content")
        .eq("project_id", DEMO_PROJECT_ID)
        .order("generated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("battlecards")
        .select("content")
        .eq("project_id", DEMO_PROJECT_ID)
        .eq("competitor_name", "Adyen")
        .order("generated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (reportRes.data) {
      const report = reportRes.data.content as NarrativeGapReport;
      setPlaybook(report.playbook ?? null);
    }
    if (battlecardRes.data) {
      setBattlecard(battlecardRes.data.content as Battlecard);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshStatus("running");
    setRefreshError(null);
    setCurrentStep("Starting analysis…");

    try {
      const { jobId, error } = await triggerAnalysis();

      if (error || !jobId) {
        setRefreshStatus("error");
        setRefreshError(error ?? "Unknown error");
        return;
      }

      const poll = async () => {
        const job = await getJobStatus(jobId);
        if (job.current_step) {
          setCurrentStep(job.current_step);
        }

        if (job.status === "complete") {
          setRefreshStatus("complete");
          setCurrentStep("");
          await fetchData();
        } else if (job.status === "error") {
          setRefreshStatus("error");
          setRefreshError(job.error ?? "Pipeline failed");
        } else {
          setTimeout(poll, 3000);
        }
      };

      setTimeout(poll, 3000);
    } catch (err) {
      setRefreshStatus("error");
      setRefreshError(err instanceof Error ? err.message : String(err));
    }
  };

  // Merge pricing objection handlers from playbook + battlecard, dedup by objection text
  const mergedPricingObjections = (() => {
    const seen = new Set<string>();
    const result: { objection: string; response: string }[] = [];

    for (const item of playbook?.pricing_objection_handlers ?? []) {
      if (!seen.has(item.objection)) {
        seen.add(item.objection);
        result.push(item);
      }
    }

    for (const item of battlecard?.pricing_section?.pricing_objection_handles ?? []) {
      if (!seen.has(item.objection)) {
        seen.add(item.objection);
        result.push(item);
      }
    }

    return result;
  })();

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-10 px-8">
        <p className="text-base text-slate-500">Loading playbook…</p>
      </div>
    );
  }

  return (
    <div className="py-10 px-8">
      {/* Page Header */}
      <div className="mb-10 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Value Selling Playbook</h1>
          <p className="mt-2 text-base text-slate-500">
            Living document — updates when analysis reruns
          </p>
        </div>
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <button
            onClick={handleRefresh}
            disabled={refreshStatus === "running"}
            className="flex items-center gap-2.5 bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-70 disabled:cursor-not-allowed rounded-lg px-5 py-2.5 text-base font-semibold transition-colors"
          >
            {refreshStatus === "running" && <Spinner />}
            {refreshStatus === "running" ? "Analyzing…" : "Refresh Analysis"}
          </button>
          {refreshStatus === "running" && currentStep && (
            <p className="text-sm text-slate-500">{currentStep}</p>
          )}
          {refreshStatus === "error" && refreshError && (
            <p className="text-sm text-red-600">{refreshError}</p>
          )}
          {refreshStatus === "complete" && (
            <p className="text-sm text-emerald-600 font-medium">Playbook updated</p>
          )}
        </div>
      </div>

      {/* Empty state — no playbook yet */}
      {!playbook ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white py-24 text-center">
          <div className="mb-4 rounded-full bg-slate-100 p-4">
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
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-slate-800">Playbook not yet generated</h2>
          <p className="mt-2 text-base text-slate-500 max-w-md">
            Run analysis from the Dashboard — the playbook is generated as part of the full
            analysis.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center rounded-lg bg-violet-600 px-5 py-2.5 text-base font-semibold text-white hover:bg-violet-700 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          {/* ── Section 1: Elevator Pitch ──────────────────────────────── */}
          <section>
            <div className="rounded-xl bg-[#0F1729] shadow-sm p-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-white/40 mb-4">
                Elevator Pitch
              </p>
              <p className="text-xl font-medium text-white leading-relaxed">
                {playbook.elevator_pitch}
              </p>
              <p className="mt-4 text-sm text-white/40">
                2–3 sentences grounded in Adyen customer language
              </p>
            </div>
          </section>

          {/* ── Section 2: Discovery Questions ────────────────────────── */}
          {playbook.discovery_questions && playbook.discovery_questions.length > 0 && (
            <section>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-900">Discovery Questions</h2>
                <p className="mt-1 text-base text-slate-500">
                  Ask these to uncover Adyen pain points
                </p>
              </div>
              <div
                className={
                  playbook.discovery_questions.length >= 4
                    ? "grid gap-4 sm:grid-cols-2"
                    : "space-y-4"
                }
              >
                {playbook.discovery_questions.map((question, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-slate-200 bg-white shadow-sm flex items-start gap-4 p-5"
                  >
                    <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-violet-600 text-white text-sm font-bold">
                      {i + 1}
                    </div>
                    <p className="text-base font-medium text-slate-900 leading-relaxed pt-0.5">
                      {question}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Section 3: Value Drivers ───────────────────────────────── */}
          {playbook.value_drivers && playbook.value_drivers.length > 0 && (
            <section>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-900">
                  Why Customers Choose Stripe Over Adyen
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {playbook.value_drivers.map((vd, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-slate-200 bg-white shadow-sm p-6"
                  >
                    <p className="text-base font-bold text-slate-900 mb-3">{vd.driver}</p>
                    <div className="border-l-4 border-violet-300 pl-4">
                      <p className="text-base italic text-slate-600">&ldquo;{vd.customer_evidence}&rdquo;</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Section 4: Pricing Objection Handlers ─────────────────── */}
          {mergedPricingObjections.length > 0 && (
            <section>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-900">
                  Pricing Objection Handlers
                </h2>
                <p className="mt-1 text-base text-slate-500">
                  Specific responses when prospects say Adyen is cheaper
                </p>
              </div>
              <div>
                {mergedPricingObjections.map((item, i) => (
                  <details
                    key={i}
                    className="border border-slate-200 rounded-xl mb-3 overflow-hidden group"
                  >
                    <summary className="flex items-center justify-between cursor-pointer list-none px-5 py-4 hover:bg-slate-50 transition-colors">
                      <p className="text-base font-bold text-slate-900 pr-4">
                        &ldquo;{item.objection}&rdquo;
                      </p>
                      <svg
                        className="h-5 w-5 flex-shrink-0 text-slate-400 transition-transform group-open:rotate-180"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </summary>
                    <div className="px-5 pb-4 border-t border-slate-100 pt-4">
                      <p className="text-base text-slate-700 leading-relaxed">{item.response}</p>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* ── Section 5: Competitive Traps ──────────────────────────── */}
          {playbook.competitive_traps && playbook.competitive_traps.length > 0 && (
            <section>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-900">Competitive Traps</h2>
                <p className="mt-1 text-base text-slate-500">
                  Questions that expose Adyen weaknesses customers have actually complained about
                </p>
              </div>
              <div className="space-y-4">
                {playbook.competitive_traps.map((trap, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden"
                  >
                    <div className="px-6 py-4">
                      <p className="text-base font-semibold text-slate-900">{trap.question}</p>
                    </div>
                    <div className="px-6 py-4 bg-violet-50 border-t border-violet-100">
                      <p className="text-sm font-medium text-violet-600 uppercase tracking-wide mb-1">
                        Why it works
                      </p>
                      <p className="text-base text-slate-600">{trap.why_it_works}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
