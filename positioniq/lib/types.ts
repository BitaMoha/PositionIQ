export type CompetitorAnalysis = {
  competitor_id: string;
  company_name: string;
  snapshot_date: string;
  positioning: {
    headline: string;
    tagline: string;
    primary_audience: string;
    value_props: string[];
  };
  messaging_themes: string[];
  pricing_transparency: "high" | "medium" | "low";
  pricing_notes: string;
  pricing_model?: string;
  fee_structures?: { tier: string; description: string; is_transparent: boolean }[];
  enterprise_signals?: string[];
  hidden_costs?: string[];
  strengths: string[];
  weaknesses: string[];
  differentiators: string[];
};

export type FrustrationCluster = {
  theme: string;
  frequency: "HIGH" | "MEDIUM" | "LOW";
  emotional_intensity: "HIGH" | "MEDIUM" | "LOW";
  source_type: "g2" | "github" | "forum";
  verbatim_examples: string[];
};

export type VoiceOfCustomer = {
  competitor_name: string;
  snapshot_date: string;
  frustration_clusters: FrustrationCluster[];
  switching_signals: { from: string; to: string; reason: string }[];
  language_patterns: string[];
  competitor_sentiment: {
    overall: "positive" | "negative" | "mixed";
    by_source: { source_type: string; sentiment: "positive" | "negative" | "mixed"; notes: string }[];
  };
};

export type PricingNarrative = {
  angle: string;
  headline: string;
  rationale: string;
};

export type CompetitivePositioning = {
  where_stripe_wins: string[];
  where_stripe_loses: string[];
  how_to_reframe_losses: string[];
};

export type PlaybookData = {
  elevator_pitch: string;
  discovery_questions: string[];
  value_drivers: { driver: string; customer_evidence: string }[];
  pricing_objection_handlers: { objection: string; response: string }[];
  competitive_traps: { question: string; why_it_works: string }[];
};

export type NarrativeGapReport = {
  generated_at: string;
  whitespace_opportunities: {
    topic: string;
    confidence: number;
    rationale: string;
  }[];
  messaging_disconnects: {
    competitor: string;
    claim: string;
    customer_reality: string;
    gap_type: "overpromise" | "silence";
  }[];
  overused_language: string[];
  top_3_recommendations: {
    title: string;
    recommended_angle: string;
    supporting_evidence: string;
  }[];
  pricing_narratives?: PricingNarrative[];
  competitive_positioning?: CompetitivePositioning;
  playbook?: PlaybookData;
};

export type ObjectionHandle = {
  objection: string;
  response: string;
  source: "customer_language" | "inferred";
};

export type Battlecard = {
  competitor_name: string;
  one_liner: string;
  strengths: string[];
  weaknesses: string[];
  when_we_win: string;
  when_we_lose: string;
  objection_handles: ObjectionHandle[];
  customer_language_to_use: string[];
  pricing_section?: {
    adyen_pricing_weaknesses: string[];
    stripe_pricing_positives: string[];
    pricing_objection_handles: { objection: string; response: string }[];
  };
};
