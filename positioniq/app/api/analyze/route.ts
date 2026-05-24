import { timingSafeEqual } from "crypto";
import { after } from "next/server";
import { createClient } from "@/lib/supabase/service";
import { runPipeline } from "@/lib/pipeline";
import { DEMO_PROJECT_ID } from "@/lib/constants";

export const maxDuration = 300;

const COOLDOWN_MS = 30 * 60 * 1000;

function checkSecret(provided: string | null): boolean {
  const expected = process.env.ADMIN_SECRET;
  if (!expected) return false;
  const p = provided ?? "";
  if (p.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(p), Buffer.from(expected));
}

export async function POST(req: Request) {
  if (!checkSecret(req.headers.get("x-api-key"))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient();

  // BIT-51: reject if a job is already in flight
  const { data: active } = await supabase
    .from("jobs")
    .select("id")
    .eq("project_id", DEMO_PROJECT_ID)
    .in("status", ["pending", "running"])
    .maybeSingle();

  if (active) {
    return Response.json(
      { error: "Analysis already in progress", jobId: active.id },
      { status: 409 }
    );
  }

  // BIT-51: reject if a job completed within the cooldown window
  const { data: recent } = await supabase
    .from("jobs")
    .select("id")
    .eq("project_id", DEMO_PROJECT_ID)
    .eq("status", "complete")
    .gte("created_at", new Date(Date.now() - COOLDOWN_MS).toISOString())
    .maybeSingle();

  if (recent) {
    return Response.json(
      { error: "Analysis ran recently — please wait 30 minutes" },
      { status: 429 }
    );
  }

  const { data: job, error } = await supabase
    .from("jobs")
    .insert({ project_id: DEMO_PROJECT_ID, status: "pending" })
    .select("id")
    .single();

  if (error || !job) {
    return Response.json({ error: "Failed to create job" }, { status: 500 });
  }

  after(() => runPipeline(job.id));

  return Response.json({ jobId: job.id });
}
