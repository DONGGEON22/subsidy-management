-- 메모 데이터 일괄 등록 SQL
-- ⚠️ 주의: 
-- 1. memos 테이블이 먼저 생성되어 있어야 합니다 (create_memos_table.sql 실행)
-- 2. employees 테이블에 해당 근로자가 등록되어 있어야 합니다!
-- Supabase SQL Editor에서 실행하세요

INSERT INTO memos (id, employee_id, content, created_at) VALUES
('MEMO_1763434662590', 'E-045164f8', '급여일이 20일임

EX. 9월 급여 10월 20일 지급', '2025-11-18 11:57:43+09:00'),
('MEMO_1764663723285', 'E-e4f3e691', '11월 28일 퇴사', '2025-12-15 11:09:32+09:00'),
('MEMO_1766709833831', 'E-5f96a6d4', '근로계약서 작성일자랑 4대보험 취득일자 다름', '2025-12-26 09:43:54+09:00')
ON CONFLICT (id) 
DO UPDATE SET 
    content = EXCLUDED.content,
    updated_at = NOW();

-- 등록 완료 확인
SELECT 
    m.id as 메모ID,
    m.employee_id as 근로자ID,
    e.name as 근로자명,
    m.content as 내용,
    TO_CHAR(m.created_at AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI:SS') as 작성일
FROM memos m
LEFT JOIN employees e ON e.id = m.employee_id
ORDER BY m.created_at DESC;

-- 통계
SELECT 
    COUNT(*) as 총메모수,
    COUNT(DISTINCT employee_id) as 메모있는근로자수
FROM memos;


