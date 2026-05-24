import { z } from "zod";

export const CompetitorAnalysisSchema = z.object({
  competitor_id: z.string().uuid(),
  company_name: z.string().min(1),
  snapshot_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  positioning: z.object({
    headline: z.string(),
    tagline: z.string(),
    primary_audience: z.string(),
    value_props: z.array(z.string()),
  }),
  messaging_themes: z.array(z.string()),
  pricing_transparency: z.enum(["high", "medium", "low"]),
  pricing_notes: z.string(),
  pricing_model: z.string().optional(),
  fee_structures: z
    .array(z.object({ tier: z.string(), description: z.string(), is_transparent: z.boolean() }))
    .optional(),
  enterprise_signals: z.array(z.string()).optional(),
  hidden_costs: z.array(z.string()).optional(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  differentiators: z.array(z.string()),
});

export const VoiceOfCustomerSchema = z.object({
  competitor_name: z.string().min(1),
  snapshot_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  frustration_clusters: z.array(
    z.object({
      theme: z.string(),
      frequency: z.enum(["HIGH", "MEDIUM", "LOW"]),
      emotional_intensity: z.enum(["HIGH", "MEDIUM", "LOW"]),
      source_type: z.enum(["g2", "github", "forum"]),
      verbatim_examples: z.array(z.string()),
    })
  ),
  switching_signals: z.array(
    z.object({ from: z.string(), to: z.string(), reason: z.string() })
  ),
  language_patterns: z.array(z.string()),
  competitor_sentiment: z.object({
    overall: z.enum(["positive", "negative", "mixed"]),
    by_source: z.array(
      z.object({
        source_type: z.string(),
        sentiment: z.enum(["positive", "negative", "mixed"]),
        notes: z.string(),
      })
    ),
  }),
});

const PricingNarrativeSchema = z.object({
  angle: z.string(),
  headline: z.string(),
  rationale: z.string(),
});

const CompetitivePositioningSchema = z.object({
  where_stripe_wins: z.array(z.string()).min(1),
  where_stripe_loses: z.array(z.string()).min(1),
  how_to_reframe_losses: z.array(z.string()).min(1),
});

const PlaybookSchema = z.object({
  elevator_pitch: z.string().min(1),
  discovery_questions: z.array(z.string()).min(3),
  value_drivers: z
    .array(z.object({ driver: z.string(), customer_evidence: z.string() }))
    .min(3),
  pricing_objection_handlers: z
    .array(z.object({ objection: z.string(), response: z.string() }))
    .min(2),
  competitive_traps: z
    .array(z.object({ question: z.string(), why_it_works: z.string() }))
    .min(2),
});

export const NarrativeGapReportSchema = z.object({
  whitespace_opportunities: z
    .array(
      z.object({
        topic: z.string(),
        confidence: z.number().min(0).max(1),
        rationale: z.string(),
      })
    )
    .min(1),
  messaging_disconnects: z
    .array(
      z.object({
        competitor: z.string(),
        claim: z.string(),
        customer_reality: z.string(),
        gap_type: z.enum(["overpromise", "silence"]),
      })
    )
    .min(1),
  overused_language: z.array(z.string()),
  top_3_recommendations: z
    .array(
      z.object({
        title: z.string(),
        recommended_angle: z.string(),
        supporting_evidence: z.string(),
      })
    )
    .min(1)
    .max(3),
  pricing_narratives: z.array(PricingNarrativeSchema).min(2).optional(),
  competitive_positioning: CompetitivePositioningSchema.optional(),
  playbook: PlaybookSchema.optional(),
});

export const BattlecardSchema = z.object({
  competitor_name: z.string().min(1),
  one_liner: z.string().min(1),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  when_we_win: z.string(),
  when_we_lose: z.string(),
  objection_handles: z
    .array(
      z.object({
        objection: z.string(),
        response: z.string(),
        source: z.enum(["customer_language", "inferred"]),
      })
    )
    .min(3),
  customer_language_to_use: z.array(z.string()).min(3),
  pricing_section: z
    .object({
      adyen_pricing_weaknesses: z.array(z.string()).min(1),
      stripe_pricing_positives: z.array(z.string()).min(1),
      pricing_objection_handles: z
        .array(z.object({ objection: z.string(), response: z.string() }))
        .min(2),
    })
    .optional(),
});
