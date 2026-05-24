"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { NarrativeGapReport, CompetitorAnalysis, VoiceOfCustomer } from "@/lib/types";
import { DEMO_PROJECT_ID } from "@/lib/constants";
import { triggerAnalysis, getJobStatus } from "./actions";

type JobStatus = "idle" | "pending" | "running" | "complete" | "error";

interface DashboardData {
  gapReport: NarrativeGapReport | null;
  competitors: CompetitorAnalysis[];
  voc: VoiceOfCustomer[];
}

interface JobProgress {
  current_step: string | null;
  steps_complete: number;
  steps_total: number;
}

const PIPELINE_STEPS = [
  "Crawling Adyen pages",
  "Analyzing customer sentiment",
  "Identifying narrative gaps",
  "Generating battlecards",
];

function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
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

function CheckIcon() {
  return (
    <svg
      className="h-5 w-5 text-emerald-500"
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
  );
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function sentimentBadgeClass(sentiment: "positive" | "negative" | "mixed") {
  if (sentiment === "positive") return "bg-emerald-100 text-emerald-700";
  if (sentiment === "negative") return "bg-red-100 text-red-700";
  return "bg-amber-100 text-amber-700";
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-4xl font-bold text-slate-900">{value}</p>
      <p className="mt-2 text-base text-slate-500">{label}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>({
    gapReport: null,
    competitors: [],
    voc: [],
  });
  const [jobStatus, setJobStatus] = useState<JobStatus>("idle");
  const [jobError, setJobError] = useState<string | null>(null);
  const [jobProgress, setJobProgress] = useState<JobProgress>({
    current_step: null,
    steps_complete: 0,
    steps_total: 4,
  });

  const supabase = createClient();

  const fetchData = useCallback(async () => {
    const [gapRes, competitorRes, vocRes] = await Promise.all([
      supabase
        .from("narrative_gap_reports")
        .select("content")
        .eq("project_id", DEMO_PROJECT_ID)
        .order("generated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("competitor_snapshots")
        .select("analysis")
        .eq("project_id", DEMO_PROJECT_ID)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("voc_snapshots")
        .select("analysis")
        .eq("project_id", DEMO_PROJECT_ID)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const allCompetitors = (competitorRes.data ?? []).map(
      (r: { analysis: CompetitorAnalysis }) => r.analysis
    );
    const seenCompanies = new Set<string>();
    const competitors = allCompetitors.filter((c) => {
      if (seenCompanies.has(c.company_name)) return false;
      seenCompanies.add(c.company_name);
      return true;
    });

    const allVoc = (vocRes.data ?? []).map(
      (r: { analysis: VoiceOfCustomer }) => r.analysis
    );
    const seenVoc = new Set<string>();
    const voc = allVoc.filter((v) => {
      if (seenVoc.has(v.competitor_name)) return false;
      seenVoc.add(v.competitor_name);
      return true;
    });

    setData({
      gapReport: (gapRes.data?.content as NarrativeGapReport) ?? null,
      competitors,
      voc,
    });
  }, [supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRunAnalysis = async () => {
    setJobStatus("pending");
    setJobError(null);
    setJobProgress({ current_step: null, steps_complete: 0, steps_total: 4 });

    try {
      const { jobId, error } = await triggerAnalysis();

      if (error || !jobId) {
        setJobStatus("error");
        setJobError(error ?? "Unknown error");
        return;
      }

      setJobStatus("running");

      const poll = async () => {
        const job = await getJobStatus(jobId);

        setJobProgress({
          current_step: job.current_step ?? null,
          steps_complete: job.steps_complete ?? 0,
          steps_total: job.steps_total ?? 4,
        });

        if (job.status === "complete") {
          setJobStatus("complete");
          await fetchData();
        } else if (job.status === "error") {
          setJobStatus("error");
          setJobError(job.error ?? "Pipeline failed");
        } else {
          setTimeout(poll, 3000);
        }
      };

      setTimeout(poll, 3000);
    } catch (err) {
      setJobStatus("error");
      setJobError(err instanceof Error ? err.message : String(err));
    }
  };

  const isLoading = jobStatus === "pending" || jobStatus === "running";
  const hasData = data.gapReport !== null || data.competitors.length > 0;

  const adyen = data.competitors.find(
    (c) => c.company_name.toLowerCase() === "adyen"
  ) ?? data.competitors[0] ?? null;

  const adyenVoc =
    data.voc.find((v) => v.competitor_name.toLowerCase() === "adyen") ??
    data.voc[0] ??
    null;

  const gapReport = data.gapReport;

  return (
    <div className="w-full py-10 px-8">
      {/* Header row */}
      <div className="mb-8 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Here&apos;s your competitive intelligence update
          </h1>
          {gapReport && (
            <p className="mt-2 text-base text-slate-500">
              Last analysis: {formatDate(gapReport.generated_at)} &middot;{" "}
              {gapReport.whitespace_opportunities?.length ?? 0} opportunities &middot;{" "}
              {gapReport.messaging_disconnects?.length ?? 0} messaging gaps
            </p>
          )}
        </div>
        <button
          onClick={handleRunAnalysis}
          disabled={isLoading}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-base font-semibold text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
        >
          {isLoading && <Spinner className="h-4 w-4 text-white" />}
          {isLoading ? "Analyzing…" : "Run Analysis"}
        </button>
      </div>

      {/* Error banner */}
      {jobStatus === "error" && jobError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-base text-red-700">
          Analysis failed: {jobError}
        </div>
      )}

      {/* Loading state — step-by-step progress */}
      {isLoading && (
        <div className="mb-8 rounded-xl border border-slate-200 bg-white shadow-sm px-8 py-10">
          <p className="mb-6 text-lg font-semibold text-slate-800">
            Running analysis…
          </p>
          <ol className="space-y-5">
            {PIPELINE_STEPS.map((step, i) => {
              const stepsComplete = jobProgress.steps_complete ?? 0;
              const isDone = i < stepsComplete;
              const isCurrent = i === stepsComplete;
              const isUpcoming = i > stepsComplete;

              return (
                <li key={step} className="flex items-center gap-4">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center">
                    {isDone ? (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
                        <CheckIcon />
                      </span>
                    ) : isCurrent ? (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100">
                        <Spinner className="h-4 w-4 text-violet-600" />
                      </span>
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                        <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                      </span>
                    )}
                  </span>
                  <span
                    className={`text-base font-medium ${
                      isDone
                        ? "text-emerald-700 line-through decoration-emerald-400"
                        : isCurrent
                        ? "text-violet-700"
                        : "text-slate-400"
                    }`}
                  >
                    {step}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* Empty state */}
      {!hasData && !isLoading && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white py-28">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-violet-50">
            <svg
              className="h-8 w-8 text-violet-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-800">No analysis yet</h2>
          <p className="mt-3 max-w-sm text-center text-base text-slate-500">
            Run your first analysis to surface Adyen&apos;s weaknesses and Stripe&apos;s
            positioning angles.
          </p>
          <button
            onClick={handleRunAnalysis}
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-violet-600 px-5 py-2.5 text-base font-semibold text-white hover:bg-violet-700 transition-colors"
          >
            Run Analysis
          </button>
        </div>
      )}

      {/* Data view */}
      {hasData && !isLoading && (
        <div className="space-y-10">
          {/* Key metrics row */}
          <section>
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
              <MetricCard label="Competitors Tracked" value={1} />
              <MetricCard
                label="Opportunities Identified"
                value={gapReport?.whitespace_opportunities?.length ?? 0}
              />
              <MetricCard
                label="Messaging Gaps"
                value={gapReport?.messaging_disconnects?.length ?? 0}
              />
              <MetricCard
                label="Last Analysis"
                value={
                  gapReport?.generated_at
                    ? formatDate(gapReport.generated_at)
                    : "—"
                }
              />
            </div>
          </section>

          {/* Top 3 Recommendations — large hero cards */}
          {gapReport?.top_3_recommendations &&
            gapReport.top_3_recommendations.length > 0 && (
              <section>
                <h2 className="mb-6 text-xl font-bold text-slate-900">
                  Top Positioning Recommendations
                </h2>
                <div className="grid gap-6 sm:grid-cols-3">
                  {gapReport.top_3_recommendations.map((rec, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm flex flex-col gap-4"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-600 text-base font-bold text-white">
                        {i + 1}
                      </div>
                      <h3 className="text-xl font-semibold text-slate-900 leading-snug">
                        {rec.title}
                      </h3>
                      <p className="text-base text-slate-700">{rec.recommended_angle}</p>
                      <p className="text-base text-slate-400 mt-auto">{rec.supporting_evidence}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

          {/* Competitor snapshot summary card */}
          {adyen && (
            <section>
              <h2 className="mb-6 text-xl font-bold text-slate-900">
                Adyen Competitor Snapshot
              </h2>
              <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
                <p className="text-xl font-semibold text-slate-900">
                  {adyen.positioning?.headline}
                </p>
                {adyen.positioning?.tagline && (
                  <p className="mt-1 text-base text-violet-600">
                    {adyen.positioning.tagline}
                  </p>
                )}
                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-red-500">
                      Adyen Strengths (threats)
                    </p>
                    <ul className="space-y-2">
                      {(adyen.strengths ?? []).slice(0, 3).map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-base text-slate-700">
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-red-400" />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-600">
                      Adyen Weaknesses (Stripe&apos;s openings)
                    </p>
                    <ul className="space-y-2">
                      {(adyen.weaknesses ?? []).slice(0, 3).map((w, i) => (
                        <li key={i} className="flex items-start gap-2 text-base text-slate-700">
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-400" />
                          {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Sentiment summary */}
          {adyenVoc && (
            <section>
              <h2 className="mb-6 text-xl font-bold text-slate-900">
                Adyen Customer Sentiment
              </h2>
              <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
                <div className="flex items-center gap-4">
                  <p className="text-base font-medium text-slate-700">Overall sentiment:</p>
                  <span
                    className={`rounded-full px-4 py-1.5 text-base font-semibold capitalize ${sentimentBadgeClass(
                      adyenVoc.competitor_sentiment?.overall ?? "mixed"
                    )}`}
                  >
                    {adyenVoc.competitor_sentiment?.overall ?? "mixed"}
                  </span>
                </div>
                {adyenVoc.competitor_sentiment?.by_source &&
                  adyenVoc.competitor_sentiment.by_source.length > 0 && (
                    <div className="mt-5 space-y-3">
                      {adyenVoc.competitor_sentiment.by_source.map((src, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 rounded-lg bg-slate-50 px-4 py-3"
                        >
                          <span
                            className={`mt-0.5 rounded px-2 py-0.5 text-sm font-semibold uppercase ${
                              src.source_type === "g2"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {src.source_type}
                          </span>
                          <div className="flex-1">
                            <span
                              className={`mr-2 rounded px-2 py-0.5 text-sm font-medium capitalize ${sentimentBadgeClass(
                                src.sentiment
                              )}`}
                            >
                              {src.sentiment}
                            </span>
                            <span className="text-base text-slate-500">{src.notes}</span>
                          </div>
                        </div>
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
