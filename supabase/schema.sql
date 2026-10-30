-- 天才港点 database. Run once in Supabase: SQL Editor → New query → paste → Run.

create table if not exists public.menu_items (
  id text primary key,
  category text not null check (category in ('dimsum', 'bun', 'drink')),
  name_zh text not null,
  name_en text not null default '',
  portion text not null default '',
  price_cents integer not null check (price_cents >= 0),
  tagline text not null default '',
  image_url text,
  sold_out boolean not null default false,
  is_new boolean not null default false,
  recommended boolean not null default false,
  hidden boolean not null default false,
  sort integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  customer_name text not null,
  contact text not null,
  pickup_time text not null,
  note text,
  items jsonb not null,
  total_cents integer not null check (total_cents >= 0),
  status text not null default 'new' check (status in ('new', 'paid', 'picked_up', 'cancelled')),
  created_at timestamptz not null default now()
);
-- Online payments (Stripe). paid_via is null for orders paid by QR code.
alter table public.orders add column if not exists paid_via text;
alter table public.orders add column if not exists paid_at timestamptz;
alter table public.orders add column if not exists stripe_session_id text;
create index if not exists orders_created_at_idx on public.orders (created_at desc);

-- Accounts allowed into /admin. Add yours after creating the user in
-- Authentication → Users:  insert into public.admins (user_id) values ('<user id>');
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.admins enable row level security;

-- Everyone can read the menu; only admins change it.
drop policy if exists "menu readable" on public.menu_items;
create policy "menu readable" on public.menu_items for select using (true);
drop policy if exists "menu admin write" on public.menu_items;
create policy "menu admin write" on public.menu_items for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Customers never read orders. New orders are inserted by the website's
-- server with the service role key after it checks prices.
drop policy if exists "orders admin read" on public.orders;
create policy "orders admin read" on public.orders for select to authenticated using (public.is_admin());
drop policy if exists "orders admin update" on public.orders;
create policy "orders admin update" on public.orders for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins see self" on public.admins;
create policy "admins see self" on public.admins for select to authenticated using (user_id = auth.uid());

-- Live order updates in the admin page.
do $$ begin
  alter publication supabase_realtime add table public.orders;
exception when duplicate_object then null; end $$;

-- Photos for new menu items.
insert into storage.buckets (id, name, public) values ('menu-images', 'menu-images', true)
  on conflict (id) do nothing;
drop policy if exists "menu images admin upload" on storage.objects;
create policy "menu images admin upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'menu-images' and public.is_admin());
drop policy if exists "menu images admin update" on storage.objects;
create policy "menu images admin update" on storage.objects for update to authenticated
  using (bucket_id = 'menu-images' and public.is_admin());

-- Opening menu (2026-10-30). Safe to re-run: existing items are left alone.
insert into public.menu_items (id, category, name_zh, name_en, portion, price_cents, tagline, image_url, is_new, recommended, sort) values
  ('hargow',    'dimsum', '虾饺',       'Shrimp Dumplings (Har Gow)',    '4只 / 4 pcs',    699, '鲜虾饱满', '/img/hargow.jpg',    false, false, 10),
  ('siumai',    'dimsum', '烧卖',       'Pork & Shrimp Siu Mai',         '4只 / 4 pcs',    699, '经典港味', '/img/siumai.jpg',    false, false, 20),
  ('cheungfun', 'dimsum', '虾仁肠粉',   'Shrimp Rice Noodle Rolls',      '2条 / 2 rolls',  799, '爽滑鲜美', '/img/cheungfun.jpg', false, false, 30),
  ('xlb',       'dimsum', '小笼包',     'Soup Dumplings (Xiao Long Bao)', '4只 / 4 pcs',   799, '汤汁鲜美', '/img/xlb.jpg',       false, false, 40),
  ('liusha',    'bun',    '黄流沙包',   'Salted Egg Custard Buns',       '2只 / 2 pcs',    699, '流沙香浓', '/img/liusha.jpg',    false, false, 50),
  ('heijin',    'bun',    '黑金流沙包', 'Black Gold Custard Buns',       '2只 / 2 pcs',    799, '独特风味', '/img/heijin.jpg',    true,  true,  60),
  ('coke',      'drink',  '可乐',       'Coca-Cola',                     '1罐 / 1 can',    200, '',         null,                 false, false, 70),
  ('water',     'drink',  '瓶装水',     'Bottled Water',                 '1瓶 / 1 bottle', 200, '',         null,                 false, false, 80)
on conflict (id) do nothing;
