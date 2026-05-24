import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const PROJECT_ID = "11111111-1111-1111-1111-111111111111";

async function seed() {
  console.log("Clearing tables...");
  await Promise.all([
    supabase.from("battlecards").delete().eq("project_id", PROJECT_ID),
    supabase.from("narrative_gap_reports").delete().eq("project_id", PROJECT_ID),
    supabase.from("voc_snapshots").delete().eq("project_id", PROJECT_ID),
    supabase.from("competitor_snapshots").delete().eq("project_id", PROJECT_ID),
    supabase.from("jobs").delete().eq("project_id", PROJECT_ID),
  ]);

  console.log("Starting pipeline...");
  const { runCompetitorAnalysis } = await import("../lib/agents/competitorAgent");
  const { runVocAnalysis } = await import("../lib/agents/vocAgent");
  const { runGapAnalysis } = await import("../lib/agents/gapAgent");
  const { runBattlecardGeneration } = await import("../lib/agents/battlecardAgent");

  const [competitors, voc] = await Promise.all([
    runCompetitorAnalysis(PROJECT_ID),
    runVocAnalysis(PROJECT_ID),
  ]);
  console.log(`${competitors.length} competitors analyzed`);
  console.log(`${voc.length} VoC sources analyzed`);

  const gapReport = await runGapAnalysis(PROJECT_ID, competitors, voc);
  console.log("1 gap report generated");

  const competitorNames = competitors.map((c) => c.company_name);
  await Promise.all(
    competitorNames.map((name) =>
      runBattlecardGeneration(PROJECT_ID, name, competitors, voc, gapReport)
    )
  );
  console.log(`${competitorNames.length} battlecards generated`);

  console.log(
    `\nSummary: ${competitors.length} competitors | ${voc.length} VoC sources | 1 gap report | ${competitorNames.length} battlecards`
  );
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
