-- policies.sql
alter table public.chats enable row level security;

create policy "Chats: owner select" on public.chats for select
  using (owner_id = current_setting('hasura.user', true)::uuid);

create policy "Chats: owner insert" on public.chats for insert
  with check (owner_id = current_setting('hasura.user', true)::uuid);

create policy "Chats: owner update" on public.chats for update
  using (owner_id = current_setting('hasura.user', true)::uuid)
  with check (owner_id = current_setting('hasura.user', true)::uuid);

create policy "Chats: owner delete" on public.chats for delete
  using (owner_id = current_setting('hasura.user', true)::uuid);

alter table public.messages enable row level security;

create policy "Messages: select if chat owner" on public.messages for select
  using (
    exists (
      select 1 from public.chats c
      where c.id = public.messages.chat_id
        and c.owner_id = current_setting('hasura.user', true)::uuid
    )
  );

create policy "Messages: insert if chat owner" on public.messages for insert
  with check (
    exists (
      select 1 from public.chats c
      where c.id = new.chat_id
        and c.owner_id = current_setting('hasura.user', true)::uuid
    )
  );

create policy "Messages: insert bot via admin" on public.messages for insert
  with check (true)
  using (current_setting('hasura.role', true) = 'admin');

create policy "Messages: update if chat owner" on public.messages for update
  using (
    exists (
      select 1 from public.chats c
      where c.id = public.messages.chat_id
        and c.owner_id = current_setting('hasura.user', true)::uuid
    )
  )
  with check (
    exists (
      select 1 from public.chats c
      where c.id = new.chat_id
        and c.owner_id = current_setting('hasura.user', true)::uuid
    )
  );