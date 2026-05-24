import Anthropic from "@anthropic-ai/sdk";
import { CompetitorAnalysis, VoiceOfCustomer, NarrativeGapReport } from "@/lib/types";
import { NarrativeGapReportSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/service";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a strategic PMM analyst at Stripe, analyzing Adyen as a competitor.
You will receive structured competitor analysis and voice-of-customer data about Adyen.
Your job: identify narrative gaps AND generate Stripe's positioning strategy, pricing narratives, and a Value Selling Playbook.
Return ONLY valid JSON matching this exact schema — no markdown fences, no explanation, no preamble:
{
  "whitespace_opportunities": [
    { "topic": "<string>", "confidence": <0.0-1.0>, "rationale": "<string>" }
  ],
  "messaging_disconnects": [
    {
      "competitor": "<string>",
      "claim": "<string>",
      "customer_reality": "<string>",
      "gap_type": "overpromise" | "silence"
    }
  ],
  "overused_language": ["<phrase Adyen overuses that Stripe should avoid>"],
  "top_3_recommendations": [
    { "title": "<string>", "recommended_angle": "<string for Stripe's messaging>", "supporting_evidence": "<string>" }
  ],
  "pricing_narratives": [
    { "angle": "<string — e.g. 'transparent pricing vs black-box interchange++'>", "headline": "<1-sentence Stripe message>", "rationale": "<why this angle wins based on customer data>" }
  ],
  "competitive_positioning": {
    "where_stripe_wins": ["<specific scenario where Stripe beats Adyen>"],
    "where_stripe_loses": ["<scenario where Adyen has an advantage>"],
    "how_to_reframe_losses": ["<how Stripe's PMM should reframe each loss>"]
  },
  "playbook": {
    "elevator_pitch": "<2-3 sentences — Stripe's value prop vs Adyen, grounded in real customer language>",
    "discovery_questions": ["<question a seller asks to uncover Adyen pain points>"],
    "value_drivers": [
      { "driver": "<top reason customers choose Stripe over Adyen>", "customer_evidence": "<verbatim or paraphrased VoC evidence>" }
    ],
    "pricing_objection_handlers": [
      { "objection": "<e.g. 'Adyen is cheaper'>", "response": "<specific response based on customer reality>" }
    ],
    "competitive_traps": [
      { "question": "<question that exposes an Adyen weakness customers have actually complained about>", "why_it_works": "<the Adyen pain point it surfaces>" }
    ]
  }
}
Rules:
- gap_type "overpromise" = Adyen claim contradicted by customers; "silence" = customers care about topic Adyen ignores
- top_3_recommendations must be specific Stripe copy angles — not generic
- pricing_narratives: minimum 3 entries, grounded in actual Adyen pricing weaknesses
- competitive_positioning: minimum 3 entries in each list
- playbook.discovery_questions: minimum 5 questions focused on Adyen pain points
- playbook.value_drivers: minimum 5 entries with specific customer evidence
- playbook.pricing_objection_handlers: minimum 3 entries — specifically address 'Adyen is cheaper' and 'Stripe is too expensive'
- playbook.competitive_traps: minimum 3 questions that expose real Adyen weaknesses
- elevator_pitch: must use customer language from VoC data, not generic claims`;

export async function runGapAnalysis(
  projectId: string,
  competitors: CompetitorAnalysis[],
  voc: VoiceOfCustomer[]
): Promise<NarrativeGapReport> {
  const supabase = createClient();
  const generatedAt = new Date().toISOString();

  const context = JSON.stringify({ competitors, voc }, null, 2).slice(0, 14000);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `You are Stripe's PMM. Analyze these Adyen datasets and generate the full strategic report:\n\n${context}`,
      },
    ],
  });

  const rawText = (message.content[0] as any).text as string;
  const raw = rawText.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  const parsed = NarrativeGapReportSchema.parse(JSON.parse(raw));

  const json: NarrativeGapReport = { ...parsed, generated_at: generatedAt };

  await supabase.from("narrative_gap_reports").insert({
    project_id: projectId,
    generated_at: generatedAt,
    content: json,
  });

  return json;
}
