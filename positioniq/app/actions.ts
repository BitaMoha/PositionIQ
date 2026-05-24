"use server";

import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runPipeline } from "@/lib/pipeline";
import { DEMO_PROJECT_ID } from "@/lib/constants";

const COOLDOWN_MS = 30 * 60 * 1000;

export async function triggerAnalysis(): Promise<{ jobId?: string; error?: string }> {
  const supabase = await createClient();

  const { data: active } = await supabase
    .from("jobs")
    .select("id")
    .eq("project_id", DEMO_PROJECT_ID)
    .in("status", ["pending", "running"])
    .maybeSingle();

  if (active) {
    return { error: "Analysis already in progress" };
  }

  const { data: recent } = await supabase
    .from("jobs")
    .select("id")
    .eq("project_id", DEMO_PROJECT_ID)
    .eq("status", "complete")
    .gte("created_at", new Date(Date.now() - COOLDOWN_MS).toISOString())
    .maybeSingle();

  if (recent) {
    return { error: "Analysis ran recently — please wait 30 minutes" };
  }

  const { data: job, error } = await supabase
    .from("jobs")
    .insert({ project_id: DEMO_PROJECT_ID, status: "pending" })
    .select("id")
    .single();

  if (error || !job) {
    return { error: "Failed to create job" };
  }

  after(() => runPipeline(job.id));

  return { jobId: job.id };
}

export async function getJobStatus(
  jobId: string
): Promise<{ status?: string; current_step?: string; steps_complete?: number; steps_total?: number; error?: string | null }> {
  const supabase = await createClient();

  const { data: job, error } = await supabase
    .from("jobs")
    .select("status, result, error")
    .eq("id", jobId)
    .single();

  if (error || !job) {
    return { error: "Job not found" };
  }

  const result = job.result as any;
  return {
    status: job.status,
    current_step: result?.current_step ?? null,
    steps_complete: result?.steps_complete ?? 0,
    steps_total: result?.steps_total ?? 4,
    error: job.error ? "Pipeline failed — check server logs" : null,
  };
}
