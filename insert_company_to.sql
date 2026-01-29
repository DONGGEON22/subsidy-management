-- TO 관리 데이터 일괄 등록 SQL
-- ⚠️ 주의: companies 테이블에 먼저 기업이 등록되어 있어야 합니다!
-- Supabase SQL Editor에서 실행하세요

-- 기업명으로 company_id를 찾아서 company_to에 insert
INSERT INTO company_to (company_id, year, to_count)
SELECT c.id, data.year, data.to_count
FROM (VALUES
    ('(주)경리업무를잘하는청년들', 2023, 2),
    ('(주)경리업무를잘하는청년들', 2024, 4),
    ('(주)경리업무를잘하는청년들', 2025, 5),
    ('(주)경리업무를잘하는청년들', 2026, 7),
    ('리현커머스', 2023, 1),
    ('하우스스튜디오', 2023, 1),
    ('하우스스튜디오', 2024, 2),
    ('하우스스튜디오', 2025, 1),
    ('하우스스튜디오', 2026, 1),
    ('아트크루', 2023, 1),
    ('아트크루', 2025, 1),
    ('(주)와컴퍼니', 2024, 4),
    ('(주)와컴퍼니', 2025, 3),
    ('세무법인청년들 본점', 2023, 30),
    ('세무법인청년들 본점', 2024, 30),
    ('세무법인청년들 본점', 2025, 30),
    ('살롱드(SALONDE)머바르니 (2호점)', 2023, 3),
    ('살롱드(SALONDE)머바르니 (2호점)', 2024, 3),
    ('머바르니 네일 기흥본점 (1호점)', 2023, 2),
    ('머바르니 네일 기흥본점 (1호점)', 2024, 2),
    ('주식회사 머바르니', 2023, 1),
    ('주식회사 머바르니', 2024, 2),
    ('머바르니스파&에스테틱', 2024, 2),
    ('다원메디칼', 2023, 2),
    ('다원메디칼', 2024, 3),
    ('본치과기공소', 2023, 3),
    ('본치과기공소', 2024, 4),
    ('본치과기공소', 2025, 3),
    ('(주)대성의료종합가스', 2025, 8),
    ('제이엠컴퍼니', 2024, 2),
    ('놀러오개 애견유치원', 2025, 3),
    ('(주)비젼디자인', 2024, 3),
    ('플러스82', 2024, 8),
    ('플러스82', 2025, 8),
    ('주식회사 사우스코어', 2025, 3),
    ('주식회사 메데이아', 2024, 2),
    ('바이도', 2025, 2)
) AS data(company_name, year, to_count)
JOIN companies c ON c.name = data.company_name
ON CONFLICT (company_id, year) 
DO UPDATE SET to_count = EXCLUDED.to_count;

-- 등록 완료 확인
SELECT 
    c.name as 기업명,
    ct.year as 연도,
    ct.to_count as TO정원
FROM company_to ct
JOIN companies c ON c.id = ct.company_id
ORDER BY c.name, ct.year;

-- 통계 확인
SELECT 
    COUNT(*) as 총TO레코드수,
    COUNT(DISTINCT company_id) as 기업수,
    SUM(to_count) as 총정원수
FROM company_to;



