-- Run this in Supabase: Project → SQL Editor → New Query → paste all → Run

create table assessments (
  id bigint generated always as identity primary key,
  assessment_id text not null,
  created_at timestamptz not null default now(),
  age_eligible boolean,
  wound text,
  response text,
  capacity_data jsonb,
  final_position text,
  accuracy_score int,
  usefulness_score int,
  felt_understood text,
  position_fit text,
  alternative_position text,
  most_helpful_component text,
  user_comments text
);

create table subscribers (
  id bigint generated always as identity primary key,
  email text not null,
  created_at timestamptz not null default now(),
  age_confirmed boolean,
  consent boolean
);

-- Row Level Security: allow anonymous inserts only (no reading/editing from the public API)
alter table assessments enable row level security;
alter table subscribers enable row level security;

create policy "Allow public insert on assessments"
  on assessments for insert
  to anon
  with check (true);

create policy "Allow public insert on subscribers"
  on subscribers for insert
  to anon
  with check (true);

-- No select/update/delete policies are created for the anon role,
-- so the public website can only ever write rows, never read or change them.
-- You will read the data yourself via the Supabase Table Editor or SQL Editor,
-- logged in with your own account.
