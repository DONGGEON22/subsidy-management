-- 유형2 근로자 데이터 추가 등록 SQL
-- ⚠️ 주의: 
-- 1. companies 테이블에 먼저 기업이 등록되어 있어야 합니다!
-- 2. employees 테이블이 이미 생성되어 있어야 합니다!
-- 3. 유형2는 청년고용 관련 필드도 포함됩니다!
-- Supabase SQL Editor에서 실행하세요

-- 기업명으로 company_id를 찾아서 employees에 insert
INSERT INTO employees (
    company_id, name, hire_date, hire_year, business_type,
    business_applied_date, business_applied_complete,
    hiring_notify_date, hiring_notify_complete,
    round1_due_date, round1_applied_date, round1_paid, round1_paid_date, round1_amount,
    round2_due_date, round2_applied_date, round2_paid, round2_paid_date, round2_amount,
    round3_due_date, round3_applied_date, round3_paid, round3_paid_date, round3_amount,
    youth1_due_date, youth1_notified_date, youth1_complete, youth1_paid_date, youth1_amount,
    youth2_due_date, youth2_notified_date, youth2_complete, youth2_paid_date, youth2_amount,
    youth3_due_date, youth3_notified_date, youth3_complete, youth3_paid_date, youth3_amount,
    youth4_due_date, youth4_notified_date, youth4_complete, youth4_paid_date, youth4_amount,
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
    data.youth1_due_date, data.youth1_notified_date, data.youth1_complete, data.youth1_paid_date, data.youth1_amount,
    data.youth2_due_date, data.youth2_notified_date, data.youth2_complete, data.youth2_paid_date, data.youth2_amount,
    data.youth3_due_date, data.youth3_notified_date, data.youth3_complete, data.youth3_paid_date, data.youth3_amount,
    data.youth4_due_date, data.youth4_notified_date, data.youth4_complete, data.youth4_paid_date, data.youth4_amount,
    data.resigned,
    data.resigned_date
FROM (VALUES
    -- 주식회사 사우스코어 - 유형2
    ('주식회사 사우스코어', '김기영', '2025-02-01', 2025, '유형2', 
     '2025-02-19', true, '2025-04-14', true, 
     '2025-09-01', '2025-12-01', true, null, null,
     '2025-12-01', '2025-12-02', true, null, null,
     '2026-03-01', null, false, null, null,
     '2025-08-01', '2025-12-01', true, null, null,
     '2026-02-01', null, false, null, null,
     '2026-08-01', null, false, null, null,
     '2027-02-01', null, false, null, null,
     false, null),
    
    ('주식회사 사우스코어', '김예진', '2025-12-01', 2025, '유형2',
     '2025-02-19', true, '2026-01-16', true,
     '2026-07-01', null, false, null, null,
     '2026-10-01', null, false, null, null,
     '2027-01-01', null, false, null, null,
     '2026-06-01', null, false, null, null,
     '2026-12-01', null, false, null, null,
     '2027-06-01', null, false, null, null,
     '2027-12-01', null, false, null, null,
     false, null)

) AS data(
    company_name, name, hire_date, hire_year, business_type,
    business_applied_date, business_applied_complete,
    hiring_notify_date, hiring_notify_complete,
    round1_due_date, round1_applied_date, round1_paid, round1_paid_date, round1_amount,
    round2_due_date, round2_applied_date, round2_paid, round2_paid_date, round2_amount,
    round3_due_date, round3_applied_date, round3_paid, round3_paid_date, round3_amount,
    youth1_due_date, youth1_notified_date, youth1_complete, youth1_paid_date, youth1_amount,
    youth2_due_date, youth2_notified_date, youth2_complete, youth2_paid_date, youth2_amount,
    youth3_due_date, youth3_notified_date, youth3_complete, youth3_paid_date, youth3_amount,
    youth4_due_date, youth4_notified_date, youth4_complete, youth4_paid_date, youth4_amount,
    resigned, resigned_date
)
JOIN companies c ON c.name = data.company_name;

-- 등록 완료 확인
SELECT 
    c.name as 기업명,
    e.name as 근로자명,
    e.hire_date as 입사일,
    e.business_type as 사업유형,
    e.youth1_complete as 청년1차완료,
    e.resigned as 퇴사여부
FROM employees e
JOIN companies c ON c.id = e.company_id
WHERE e.business_type = '유형2'
ORDER BY c.name, e.hire_date;

-- 통계
SELECT 
    business_type as 사업유형,
    COUNT(*) as 근로자수
FROM employees
GROUP BY business_type
ORDER BY business_type;




