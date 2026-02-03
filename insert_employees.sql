-- 근로자 데이터 일괄 등록 SQL
-- ⚠️ 주의: companies 테이블에 먼저 기업이 등록되어 있어야 합니다!
-- Supabase SQL Editor에서 실행하세요

-- 기업명으로 company_id를 찾아서 employees에 insert
INSERT INTO employees (
    company_id, name, hire_date, hire_year, business_type,
    business_applied_date, business_applied_complete,
    hiring_notify_date, hiring_notify_complete,
    round1_due_date, round1_applied_date, round1_paid, round1_paid_date, round1_amount,
    round2_due_date, round2_applied_date, round2_paid, round2_paid_date, round2_amount,
    round3_due_date, round3_applied_date, round3_paid, round3_paid_date, round3_amount,
    round4_due_date, round4_applied_date, round4_paid, round4_paid_date, round4_amount,
    resigned, resigned_date
)
SELECT 
    c.id,
    data.name,
    data.hire_date,
    data.hire_year,
    data.business_type,
    data.business_applied_date,
    data.business_applied_complete,
    data.hiring_notify_date,
    data.hiring_notify_complete,
    data.round1_due_date, data.round1_applied_date, data.round1_paid, data.round1_paid_date, data.round1_amount,
    data.round2_due_date, data.round2_applied_date, data.round2_paid, data.round2_paid_date, data.round2_amount,
    data.round3_due_date, data.round3_applied_date, data.round3_paid, data.round3_paid_date, data.round3_amount,
    data.round4_due_date, data.round4_applied_date, data.round4_paid, data.round4_paid_date, data.round4_amount,
    data.resigned,
    data.resigned_date
