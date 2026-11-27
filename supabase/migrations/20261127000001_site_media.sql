-- 사이트 사진 저장소(전·후 사진, 가린 후기 캡처) — 공개 읽기 버킷.
-- 공개 주소(/storage/v1/object/public/site-media/...)로는 누구나 열 수 있다.
-- 쓰기·지우기·목록 보기는 서버(서버 키)만 한다. storage.objects 에 공개 키용 정책을 만들지 않는다.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-media', 'site-media', true, 5242880, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
