-- วาง SQL นี้ใน Supabase → SQL Editor → Run

-- ตาราง stock
create table if not exists stock (
  sku      text primary key,
  qty      integer default 0,
  safety   integer default 10,
  cost     numeric(10,2) default 0,
  updated_at timestamptz default now()
);

-- ตาราง sales
create table if not exists sales (
  id         bigserial primary key,
  date       timestamptz default now(),
  items      jsonb not null,
  total      numeric(10,2) default 0,
  note       text default ''
);

-- เปิด Row Level Security + อนุญาต anon ใช้งานได้
alter table stock enable row level security;
alter table sales enable row level security;

create policy "allow all stock"  on stock for all using (true) with check (true);
create policy "allow all sales"  on sales for all using (true) with check (true);
