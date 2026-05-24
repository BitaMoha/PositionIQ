-- Enable RLS on all tables
alter table jobs enable row level security;
alter table competitor_snapshots enable row level security;
alter table voc_snapshots enable row level security;
alter table narrative_gap_reports enable row level security;
alter table battlecards enable row level security;

-- Allow anon role to read all tables (UI fetches client-side with anon key)
create policy "anon read jobs"
  on jobs for select to anon using (true);

create policy "anon read competitor_snapshots"
  on competitor_snapshots for select to anon using (true);

create policy "anon read voc_snapshots"
  on voc_snapshots for select to anon using (true);

create policy "anon read narrative_gap_reports"
  on narrative_gap_reports for select to anon using (true);

create policy "anon read battlecards"
  on battlecards for select to anon using (true);

-- Writes use the service role key (bypasses RLS) — no insert/update/delete policies needed for anon