FROM (VALUES
    -- (주)경리업무를잘하는청년들
    ('(주)경리업무를잘하는청년들', '정소진', '2023-01-13', 2023, '유형1', '2023-03-17', true, '2023-03-31', true, '2023-08-13', '2023-08-13', true, null, null, '2023-11-13', '2023-11-13', true, null, null, '2024-02-13', null, false, null, null, '2025-01-13', null, false, null, null, true, '2025-11-17'),
    ('(주)경리업무를잘하는청년들', '이예림', '2023-08-14', 2023, '유형1', '2023-03-17', true, '2023-03-31', true, '2024-03-14', '2024-03-14', true, null, null, '2024-06-14', '2024-06-14', true, null, null, '2024-09-14', '2024-09-14', true, null, null, '2025-08-14', '2025-08-14', true, null, null, false, null),
    ('(주)경리업무를잘하는청년들', '김동건', '2024-01-15', 2024, '유형1', '2025-01-15', true, '2024-01-29', true, '2024-08-15', '2025-11-17', true, '2026-01-15', null, '2024-11-15', '2025-11-17', true, '2026-01-15', null, '2025-02-15', '2025-11-17', true, '2026-01-15', null, '2026-01-15', '2026-01-15', true, '2026-01-19', null, false, null),
    ('(주)경리업무를잘하는청년들', '김나리', '2025-01-01', 2025, '유형1', '2025-01-24', true, '2024-01-29', true, '2025-08-01', '2025-11-17', true, '2026-01-15', null, '2025-11-01', '2025-11-17', true, '2026-01-15', null, '2026-02-01', '2026-01-15', false, null, null, null, null, false, null, null, false, null),
    ('(주)경리업무를잘하는청년들', '조은', '2025-03-10', 2025, '유형1', '2025-01-24', true, '2025-05-14', true, '2025-10-10', '2025-11-17', true, '2026-01-15', null, '2026-01-10', '2026-01-15', false, null, null, '2026-04-10', null, false, null, null, null, null, false, null, null, false, null),
    ('(주)경리업무를잘하는청년들', '조희경', '2025-04-01', 2025, '유형1', '2025-01-24', true, '2025-05-14', true, '2025-11-01', '2025-11-17', true, '2026-01-15', null, '2026-02-01', '2026-01-15', false, null, null, '2026-05-01', null, false, null, null, null, null, false, null, null, false, null),
    ('(주)경리업무를잘하는청년들', '손민준', '2026-01-01', 2026, '유형1', '2026-01-26', false, null, false, '2026-08-01', null, false, null, null, '2026-11-01', null, false, null, null, '2027-02-01', null, false, null, null, null, null, false, null, null, false, null),
    ('(주)경리업무를잘하는청년들', '김유경', '2026-01-01', 2026, '유형1', '2026-01-26', false, null, false, '2026-08-01', null, false, null, null, '2026-11-01', null, false, null, null, '2027-02-01', null, false, null, null, null, null, false, null, null, false, null),
    
    -- 리현커머스
    ('리현커머스', '김슬기', '2023-04-24', 2023, '유형1', '2023-04-24', true, '2023-05-08', true, '2023-11-24', '2025-11-17', true, null, null, '2024-02-24', '2025-11-17', true, null, null, '2024-05-24', '2025-11-17', true, null, null, '2025-04-24', '2025-11-17', true, null, null, true, '2025-11-17'),
    
    -- 하우스스튜디오
    ('하우스스튜디오', '박유빈', '2023-01-01', 2023, '유형1', '2023-01-01', true, '2023-05-08', true, '2023-08-01', '2025-11-17', true, null, null, '2023-11-01', '2025-11-17', true, null, null, '2024-02-01', '2025-11-17', true, null, null, '2025-01-01', '2025-11-17', true, null, null, false, null),
    ('하우스스튜디오', '이라온', '2024-02-05', 2024, '유형1', '2024-02-05', true, '2024-02-05', true, '2024-09-05', '2025-11-17', true, null, null, '2024-12-05', '2025-11-17', true, null, null, '2025-03-05', null, false, null, null, '2026-02-05', null, false, null, null, true, '2025-11-17'),
    ('하우스스튜디오', '김나영', '2024-11-01', 2024, '유형1', '2024-02-05', true, '2024-12-24', true, '2025-06-01', '2025-11-17', true, '2026-01-13', null, '2025-09-01', '2025-09-19', true, '2026-01-13', null, '2025-12-01', '2026-01-12', true, '2026-01-13', null, '2026-11-01', null, false, null, null, false, null),
    ('하우스스튜디오', '신규 채용 예정', null, null, '유형1', '2025-11-13', true, null, false, null, null, false, null, null, null, null, false, null, null, null, null, false, null, null, null, null, false, null, null, true, '2026-01-14'),
    ('하우스스튜디오', '신규 채용 예정', '2026-02-03', 2026, '유형1', '2026-01-27', false, null, false, '2026-09-03', null, false, null, null, '2026-12-03', null, false, null, null, '2027-03-03', null, false, null, null, null, null, false, null, null, false, null),
    
    -- 아트크루
    ('아트크루', '강태준', '2023-02-01', 2023, '유형1', '2023-02-01', true, '2023-02-01', true, '2023-09-01', '2025-11-17', true, null, null, '2023-12-01', '2025-11-17', true, null, null, '2024-03-01', '2025-11-17', true, null, null, '2025-02-01', null, false, null, null, true, '2025-11-17'),
    ('아트크루', '한서인', '2025-04-01', 2025, '유형1', '2025-04-23', true, '2025-07-02', true, '2025-11-01', '2025-10-21', true, null, null, '2026-02-01', null, false, null, null, '2026-05-01', null, false, null, null, null, null, false, null, null, false, null),
    
    -- (주)와컴퍼니
    ('(주)와컴퍼니', '이의림', '2024-01-01', 2024, '유형1', '2024-01-01', true, '2024-01-01', true, '2024-08-01', '2025-11-17', true, null, null, '2024-11-01', null, false, null, null, '2025-02-01', null, false, null, null, '2026-01-01', null, false, null, null, true, '2025-11-17'),
    ('(주)와컴퍼니', '양한슬', '2024-03-01', 2024, '유형1', '2024-01-01', true, null, false, '2024-10-01', '2025-11-17', true, null, null, '2025-01-01', '2025-11-17', true, null, null, '2025-04-01', null, false, null, null, '2026-03-01', null, false, null, null, true, '2025-11-17'),
    ('(주)와컴퍼니', '안하영', '2024-11-21', 2024, '유형1', '2024-01-01', true, '2024-12-10', true, '2025-06-21', '2025-07-17', true, null, null, '2025-09-21', '2025-09-16', true, null, null, '2025-12-21', '2025-12-08', true, null, null, '2026-11-21', null, false, null, null, false, null),
    ('(주)와컴퍼니', '최주연', '2025-07-08', 2025, '유형1', '2025-07-31', true, '2025-08-06', true, '2026-02-08', null, false, null, null, '2026-05-08', null, false, null, null, '2026-08-08', null, false, null, null, null, null, false, null, null, false, null),
    
    -- 세무법인청년들 본점
    ('세무법인청년들 본점', '최현아', '2023-01-15', 2023, '유형1', '2023-01-05', true, '2023-01-15', true, '2023-08-15', '2025-11-17', true, null, null, '2023-11-15', null, false, null, null, '2024-02-15', null, false, null, null, '2025-01-15', null, false, null, null, true, '2025-11-17'),
    ('세무법인청년들 본점', '박여진', '2023-02-21', 2023, '유형1', '2023-01-05', true, '2023-03-07', true, '2023-09-21', '2025-11-17', true, null, null, '2023-12-21', '2025-11-17', true, null, null, '2024-03-21', '2025-11-17', true, null, null, '2025-02-21', '2025-11-17', true, null, null, false, null),
    ('세무법인청년들 본점', '장서희', '2023-07-03', 2023, '유형1', '2023-01-05', true, null, false, '2024-02-03', null, false, null, null, '2024-05-03', null, false, null, null, '2024-08-03', null, false, null, null, '2025-07-03', null, false, null, null, true, '2025-11-17'),
    ('세무법인청년들 본점', '조희경', '2023-08-01', 2023, '유형1', '2023-01-05', true, '2023-08-15', true, '2024-03-01', '2025-11-17', true, null, null, '2024-06-01', '2025-11-17', true, null, null, '2024-09-01', '2025-11-17', true, null, null, '2025-08-01', null, false, null, null, true, '2025-11-17'),
    ('세무법인청년들 본점', '김미미', '2023-09-01', 2023, '유형1', '2023-01-05', true, '2023-09-15', true, '2024-04-01', '2025-11-17', true, null, null, '2024-07-01', '2025-11-17', true, null, null, '2024-10-01', '2025-11-17', true, null, null, '2025-09-01', null, false, null, null, true, '2025-11-17'),
    ('세무법인청년들 본점', '송소정', '2023-09-18', 2023, '유형1', '2023-01-05', true, '2023-09-18', true, '2024-04-18', null, true, null, null, '2024-07-18', null, true, null, null, '2024-10-18', null, true, null, null, '2025-09-18', null, false, null, null, true, '2025-11-17'),
    ('세무법인청년들 본점', '오지민', '2023-10-04', 2023, '유형1', '2023-01-05', true, '2023-10-04', true, '2024-05-04', '2025-11-17', true, null, null, '2024-08-04', '2025-11-17', true, null, null, '2024-11-04', null, false, null, null, '2025-10-04', null, false, null, null, true, '2025-11-17'),
    ('세무법인청년들 본점', '우정원', '2024-01-15', 2024, '유형1', '2024-01-29', true, '2024-10-17', true, '2024-08-15', '2025-11-17', true, null, null, '2024-11-15', null, false, null, null, '2025-02-15', null, false, null, null, '2026-01-15', null, false, null, null, true, '2025-11-17'),
    ('세무법인청년들 본점', '최나람', '2025-06-12', 2025, '유형1', '2025-06-25', true, '2025-09-16', true, '2026-01-12', null, false, null, null, '2026-04-12', null, false, null, null, '2026-07-12', null, false, null, null, null, null, false, null, null, false, null),
    ('세무법인청년들 본점', '김민규', '2025-07-14', 2025, '유형1', '2025-06-25', true, '2025-09-17', true, '2026-02-14', null, false, null, null, '2026-05-14', null, false, null, null, '2026-08-14', null, false, null, null, null, null, false, null, null, false, null),
    
    -- 살롱드(SALONDE)머바르니 (2호점)
    ('살롱드(SALONDE)머바르니 (2호점)', '박민선', '2023-12-01', 2023, '유형1', '2023-12-01', true, '2023-12-01', true, '2024-07-01', '2025-11-17', true, null, null, '2024-10-01', '2025-11-17', true, null, null, '2025-01-01', '2025-11-17', true, null, null, '2025-12-01', null, false, null, null, true, '2025-11-17'),
    ('살롱드(SALONDE)머바르니 (2호점)', '서현희', '2024-11-01', 2024, '유형1', '2024-09-27', true, null, false, '2025-06-01', null, false, null, null, '2025-09-01', null, false, null, null, '2025-12-01', null, false, null, null, '2026-11-01', null, false, null, null, true, '2025-11-17'),
    ('살롱드(SALONDE)머바르니 (2호점)', '김한솔', '2024-10-01', 2024, '유형1', '2024-09-27', true, '2024-12-11', true, '2025-05-01', '2025-09-15', true, null, null, '2025-08-01', '2025-11-17', true, null, null, '2025-11-01', '2025-11-17', true, null, 1200000, '2026-10-01', null, false, null, null, true, '2025-12-02'),
    ('살롱드(SALONDE)머바르니 (2호점)', '김민영', '2024-12-01', 2024, '유형1', '2024-09-27', true, '2025-12-02', true, '2025-07-01', '2025-12-18', true, '2026-01-22', null, '2025-10-01', '2025-12-18', true, '2026-01-22', null, '2026-01-01', '2025-12-18', true, '2026-01-22', null, '2026-12-01', null, false, null, null, false, null),
    
    -- 머바르니 네일 기흥본점 (1호점)
    ('머바르니 네일 기흥본점 (1호점)', '이수현', '2023-11-01', 2023, '유형1', '2023-11-01', true, '2023-11-01', true, '2024-06-01', '2025-11-17', true, null, null, '2024-09-01', '2025-11-17', true, null, null, '2024-12-01', '2025-11-17', true, null, null, '2025-11-01', null, false, null, null, true, '2025-11-17'),
    ('머바르니 네일 기흥본점 (1호점)', '백미림', '2024-03-01', 2024, '유형1', '2024-03-01', true, '2024-03-01', true, '2024-10-01', '2025-11-17', true, null, null, '2025-01-01', '2025-11-17', true, null, null, '2025-04-01', null, false, null, null, '2026-03-01', null, false, null, null, true, '2025-11-17'),
    ('머바르니 네일 기흥본점 (1호점)', '유지연', '2024-03-01', 2024, '유형1', '2024-03-01', true, '2024-03-15', true, '2024-10-01', '2025-11-17', true, null, null, '2025-01-01', '2025-11-17', true, null, null, '2025-04-01', '2025-11-17', true, null, null, '2026-03-01', null, false, null, null, false, null),
    
    -- 주식회사 머바르니
    ('주식회사 머바르니', '고은별', '2023-12-01', 2023, '유형1', null, false, null, false, '2024-07-01', null, false, null, null, '2024-10-01', null, false, null, null, '2025-01-01', null, false, null, null, '2025-12-01', null, false, null, null, true, '2025-11-17'),
    ('주식회사 머바르니', '서우영', '2024-09-01', 2024, '유형1', '2024-09-01', true, '2024-11-27', true, '2025-04-01', '2025-04-01', true, null, null, '2025-07-01', '2025-07-01', true, null, null, '2025-10-01', '2025-10-28', true, null, null, '2026-09-01', null, false, null, null, false, null),
    
    -- 머바르니스파&에스테틱
    ('머바르니스파&에스테틱', '박소라', '2024-10-01', 2024, '유형1', '2024-10-01', true, '2025-04-30', true, '2025-05-01', '2025-05-01', true, null, null, '2025-08-01', '2025-11-26', true, null, null, '2025-11-01', '2025-11-26', true, null, null, '2026-10-01', null, false, null, null, false, null),
    
    -- 다원메디칼
    ('다원메디칼', '이서현', '2023-05-03', 2023, '유형1', '2023-05-03', true, '2023-05-17', true, '2023-12-03', '2025-11-17', true, null, null, '2024-03-03', '2025-11-17', true, null, null, '2024-06-03', '2025-11-17', true, null, null, '2025-05-03', '2025-11-17', true, null, null, false, null),
    ('다원메디칼', '김기훈', '2023-06-01', 2023, '유형1', '2023-05-03', true, '2023-06-15', true, '2024-01-01', '2025-11-17', true, null, null, '2024-04-01', '2025-11-17', true, null, null, '2024-07-01', '2025-11-17', true, null, null, '2025-06-01', null, false, null, null, true, '2025-11-17'),
    ('다원메디칼', '송승헌', '2024-06-12', 2024, '유형1', '2024-06-12', true, null, false, '2025-01-12', null, false, null, null, '2025-04-12', null, false, null, null, '2025-07-12', null, false, null, null, '2026-06-12', null, false, null, null, true, '2025-11-17'),
    ('다원메디칼', '한태희', '2024-12-31', 2024, '유형1', '2024-06-12', true, '2024-12-31', true, '2025-07-31', '2025-07-31', true, '2026-01-14', null, '2025-10-31', '2025-10-20', true, '2026-01-14', null, '2026-01-31', '2026-01-14', false, null, null, '2026-12-31', null, false, null, null, false, null),
    
    -- 본치과기공소
    ('본치과기공소', '박소영', '2023-10-11', 2023, '유형1', '2023-10-11', true, '2023-10-11', true, '2024-05-11', '2025-11-17', true, null, null, '2024-08-11', '2025-11-17', true, null, null, '2024-11-11', '2025-11-17', true, null, null, '2025-10-11', null, false, null, null, true, '2025-11-17'),
    ('본치과기공소', '박은솔', '2024-12-20', 2024, '유형1', '2024-12-20', true, '2024-12-23', true, '2025-07-20', '2025-11-17', true, null, null, '2025-10-20', null, false, null, null, '2026-01-20', null, false, null, null, '2026-12-20', null, false, null, null, true, '2025-11-17'),
    
    -- (주)대성의료종합가스
    ('(주)대성의료종합가스', '정현정', '2025-01-20', 2025, '유형2', '2025-02-13', true, '2025-02-25', true, '2025-08-20', '2025-11-25', true, null, null, '2025-11-20', null, true, null, null, '2026-02-20', null, false, null, null, '2027-01-20', null, false, null, null, false, null),
    
    -- 제이엠컴퍼니
    ('제이엠컴퍼니', '이세형', '2024-08-01', 2024, '유형1', '2024-08-01', true, '2024-08-28', true, '2025-03-01', '2025-11-17', true, null, null, '2025-06-01', '2025-11-17', true, null, null, '2025-09-01', '2025-11-17', true, null, null, '2026-08-01', null, false, null, null, false, null),
    ('제이엠컴퍼니', '황근호', '2024-08-01', 2024, '유형1', '2024-08-01', true, '2024-08-28', true, '2025-03-01', '2025-11-17', true, null, null, '2025-06-01', '2025-11-17', true, null, null, '2025-09-01', '2025-11-17', true, null, null, '2026-08-01', null, false, null, null, false, null),
    
    -- 플러스82
    ('플러스82', '최혜진', '2024-08-05', 2024, '유형1', '2024-10-29', true, '2024-11-12', true, '2025-03-05', '2025-11-17', true, null, null, '2025-06-05', '2025-11-17', true, null, null, '2025-09-05', '2025-11-17', true, null, null, '2026-08-05', null, false, null, null, true, '2025-11-17'),
    ('플러스82', '정현배', '2024-12-11', 2024, '유형1', '2024-10-29', true, null, false, '2025-07-11', null, false, null, null, '2025-10-11', null, false, null, null, '2026-01-11', null, false, null, null, '2026-12-11', null, false, null, null, true, '2025-11-17'),
    ('플러스82', '엄민지', '2025-02-17', 2025, '유형1', '2025-02-17', true, '2025-04-07', true, '2025-09-17', '2025-11-17', true, '2026-01-14', null, '2025-12-17', '2025-12-15', false, null, 1800000, '2026-03-17', null, false, null, null, null, null, false, null, null, false, null),
    ('플러스82', '이예림', '2025-03-18', 2025, '유형1', '2025-02-17', true, null, false, '2025-10-18', null, false, null, null, '2026-01-18', null, false, null, null, '2026-04-18', null, false, null, null, null, null, false, null, null, true, '2025-11-17'),
    ('플러스82', '이동복', '2025-11-11', 2025, '유형1', '2025-02-17', true, '2025-12-23', true, '2026-06-11', null, false, null, null, '2026-09-11', null, false, null, null, '2026-12-11', null, false, null, null, null, null, false, null, null, false, null),
    
    -- (주)비젼디자인
    ('(주)비젼디자인', '이재웅', '2024-06-07', 2024, '유형1', '2025-06-21', true, '2025-08-20', true, '2025-01-07', '2025-01-07', true, '2026-01-05', null, '2025-04-07', '2025-04-07', true, '2026-01-05', null, '2025-07-07', '2025-07-07', true, '2026-01-05', null, '2026-06-07', null, false, null, null, false, null),
    
    -- 주식회사 사우스코어
    -- (데이터 없음)
    
    -- 주식회사 메데이아
    -- (데이터 없음)
    
    -- 바이도
    ('바이도', '전미라', '2025-10-01', 2025, '유형1', '2025-11-18', true, '2025-12-17', true, '2026-05-01', null, false, null, null, '2026-08-01', null, false, null, null, '2026-11-01', null, false, null, null, null, null, false, null, null, false, null),
    ('바이도', '이현지', '2025-08-18', 2025, '유형1', '2025-11-18', true, '2025-12-17', true, '2026-03-18', null, false, null, null, '2026-06-18', null, false, null, null, '2026-09-18', null, false, null, null, null, null, false, null, null, false, null),
    
    -- 고스트블랙연남
    ('고스트블랙연남', '안태진', '2025-05-23', 2025, '유형1', '2025-07-28', true, '2025-08-18', true, '2025-12-23', '2026-01-26', false, null, null, '2026-03-23', null, false, null, null, '2026-06-23', null, false, null, null, null, null, false, null, null, false, null),
    ('고스트블랙연남', '손민종', '2025-06-06', 2025, '유형1', '2025-07-28', true, '2025-08-18', true, '2025-12-23', '2026-01-26', false, null, null, '2026-03-23', null, false, null, null, '2026-06-23', null, false, null, null, null, null, false, null, null, false, null)

) AS data(
    company_name, name, hire_date, hire_year, business_type,
    business_applied_date, business_applied_complete,
    hiring_notify_date, hiring_notify_complete,
    round1_due_date, round1_applied_date, round1_paid, round1_paid_date, round1_amount,
    round2_due_date, round2_applied_date, round2_paid, round2_paid_date, round2_amount,
    round3_due_date, round3_applied_date, round3_paid, round3_paid_date, round3_amount,
    round4_due_date, round4_applied_date, round4_paid, round4_paid_date, round4_amount,
    resigned, resigned_date
)
JOIN companies c ON c.name = data.company_name;

-- 등록 완료 확인
SELECT 
    c.name as 기업명,
    e.name as 근로자명,
    e.hire_date as 입사일,
    e.hire_year as 입사년도,
    e.resigned as 퇴사여부
FROM employees e
JOIN companies c ON c.id = e.company_id
ORDER BY c.name, e.hire_date;

-- 통계
SELECT 
    COUNT(*) as 총근로자수,
    COUNT(DISTINCT company_id) as 기업수,
    SUM(CASE WHEN resigned THEN 1 ELSE 0 END) as 퇴사자수,
    SUM(CASE WHEN NOT resigned THEN 1 ELSE 0 END) as 재직자수
FROM employees;





