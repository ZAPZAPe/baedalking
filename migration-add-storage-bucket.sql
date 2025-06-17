-- Supabase Storage 버킷 생성 (Supabase 대시보드에서 실행)
-- 1. Storage 섹션으로 이동
-- 2. New bucket 클릭
-- 3. 다음 설정으로 버킷 생성:
--    - Name: user-profiles
--    - Public bucket: 체크 (공개 접근 허용)
--    - File size limit: 5MB
--    - Allowed MIME types: image/*

-- RLS 정책 (선택사항 - 더 엄격한 보안을 원할 경우)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('user-profiles', 'user-profiles', true);

-- 업로드 권한 정책
-- CREATE POLICY "Users can upload their own profile images" ON storage.objects
-- FOR INSERT WITH CHECK (bucket_id = 'user-profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 업데이트 권한 정책  
-- CREATE POLICY "Users can update their own profile images" ON storage.objects
-- FOR UPDATE USING (bucket_id = 'user-profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 삭제 권한 정책
-- CREATE POLICY "Users can delete their own profile images" ON storage.objects
-- FOR DELETE USING (bucket_id = 'user-profiles' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 읽기 권한 정책 (공개)
-- CREATE POLICY "Anyone can view profile images" ON storage.objects
-- FOR SELECT USING (bucket_id = 'user-profiles'); 