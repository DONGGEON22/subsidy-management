-- 메모 테이블 생성 SQL
-- ⚠️ 메모 테이블이 없다면 먼저 이것을 실행하세요!

CREATE TABLE IF NOT EXISTS memos (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (빠른 조회)
CREATE INDEX IF NOT EXISTS idx_memos_employee_id ON memos(employee_id);
CREATE INDEX IF NOT EXISTS idx_memos_created_at ON memos(created_at DESC);

-- RLS (Row Level Security) 설정
ALTER TABLE memos ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽고 쓸 수 있도록 (관리자 전용 시스템이므로)
CREATE POLICY "Enable all access for authenticated users" ON memos
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 확인
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'memos'
ORDER BY ordinal_position;





