-- Enable pgcrypto for gen_random_uuid()
create extension if not exists "pgcrypto";

-- jobs
create table if not exists jobs (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null,
  status       text not null check (status in ('pending', 'running', 'complete', 'error')),
  result       jsonb,
  error        text,
  created_at   timestamptz not null default now()
);

-- competitor_snapshots
create table if not exists competitor_snapshots (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null,
  company_name  text not null,
  url           text not null,
  snapshot_date date not null,
  analysis      jsonb,
  previous_id   uuid references competitor_snapshots (id),
  created_at    timestamptz not null default now()
);

-- voc_snapshots
create table if not exists voc_snapshots (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null,
  source_url    text not null,
  source_type   text not null,
  snapshot_date date not null,
  analysis      jsonb,
  previous_id   uuid references voc_snapshots (id),
  created_at    timestamptz not null default now()
);

-- narrative_gap_reports
create table if not exists narrative_gap_reports (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null,
  generated_at timestamptz not null default now(),
  content      jsonb not null
);

-- battlecards
create table if not exists battlecards (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null,
  competitor_name text not null,
  generated_at    timestamptz not null default now(),
  content         jsonb not null,
  previous_id     uuid references battlecards (id)
);

-- Indexes for common query patterns
create index on jobs (project_id, created_at desc);
create index on competitor_snapshots (project_id, snapshot_date desc);
create index on voc_snapshots (project_id, snapshot_date desc);
create index on narrative_gap_reports (project_id, generated_at desc);
create index on battlecards (project_id, competitor_name, generated_at desc);
