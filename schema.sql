-- schema.sql
create extension if not exists "pgcrypto";

create table if not exists public.chats (
  id uuid default gen_random_uuid() primary key,
  title text,
  owner_id uuid not null,
  created_at timestamptz default now()
);

create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  chat_id uuid not null references public.chats(id) on delete cascade,
  sender text not null,
  body text not null,
  status text default 'sent', -- sent, delivered, read
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_messages_chat_created on public.messages (chat_id, created_at desc);