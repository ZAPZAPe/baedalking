-- point_history 테이블에 INSERT 정책 추가

-- 사용자가 자신의 포인트 히스토리를 추가할 수 있도록 정책 추가
CREATE POLICY "Users can insert own point history" 
ON point_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 사용자가 자신의 포인트 히스토리를 모두 관리할 수 있도록 정책 추가 (선택사항)
CREATE POLICY "Users can manage own point history" 
ON point_history 
FOR ALL 
USING (auth.uid() = user_id); 