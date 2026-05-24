import Anthropic from "@anthropic-ai/sdk";
import { CompetitorAnalysis, VoiceOfCustomer, NarrativeGapReport, Battlecard } from "@/lib/types";
import { BattlecardSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/service";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a sales enablement expert at Stripe. Stripe is competing against Adyen.
You will receive competitor analysis, voice-of-customer data, and a narrative gap report about Adyen.
Generate a crisp, grounded sales battlecard that Stripe reps use in competitive deals.
Return ONLY valid JSON matching this exact schema — no markdown fences, no explanation, no preamble:
{
  "competitor_name": "<string>",
  "one_liner": "<one sharp sentence a Stripe sales rep can memorize to position against this competitor>",
  "strengths": ["<Adyen strength that poses a real threat to Stripe>"],
  "weaknesses": ["<Adyen weakness Stripe reps should exploit>"],
  "when_we_win": "<specific deal scenario where Stripe beats Adyen>",
  "when_we_lose": "<specific scenario where Adyen wins>",
  "objection_handles": [
    {
      "objection": "<string>",
      "response": "<string>",
      "source": "customer_language" | "inferred"
    }
  ],
  "customer_language_to_use": ["<verbatim phrase from VoC that resonates>"],
  "pricing_section": {
    "adyen_pricing_weaknesses": ["<specific pricing pain point Adyen customers have complained about>"],
    "stripe_pricing_positives": ["<specific Stripe pricing advantage vs Adyen>"],
    "pricing_objection_handles": [
      { "objection": "<pricing objection e.g. 'Adyen is cheaper'>", "response": "<specific, evidence-backed response>" }
    ]
  }
}
Rules:
- objection_handles must have at least 3 entries. customer_language_to_use must have at least 3 verbatim phrases.
- pricing_section.adyen_pricing_weaknesses: at least 3, grounded in actual VoC complaints
- pricing_section.stripe_pricing_positives: at least 3, specific advantages (transparency, predictability, etc.)
- pricing_section.pricing_objection_handles: at least 2, must include 'Adyen is cheaper' objection
- Mark source as "customer_language" only when the response uses verbatim VoC phrases.
- strengths/weaknesses are from Stripe's perspective (what we're up against, what we exploit)`;

export async function runBattlecardGeneration(
  projectId: string,
  competitorName: string,
  competitors: CompetitorAnalysis[],
  voc: VoiceOfCustomer[],
  gapReport: NarrativeGapReport
): Promise<Battlecard> {
  const supabase = createClient();

  const competitorData = competitors.find((c) => c.company_name === competitorName);
  const vocData = voc.find((v) => v.competitor_name === competitorName);
  const languagePatterns = vocData?.language_patterns ?? [];

  const context = JSON.stringify(
    { competitorData, vocData, gapReport, languagePatterns },
    null,
    2
  ).slice(0, 12000);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Generate a Stripe vs ${competitorName} battlecard.\n\nData:\n${context}`,
      },
    ],
  });

  const rawText = (message.content[0] as any).text as string;
  const raw = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  const json = BattlecardSchema.parse(JSON.parse(raw));

  await supabase.from("battlecards").insert({
    project_id: projectId,
    competitor_name: competitorName,
    generated_at: new Date().toISOString(),
    content: json,
  });

  return json;
}
