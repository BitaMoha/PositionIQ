"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { VoiceOfCustomer, FrustrationCluster } from "@/lib/types";
import { DEMO_PROJECT_ID } from "@/lib/constants";

interface VocRow {
  analysis: VoiceOfCustomer;
}

type SourceFilter = "All" | "g2" | "github";

const frequencyBadge = (f: "HIGH" | "MEDIUM" | "LOW") => {
  if (f === "HIGH") return "bg-red-100 text-red-700";
  if (f === "MEDIUM") return "bg-amber-100 text-amber-700";
  return "bg-slate-100 text-slate-600";
};

const sourceBadge = (s: "g2" | "github" | "forum") => {
  if (s === "g2") return "bg-emerald-100 text-emerald-700";
  return "bg-slate-200 text-slate-600";
};

const sourceLabel = (s: "g2" | "github" | "forum") => {
  if (s === "g2") return "G2";
  if (s === "github") return "GitHub";
  return s;
};

const sentimentBadge = (sentiment: "positive" | "negative" | "mixed") => {
  if (sentiment === "positive") return "bg-emerald-100 text-emerald-700";
  if (sentiment === "negative") return "bg-red-100 text-red-700";
  return "bg-amber-100 text-amber-700";
};

export default function NarrativesPage() {
  const [vocData, setVocData] = useState<VoiceOfCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [competitorFilter, setCompetitorFilter] = useState<string>("All");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("All");
  const supabase = createClient();

  useEffect(() => {
    const fetchVoc = async () => {
      const { data } = await supabase
        .from("voc_snapshots")
        .select("analysis")
        .eq("project_id", DEMO_PROJECT_ID)
        .order("created_at", { ascending: false });

      if (data && data.length > 0) {
        const seen = new Set<string>();
        const deduped = (data as VocRow[])
          .map((r) => r.analysis)
          .filter((v) => {
            if (seen.has(v.competitor_name)) return false;
            seen.add(v.competitor_name);
            return true;
          });
        setVocData(deduped);
      }
      setLoading(false);
    };

    fetchVoc();
  }, [supabase]);

  const competitors = ["All", ...vocData.map((v) => v.competitor_name)];

  const filteredVoc = vocData.filter((v) => {
    if (competitorFilter !== "All" && v.competitor_name !== competitorFilter) return false;
    return true;
  });

  const filteredClusters = (clusters: FrustrationCluster[]) => {
    if (sourceFilter === "All") return clusters;
    return clusters.filter((c) => c.source_type === sourceFilter);
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-10 px-8">
        <p className="text-base text-slate-500">Loading customer narratives…</p>
      </div>
    );
  }

  if (vocData.length === 0) {
    return (
      <div className="py-10 px-8">
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white py-24 text-center">
          <p className="text-base font-semibold text-slate-800">No customer narratives yet.</p>
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
        <h1 className="text-3xl font-bold text-slate-900">Customer Narratives</h1>
        <p className="mt-2 text-base text-slate-500">
          What Adyen customers are saying — find Stripe&apos;s positioning openings
        </p>
      </div>

      {/* Filter bar */}
      <div className="mb-8 flex flex-wrap items-center gap-3">
        {/* Competitor pills */}
        {vocData.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {competitors.map((c) => (
              <button
                key={c}
                onClick={() => setCompetitorFilter(c)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  competitorFilter === c
                    ? "bg-violet-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {/* Divider */}
        {vocData.length > 1 && (
          <div className="h-6 w-px bg-slate-200" />
        )}

        {/* Source pills */}
        <div className="flex flex-wrap gap-2">
          {(["All", "g2", "github"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSourceFilter(s)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                sourceFilter === s
                  ? "bg-violet-600 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {s === "All" ? "All Sources" : s === "g2" ? "G2" : "GitHub"}
            </button>
          ))}
        </div>
      </div>

      {/* Competitor sections */}
      <div className="flex flex-col gap-12">
        {filteredVoc.map((v) => (
          <div key={v.competitor_name}>
            {/* Competitor header */}
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">{v.competitor_name}</h2>
              {v.competitor_sentiment && (
                <span
                  className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize ${sentimentBadge(
                    v.competitor_sentiment.overall
                  )}`}
                >
                  {v.competitor_sentiment.overall} sentiment
                </span>
              )}
            </div>

            {/* Frustration Clusters */}
            {filteredClusters(v.frustration_clusters).length > 0 && (
              <section className="mb-8">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">
                  Frustration Clusters
                </h3>
                <div className="flex flex-col gap-6">
                  {filteredClusters(v.frustration_clusters).map((cluster, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-slate-200 bg-white shadow-sm p-6"
                    >
                      {/* Top row: theme + badges */}
                      <div className="mb-5 flex items-start justify-between gap-4">
                        <h4 className="text-lg font-semibold text-slate-900 leading-snug">
                          {cluster.theme}
                        </h4>
                        <div className="flex flex-shrink-0 gap-2">
                          <span
                            className={`rounded-full px-3 py-1 text-sm font-medium ${frequencyBadge(
                              cluster.frequency
                            )}`}
                          >
                            {cluster.frequency}
                          </span>
                          <span
                            className={`rounded-full px-3 py-1 text-sm font-medium ${sourceBadge(
                              cluster.source_type
                            )}`}
                          >
                            {sourceLabel(cluster.source_type)}
                          </span>
                        </div>
                      </div>

                      {/* Verbatim quotes */}
                      {cluster.verbatim_examples.length > 0 && (
                        <div className="flex flex-col gap-6">
                          {cluster.verbatim_examples.map((quote, j) => (
                            <div key={j} className="flex items-start gap-3">
                              <span
                                className="text-5xl font-serif leading-none text-violet-600 select-none"
                                aria-hidden="true"
                              >
                                &ldquo;
                              </span>
                              <p className="text-base italic leading-relaxed text-slate-700 pt-2">
                                {quote}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Switching Signals */}
            {v.switching_signals && v.switching_signals.length > 0 && (
              <section className="mb-8">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">
                  Switching Signals
                </h3>
                <div className="flex flex-col gap-3">
                  {v.switching_signals.map((sig, i) => (
                    <div
                      key={i}
                      className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white shadow-sm px-5 py-4"
                    >
                      <span className="rounded-full bg-red-100 px-4 py-1.5 text-base font-medium text-red-700">
                        {sig.from}
                      </span>
                      <svg
                        className="h-5 w-5 flex-shrink-0 text-violet-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 7l5 5m0 0l-5 5m5-5H6"
                        />
                      </svg>
                      <span className="rounded-full bg-emerald-100 px-4 py-1.5 text-base font-medium text-emerald-700">
                        {sig.to}
                      </span>
                      <span className="text-base text-slate-600">{sig.reason}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Language Patterns */}
            {v.language_patterns && v.language_patterns.length > 0 && (
              <section>
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-slate-400">
                  Phrases Stripe Should Use
                </h3>
                <div className="flex flex-wrap gap-3">
                  {v.language_patterns.map((phrase, i) => (
                    <span
                      key={i}
                      className="rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-base text-violet-800"
                    >
                      {phrase}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
