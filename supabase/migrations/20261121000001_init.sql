-- 워너비홈케어 초기 스키마
-- 견적 요청은 서버(서버 키)에서만 읽고 쓴다. 공개 키(anon·authenticated)로는 읽지도 쓰지도 못한다.
-- 공개 목록은 가린 이름 · 시/구 · 서비스 · 상태 · 시각만 주는 뷰로 읽는다.

-- ============================================================
-- 견적 요청
-- ============================================================
create type public.request_status as enum ('pending', 'quote', 'active', 'done');

create table public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  service text not null check (service in ('clean', 'aircon', 'grout', 'coating', 'newhome')),
  clean_type text check (clean_type is null or char_length(clean_type) <= 20),
  building_type text check (building_type is null or char_length(building_type) <= 30),
  building_other text check (building_other is null or char_length(building_other) <= 50),
  business_type text check (business_type is null or char_length(business_type) <= 40),
  business_other text check (business_other is null or char_length(business_other) <= 50),
  rooms smallint check (rooms between 1 and 6),
  bathrooms smallint check (bathrooms between 1 and 4),
  balconies smallint check (balconies between 1 and 6),
  structure text check (structure is null or char_length(structure) <= 20),
  extra_services text[] not null default '{}' check (cardinality(extra_services) <= 5),
  area text not null check (char_length(area) between 1 and 30),
  sido text not null check (sido in ('서울', '경기', '인천')),
  sigungu text not null check (char_length(sigungu) between 1 and 20),
  address_detail text not null check (char_length(address_detail) between 1 and 100),
  preferred_date text not null check (char_length(preferred_date) between 1 and 40),
  customer_name text not null check (char_length(customer_name) between 1 and 20),
  masked_name text generated always as (left(btrim(customer_name), 1) || '○○') stored,
  phone text not null check (phone ~ '^01[016-9]-?[0-9]{3,4}-?[0-9]{4}$'),
  message text check (message is null or char_length(message) <= 1000),
  image_paths text[] not null default '{}' check (cardinality(image_paths) <= 3),
  consent_at timestamptz not null,
  status public.request_status not null default 'pending',
  admin_memo text check (admin_memo is null or char_length(admin_memo) <= 2000),
  visible_on_board boolean not null default true
);

create index quote_requests_created_at_idx on public.quote_requests (created_at desc);
create index quote_requests_status_idx on public.quote_requests (status);

create function public.set_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

create trigger quote_requests_updated_at
  before update on public.quote_requests
  for each row execute function public.set_updated_at();

alter table public.quote_requests enable row level security;
-- 정책을 두지 않는다 + 권한도 거둔다: 공개 키로는 조회·삽입·수정·삭제 모두 거부
revoke all on table public.quote_requests from anon, authenticated;

-- ============================================================
-- 공개 목록 뷰 — 성함 전체·연락처·나머지 주소·요청 내용·사진은 없다
-- (뷰 소유자 권한으로 읽으므로 공개 키에 표 권한을 주지 않아도 된다)
-- ============================================================
create view public.quote_request_board
with (security_invoker = false)
as
select
  r.id,
  r.masked_name,
  r.sido || ' ' || r.sigungu as region,
  case
    when r.service = 'clean' and r.clean_type is not null then r.clean_type
    when r.service = 'clean' then '청소'
    when r.service = 'aircon' then '에어컨청소'
    when r.service = 'grout' then '줄눈'
    when r.service = 'coating' then '탄성코트'
    when r.service = 'newhome' then '새집증후군'
    else '기타'
  end as service_label,
  r.status,
  r.created_at
from public.quote_requests r
where r.visible_on_board;

revoke all on table public.quote_request_board from public, anon, authenticated;
grant select on table public.quote_request_board to anon, authenticated;

-- ============================================================
-- 사이트 문구(키-값). 공개 키는 읽기만, 쓰기는 서버 키만.
-- ============================================================
create table public.site_content (
  key text primary key check (char_length(key) between 1 and 60),
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create trigger site_content_updated_at
  before update on public.site_content
  for each row execute function public.set_updated_at();

alter table public.site_content enable row level security;
revoke all on table public.site_content from anon, authenticated;
grant select on table public.site_content to anon, authenticated;
create policy "site_content is readable" on public.site_content
  for select to anon, authenticated using (true);

-- ============================================================
-- 요청 사진 저장소 — 비공개. 정책을 두지 않아 공개 키로는 올리기·읽기 모두 거부.
-- 관리자 화면은 서버 키로 기한이 있는 주소를 만들어 본다.
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('request-images', 'request-images', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 실시간 구독 대상(supabase_realtime)에는 넣지 않는다.
