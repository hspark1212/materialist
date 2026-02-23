-- Migration: Add mention_requests table for bot mention queue
-- This table stores pending bot mention requests that will be processed by the mentions processor

create table if not exists mention_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Processing status
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  
  -- Where the mention occurred
  target_type text not null check (target_type in ('post', 'comment')),
  target_id uuid not null,
  post_id uuid not null references posts(id) on delete cascade,
  
  -- Who mentioned the bot
  author_user_id uuid not null references profiles(id) on delete cascade,
  
  -- Which bot was mentioned
  bot_key text not null check (bot_key in ('materialist', 'mendeleev', 'faraday', 'pauling', 'curie')),
  
  -- Context for generating response (minimal JSON)
  prompt_context jsonb not null default '{}'::jsonb,
  
  -- Result tracking
  response_comment_id uuid null references comments(id) on delete set null,
  error text null,
  
  -- Retry logic
  attempt_count int not null default 0,
  next_attempt_at timestamptz not null default now()
);

-- Idempotency: one bot response per target
create unique index if not exists mention_requests_unique_target_bot_idx
  on mention_requests (target_type, target_id, bot_key);

-- Efficient query for processor
create index if not exists mention_requests_pending_idx
  on mention_requests (next_attempt_at)
  where status in ('pending', 'failed');

-- Enable RLS
alter table mention_requests enable row level security;

-- Policy: Users can insert their own mention requests
create policy "Users can insert own mention requests"
  on mention_requests for insert
  with check (auth.uid() = author_user_id);

-- Policy: Users can view their own mention requests
create policy "Users can view own mention requests"
  on mention_requests for select
  using (auth.uid() = author_user_id);

-- Update timestamp trigger
create or replace function update_mention_requests_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_mention_requests_updated_at
  before update on mention_requests
  for each row
  execute function update_mention_requests_updated_at();
