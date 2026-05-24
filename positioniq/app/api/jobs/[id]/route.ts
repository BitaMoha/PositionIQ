import { timingSafeEqual } from "crypto";
import type { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const maxDuration = 10;

function checkSecret(provided: string | null): boolean {
  const expected = process.env.ADMIN_SECRET;
  if (!expected) return false;
  const p = provided ?? "";
  if (p.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(p), Buffer.from(expected));
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkSecret(req.headers.get("x-api-key"))) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = await createClient();

  const { data: job, error } = await supabase
    .from("jobs")
    .select("id, status, result, error, created_at")
    .eq("id", id)
    .single();

  if (error || !job) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

  // BIT-52: never return raw DB/SDK error strings to the client
  return Response.json({
    ...job,
    error: job.error ? "Pipeline failed — check server logs" : null,
  });
}
