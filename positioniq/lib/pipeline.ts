import { createClient } from "@/lib/supabase/service";
import { runCompetitorAnalysis } from "@/lib/agents/competitorAgent";
import { runVocAnalysis } from "@/lib/agents/vocAgent";
import { runGapAnalysis } from "@/lib/agents/gapAgent";
import { runBattlecardGeneration } from "@/lib/agents/battlecardAgent";
import { DEMO_PROJECT_ID } from "@/lib/constants";

export async function runPipeline(jobId: string) {
  const supabase = createClient();

  async function setStatus(status: string, extra?: object) {
    await supabase.from("jobs").update({ status, ...extra }).eq("id", jobId);
  }

  async function setStep(step: string, stepsComplete: number, stepsTotal: number) {
    await supabase
      .from("jobs")
      .update({ result: { current_step: step, steps_complete: stepsComplete, steps_total: stepsTotal } })
      .eq("id", jobId);
  }

  try {
    await setStatus("running");
    await setStep("Crawling Adyen pages…", 0, 4);

    const [competitors, voc] = await Promise.all([
      runCompetitorAnalysis(DEMO_PROJECT_ID),
      (async () => {
        await setStep("Analyzing Adyen customer sentiment…", 1, 4);
        return runVocAnalysis(DEMO_PROJECT_ID);
      })(),
    ]);

    await setStep("Identifying narrative gaps & building playbook…", 2, 4);
    const gapReport = await runGapAnalysis(DEMO_PROJECT_ID, competitors, voc);

    await setStep("Generating battlecards…", 3, 4);
    const competitorNames = competitors.map((c) => c.company_name);
    await Promise.all(
      competitorNames.map((name) =>
        runBattlecardGeneration(DEMO_PROJECT_ID, name, competitors, voc, gapReport)
      )
    );

    await setStatus("complete", {
      result: {
        current_step: "Done",
        steps_complete: 4,
        steps_total: 4,
        competitors: competitorNames,
        voc_sources: voc.length,
        gap_report: true,
        battlecards: competitorNames.length,
      },
    });
  } catch (err) {
    await setStatus("error", { error: err instanceof Error ? err.message : String(err) });
  }
}
