require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3001;

// Supabase 초기화
const SUPABASE_URL = 'https://knkffxwcsrkxjneffyzh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtua2ZmeHdjc3JreGpuZWZmeXpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MzM1MjcsImV4cCI6MjA4NTAwOTUyN30.qNn5K02eo7dT_ToFEOS8oGKloKzSrCtxJsDM-2U_cVU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 미들웨어
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());

// 세션 설정
app.use(session({
    secret: process.env.SESSION_SECRET || 'subsidy-mgmt-secret-key-2026-secure-random-string',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // HTTPS 사용 시 true로 변경
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24시간
    }
}));

// 인증 미들웨어
const requireAuth = (req, res, next) => {
    if (req.session && req.session.isAdmin) {
        return next();
    }
    res.status(401).json({ success: false, error: '로그인이 필요합니다.' });
};

// 정적 파일 제공 (로그인 페이지는 인증 없이 접근 가능)
app.use(express.static('public'));

// ===== 유틸리티 함수 =====
function calculateDueDate(hireDate, round, isYouth = false) {
    if (!hireDate) return null;
    const date = new Date(hireDate);
    const hireYear = date.getFullYear();
    const originalDay = date.getDate(); // 원래 일자 저장
    
    let months;
    if (isYouth) {
        const youthMonths = { 1: 6, 2: 12, 3: 18, 4: 24 };
        months = youthMonths[round];
    } else {
        // 모든 연도 통일: 6, 9, 12개월
        const scheduleMonths = { 1: 6, 2: 9, 3: 12, 4: 24 };
        months = scheduleMonths[round];
    }
    
    if (!months) return null;
    
    // 월 계산
    date.setMonth(date.getMonth() + months);
    
    // 월말 보정: 원래 일자보다 작아졌으면 전 달 말일로 조정
    // 예: 8월 31일 + 6개월 = 2월 31일(없음) → 3월 3일이 되는 것을 2월 28/29일로 보정
    if (date.getDate() < originalDay) {
        date.setDate(0); // 전 달 말일로 설정
    }
    
    return date.toISOString().split('T')[0];
}

// ===== API 엔드포인트 =====

// ===== 관리자 계정 설정 (환경변수 또는 여기서 직접 설정) =====
// 🔐 기본 관리자 계정:
//    아이디: admin
//    비밀번호: admin1234
// ⚠️ 로그인 후 반드시 비밀번호를 변경하세요! (사이드바의 🔑 버튼)
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '$2b$10$LjtsxnUJpQ/G8FoHPaxTB.c5UmkJ5E8NrcH7BMOzV0yb/5oYkOF12';

// ===== 인증 API =====
// 로그인
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ 
                success: false, 
                error: '아이디와 비밀번호를 입력해주세요.' 
            });
        }

        // 관리자 계정 확인
        if (username !== ADMIN_USERNAME) {
            return res.status(401).json({ 
                success: false, 
                error: '아이디 또는 비밀번호가 올바르지 않습니다.' 
            });
        }

        // 비밀번호가 설정되지 않은 경우
        if (!ADMIN_PASSWORD_HASH) {
            return res.status(401).json({ 
                success: false, 
                error: '관리자 비밀번호가 설정되지 않았습니다. setup-admin-password.js를 실행하세요.' 
            });
        }

        // 비밀번호 확인
        const isPasswordValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);

        if (!isPasswordValid) {
            return res.status(401).json({ 
                success: false, 
                error: '아이디 또는 비밀번호가 올바르지 않습니다.' 
            });
        }

        // 세션에 관리자 정보 저장
        req.session.isAdmin = true;
        req.session.username = username;

        console.log(`✅ 관리자 로그인 성공: ${username}`);

        res.json({
            success: true,
            message: '로그인 성공',
            user: {
                username: username,
                isAdmin: true
            }
        });
    } catch (error) {
        console.error('로그인 오류:', error);
        res.status(500).json({ success: false, error: '서버 오류가 발생했습니다.' });
    }
});

// 로그아웃
app.post('/api/auth/logout', (req, res) => {
    const username = req.session.username;
    req.session.destroy((err) => {
        if (err) {
            console.error('로그아웃 오류:', err);
            return res.status(500).json({ success: false, error: '로그아웃 실패' });
        }
        console.log(`✅ 로그아웃: ${username || '관리자'}`);
        res.json({ success: true, message: '로그아웃되었습니다.' });
    });
});

// 세션 확인
app.get('/api/auth/check', (req, res) => {
    if (req.session && req.session.isAdmin) {
        res.json({
            success: true,
            authenticated: true,
            user: {
                username: req.session.username,
                isAdmin: true
            }
        });
    } else {
        res.json({
            success: true,
            authenticated: false
        });
    }
});

// 비밀번호 변경 (관리자만)
app.post('/api/auth/change-password', requireAuth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // 입력 검증
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                error: '현재 비밀번호와 새 비밀번호를 입력해주세요.' 
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ 
                success: false, 
                error: '새 비밀번호는 8자 이상이어야 합니다.' 
            });
        }

        // 현재 비밀번호가 설정되지 않은 경우
        if (!ADMIN_PASSWORD_HASH) {
            return res.status(400).json({ 
                success: false, 
                error: '현재 비밀번호가 설정되지 않았습니다.' 
            });
        }

        // 현재 비밀번호 확인
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, ADMIN_PASSWORD_HASH);

        if (!isCurrentPasswordValid) {
            return res.status(401).json({ 
                success: false, 
                error: '현재 비밀번호가 올바르지 않습니다.' 
            });
        }

        // 새 비밀번호 암호화
        const newHashedPassword = await bcrypt.hash(newPassword, 10);

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('⚠️  관리자 비밀번호가 변경되었습니다!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('새 비밀번호 해시값을 server.js 파일에 업데이트하세요:');
        console.log('');
        console.log('const ADMIN_PASSWORD_HASH = \'' + newHashedPassword + '\';');
        console.log('');
        console.log('또는 .env 파일에 추가하세요:');
        console.log('ADMIN_PASSWORD_HASH=' + newHashedPassword);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        res.json({
            success: true,
            message: '비밀번호가 변경되었습니다. 서버 로그를 확인하여 새 해시값을 저장하세요.',
            newHash: newHashedPassword
        });
    } catch (error) {
        console.error('비밀번호 변경 오류:', error);
        res.status(500).json({ success: false, error: '서버 오류가 발생했습니다.' });
    }
});

// ===== 보호된 API 엔드포인트 =====

// 기업 목록 조회
app.get('/api/companies', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .eq('active', true)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // 클라이언트가 기대하는 형식으로 변환
        const companies = (data || []).map(company => ({
            id: company.id,
            name: company.name,
            businessNumber: company.business_number,
            ceoName: company.ceo_name,
            ceoIdNumber: company.ceo_id_number,
            contact: company.contact,
            email: company.email,
            password: company.password_encrypted,
            siteUrl: company.site_url,
            commission: company.commission,
            active: company.active
        }));
        
        res.json({
            success: true,
            data: companies
        });
    } catch (error) {
        console.error('기업 조회 오류:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 기업 추가
app.post('/api/companies', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('companies')
            .insert([{
                name: req.body.name,
                business_number: req.body.businessNumber || null,
                ceo_name: req.body.ceoName || null,
                ceo_id_number: req.body.ceoIdNumber || null,
                contact: req.body.contact || null,
                email: req.body.email || null,
                password_encrypted: req.body.password || null,
                site_url: req.body.siteUrl || null,
                commission: req.body.commission || 0,
                active: true
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        // 변환
        const company = {
            id: data.id,
            name: data.name,
            businessNumber: data.business_number,
            ceoName: data.ceo_name,
            ceoIdNumber: data.ceo_id_number,
            contact: data.contact,
            email: data.email,
            password: data.password_encrypted,
            siteUrl: data.site_url,
            commission: data.commission,
            active: data.active
        };
        
        res.status(201).json({
            success: true,
            message: '기업이 추가되었습니다.',
            data: company
        });
    } catch (error) {
        console.error('기업 추가 오류:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 기업 수정
app.put('/api/companies/:id', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('companies')
            .update({
                name: req.body.name,
                business_number: req.body.businessNumber || null,
                ceo_name: req.body.ceoName || null,
                ceo_id_number: req.body.ceoIdNumber || null,
                contact: req.body.contact || null,
                email: req.body.email || null,
                password_encrypted: req.body.password || null,
                site_url: req.body.siteUrl || null,
                commission: req.body.commission || 0
            })
            .eq('id', req.params.id)
            .select()
            .single();
        
        if (error) throw error;
        
        // 변환
        const company = {
            id: data.id,
            name: data.name,
            businessNumber: data.business_number,
            ceoName: data.ceo_name,
            ceoIdNumber: data.ceo_id_number,
            contact: data.contact,
            email: data.email,
            password: data.password_encrypted,
            siteUrl: data.site_url,
            commission: data.commission,
            active: data.active
        };
        
        res.json({
            success: true,
            message: '기업 정보가 수정되었습니다.',
            data: company
        });
    } catch (error) {
        console.error('기업 수정 오류:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 기업 TO(정원) 설정
app.post('/api/company-to', requireAuth, async (req, res) => {
    try {
        const { companyId, year, limit } = req.body;
        
        // 기존 TO가 있는지 확인
        const { data: existing } = await supabase
            .from('company_to')
            .select('*')
            .eq('company_id', companyId)
            .eq('year', year)
            .single();
        
        if (existing) {
            // 업데이트
            const { data, error } = await supabase
                .from('company_to')
                .update({ to_count: limit })
                .eq('company_id', companyId)
                .eq('year', year)
                .select()
                .single();
            
            if (error) throw error;
            
            res.json({
                success: true,
                message: 'TO가 업데이트되었습니다.',
                data
            });
        } else {
            // 생성
            const { data, error } = await supabase
                .from('company_to')
                .insert([{
                    company_id: companyId,
                    year: year,
                    to_count: limit
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            res.status(201).json({
                success: true,
                message: 'TO가 설정되었습니다.',
                data
            });
        }
    } catch (error) {
        console.error('TO 설정 오류:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 근로자 목록 조회
app.get('/api/employees', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('employees')
            .select('*, companies(name)')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // 데이터 변환 (기존 형식과 호환)
        const employees = (data || []).map(emp => ({
            근로자ID: emp.id,
            기업ID: emp.company_id,
            기업명: emp.companies?.name || emp.company_name,
            이름: emp.name,
            입사일: emp.hire_date,
            입사년도: emp.hire_year,
            사업유형: emp.business_type,
            사업신청일: emp.business_applied_date,
            사업신청완료: emp.business_applied_complete,
            채용자통보일: emp.hiring_notify_date,
            채용자통보완료: emp.hiring_notify_complete,
            '1차 신청 예정일': emp.round1_due_date,
            '1차 신청일': emp.round1_applied_date,
            '1차 지급확인': emp.round1_paid,
            '1차 지급일': emp.round1_paid_date,
            '1차금액': emp.round1_amount,
            '2차 신청 예정일': emp.round2_due_date,
            '2차 신청일': emp.round2_applied_date,
            '2차 지급확인': emp.round2_paid,
            '2차 지급일': emp.round2_paid_date,
            '2차금액': emp.round2_amount,
            '3차 신청 예정일': emp.round3_due_date,
            '3차 신청일': emp.round3_applied_date,
            '3차 지급확인': emp.round3_paid,
            '3차 지급일': emp.round3_paid_date,
            '3차금액': emp.round3_amount,
            '4차 신청 예정일': emp.round4_due_date,
            '4차 신청일': emp.round4_applied_date,
            '4차 지급확인': emp.round4_paid,
            '4차 지급일': emp.round4_paid_date,
            '4차금액': emp.round4_amount,
            '청년1차 안내 예정일': emp.youth1_due_date,
            '청년1차 안내일': emp.youth1_notified_date,
            '청년1차 안내완료': emp.youth1_complete,
            '청년1차 지급일': emp.youth1_paid_date,
            '청년1차금액': emp.youth1_amount,
            '청년2차 안내 예정일': emp.youth2_due_date,
            '청년2차 안내일': emp.youth2_notified_date,
            '청년2차 안내완료': emp.youth2_complete,
            '청년2차 지급일': emp.youth2_paid_date,
            '청년2차금액': emp.youth2_amount,
            '청년3차 안내 예정일': emp.youth3_due_date,
            '청년3차 안내일': emp.youth3_notified_date,
            '청년3차 안내완료': emp.youth3_complete,
            '청년3차 지급일': emp.youth3_paid_date,
            '청년3차금액': emp.youth3_amount,
            '청년4차 안내 예정일': emp.youth4_due_date,
            '청년4차 안내일': emp.youth4_notified_date,
            '청년4차 안내완료': emp.youth4_complete,
            '청년4차 지급일': emp.youth4_paid_date,
            '청년4차금액': emp.youth4_amount,
            퇴사여부: emp.resigned,
            퇴사일: emp.resigned_date
        }));
        
        res.json({
            success: true,
            data: employees
        });
    } catch (error) {
        console.error('근로자 조회 오류:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 근로자 추가
app.post('/api/employees', requireAuth, async (req, res) => {
    try {
        const { companyId, name, hireDate, businessType } = req.body;
        const hireYear = hireDate ? new Date(hireDate).getFullYear() : new Date().getFullYear();
        
        // TO(정원) 확인
        // ⚠️ NOTE: 동시 등록 시 Race Condition 가능성 있음
        // 완벽한 해결을 위해서는 Supabase RPC 함수로 트랜잭션 처리 필요
        const { data: toData } = await supabase
            .from('company_to')
            .select('to_count')
            .eq('company_id', companyId)
            .eq('year', hireYear)
            .single();
        
        if (toData) {
            // 현재 해당 연도의 재직 중인 근로자 수 확인
            const { data: currentEmployees, error: countError } = await supabase
                .from('employees')
                .select('id')
                .eq('company_id', companyId)
                .eq('hire_year', hireYear)
                .eq('resigned', false);
            
            if (countError) throw countError;
            
            const currentCount = (currentEmployees || []).length;
            const toCount = toData.to_count;
            
            if (currentCount >= toCount) {
                console.warn(`🔴 TO 초과 시도: ${hireYear}년 ${currentCount}/${toCount}명`);
                return res.status(400).json({
                    success: false,
                    error: `${hireYear}년 TO(정원) ${toCount}명이 모두 채워졌습니다. (현재 ${currentCount}명)`
                });
            }
            
            console.log(`✅ TO 확인: ${hireYear}년 ${currentCount}/${toCount}명 - 추가 가능`);
        }
        
        // 같은 회사의 같은 입사년도 근로자가 있는지 확인하여 사업승인 정보 가져오기
        const { data: existingEmployees } = await supabase
            .from('employees')
            .select('business_applied_date, business_applied_complete, hiring_notify_date, hiring_notify_complete')
            .eq('company_id', companyId)
            .eq('hire_year', hireYear)
            .limit(1);
        
        let businessSyncData = {};
        if (existingEmployees && existingEmployees.length > 0) {
            const existing = existingEmployees[0];
            businessSyncData = {
                business_applied_date: existing.business_applied_date,
                business_applied_complete: existing.business_applied_complete,
                hiring_notify_date: existing.hiring_notify_date,
                hiring_notify_complete: existing.hiring_notify_complete
            };
            console.log(`✅ ${hireYear}년 입사 기존 근로자의 사업승인 정보 적용`);
        }
        
        // 자동으로 신청 예정일 계산
        const round1DueDate = calculateDueDate(hireDate, 1, false);
        const round2DueDate = calculateDueDate(hireDate, 2, false);
        const round3DueDate = calculateDueDate(hireDate, 3, false);
        const round4DueDate = hireYear <= 2024 ? calculateDueDate(hireDate, 4, false) : null;
        
        const youth1DueDate = calculateDueDate(hireDate, 1, true);
        const youth2DueDate = calculateDueDate(hireDate, 2, true);
        const youth3DueDate = calculateDueDate(hireDate, 3, true);
        const youth4DueDate = calculateDueDate(hireDate, 4, true);
        
        const { data, error } = await supabase
            .from('employees')
            .insert([{
                company_id: companyId,
                name,
                hire_date: hireDate || null,
                hire_year: hireYear,
                business_type: businessType || '유형1',
                ...businessSyncData, // 같은 연도의 사업승인 정보 적용
                round1_due_date: round1DueDate,
                round2_due_date: round2DueDate,
                round3_due_date: round3DueDate,
                round4_due_date: round4DueDate,
                youth1_due_date: youth1DueDate,
                youth2_due_date: youth2DueDate,
                youth3_due_date: youth3DueDate,
                youth4_due_date: youth4DueDate
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        res.status(201).json({
            success: true,
            message: '근로자가 등록되었습니다.',
            data
        });
    } catch (error) {
        console.error('근로자 추가 오류:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 근로자 수정
app.put('/api/employees/:id', requireAuth, async (req, res) => {
    try {
        const updateData = req.body;
        
        // 먼저 현재 근로자 정보를 조회하여 회사 ID와 입사년도 확인
        const { data: currentEmployee, error: fetchError } = await supabase
            .from('employees')
            .select('company_id, hire_year')
            .eq('id', req.params.id)
            .single();
        
        if (fetchError) throw fetchError;
        
        // 한글 키를 영문 DB 컬럼명으로 변환
        const dbData = {
            name: updateData.이름,
            hire_date: updateData.입사일 || null,
            hire_year: updateData.입사년도,
            business_type: updateData.사업유형,
            business_applied_date: updateData.사업신청일 || null,
            business_applied_complete: updateData.사업신청완료 || false,
            hiring_notify_date: updateData.채용자통보일 || null,
            hiring_notify_complete: updateData.채용자통보완료 || false,
            round1_due_date: updateData['1차 신청 예정일'] || null,
            round1_applied_date: updateData['1차 신청일'] || null,
            round1_paid: updateData['1차 지급확인'] || false,
            round1_paid_date: updateData['1차 지급일'] || null,
            round1_amount: updateData['1차금액'] || null,
            round2_due_date: updateData['2차 신청 예정일'] || null,
            round2_applied_date: updateData['2차 신청일'] || null,
            round2_paid: updateData['2차 지급확인'] || false,
            round2_paid_date: updateData['2차 지급일'] || null,
            round2_amount: updateData['2차금액'] || null,
            round3_due_date: updateData['3차 신청 예정일'] || null,
            round3_applied_date: updateData['3차 신청일'] || null,
            round3_paid: updateData['3차 지급확인'] || false,
            round3_paid_date: updateData['3차 지급일'] || null,
            round3_amount: updateData['3차금액'] || null,
            round4_due_date: updateData['4차 신청 예정일'] || null,
            round4_applied_date: updateData['4차 신청일'] || null,
            round4_paid: updateData['4차 지급확인'] || false,
            round4_paid_date: updateData['4차 지급일'] || null,
            round4_amount: updateData['4차금액'] || null,
            youth1_due_date: updateData['청년1차 안내 예정일'] || null,
            youth1_notified_date: updateData['청년1차 안내일'] || null,
            youth1_complete: updateData['청년1차 안내완료'] || false,
            youth1_paid_date: updateData['청년1차 지급일'] || null,
            youth1_amount: updateData['청년1차금액'] || null,
            youth2_due_date: updateData['청년2차 안내 예정일'] || null,
            youth2_notified_date: updateData['청년2차 안내일'] || null,
            youth2_complete: updateData['청년2차 안내완료'] || false,
            youth2_paid_date: updateData['청년2차 지급일'] || null,
            youth2_amount: updateData['청년2차금액'] || null,
            youth3_due_date: updateData['청년3차 안내 예정일'] || null,
            youth3_notified_date: updateData['청년3차 안내일'] || null,
            youth3_complete: updateData['청년3차 안내완료'] || false,
            youth3_paid_date: updateData['청년3차 지급일'] || null,
            youth3_amount: updateData['청년3차금액'] || null,
            youth4_due_date: updateData['청년4차 안내 예정일'] || null,
            youth4_notified_date: updateData['청년4차 안내일'] || null,
            youth4_complete: updateData['청년4차 안내완료'] || false,
            youth4_paid_date: updateData['청년4차 지급일'] || null,
            youth4_amount: updateData['청년4차금액'] || null,
            resigned: updateData.퇴사여부 || false,
            resigned_date: updateData.퇴사일 || null
        };
        
        // 해당 근로자 업데이트
        const { data, error } = await supabase
            .from('employees')
            .update(dbData)
            .eq('id', req.params.id)
            .select()
            .single();
        
        if (error) throw error;
        
        // 퇴사 처리가 아닌 경우에만 사업승인 동기화
        // 재직 중인 근로자만 동기화 대상에 포함
        if (!dbData.resigned) {
            // 사업승인 관련 필드가 있는 경우, 같은 회사의 같은 입사년도 근로자들 동기화
            const businessSyncFields = {
                business_applied_date: dbData.business_applied_date,
                business_applied_complete: dbData.business_applied_complete,
                hiring_notify_date: dbData.hiring_notify_date,
                hiring_notify_complete: dbData.hiring_notify_complete
            };
            
            // 같은 회사, 같은 입사년도(업데이트된 입사년도)의 다른 재직 근로자들 업데이트
            const { error: syncError } = await supabase
                .from('employees')
                .update(businessSyncFields)
                .eq('company_id', currentEmployee.company_id)
                .eq('hire_year', dbData.hire_year) // 업데이트된 입사년도 사용
                .eq('resigned', false) // 재직 중인 근로자만
                .neq('id', req.params.id); // 현재 근로자 제외
            
            if (syncError) {
                console.error('🔴 동기화 오류:', syncError);
                // 동기화 실패 시 경고와 함께 응답
                return res.json({
                    success: true,
                    message: '근로자 정보가 수정되었으나 동기화에 실패했습니다.',
                    data,
                    warning: `같은 입사년도 근로자 동기화 실패: ${syncError.message}`,
                    syncFailed: true
                });
            } else {
                console.log(`✅ ${dbData.hire_year}년 입사 근로자들 사업승인 정보 동기화 완료`);
            }
        } else {
            console.log(`📋 퇴사 처리 완료 - 동기화 생략`);
        }
        
        res.json({
            success: true,
            message: '근로자 정보가 수정되었습니다.',
            data
        });
    } catch (error) {
        console.error('근로자 수정 오류:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 근로자 삭제
app.delete('/api/employees/:id', requireAuth, async (req, res) => {
    try {
        const { error } = await supabase
            .from('employees')
            .delete()
            .eq('id', req.params.id);
        
        if (error) throw error;
        
        res.json({
            success: true,
            message: '근로자가 삭제되었습니다.'
        });
    } catch (error) {
        console.error('근로자 삭제 오류:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 대시보드 데이터
app.get('/api/dashboard', requireAuth, async (req, res) => {
    try {
        const { data: employees, error } = await supabase
            .from('employees')
            .select('*, companies(name)')
            .eq('resigned', false);
        
        if (error) throw error;
        
        // UTC 기준 오늘 날짜 (타임존 이슈 방지)
        const now = new Date();
        const today = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            0, 0, 0, 0
        ));
        
        const upcoming = [];
        const pending = [];
        
        (employees || []).forEach(emp => {
            const hireYear = emp.hire_year || (emp.hire_date ? new Date(emp.hire_date).getFullYear() : 9999);
            const maxRound = (hireYear > 0 && hireYear <= 2024) ? 4 : 3;
            
            // 사업신청 기한 확인
            if (emp.business_applied_date && !emp.business_applied_complete) {
                const appliedDate = new Date(emp.business_applied_date);
                const daysElapsed = Math.floor((today - appliedDate) / (1000 * 60 * 60 * 24));
                if (daysElapsed >= 0) {
                    upcoming.push({
                        employeeId: emp.id,
                        companyId: emp.company_id,
                        companyName: emp.companies?.name,
                        employeeName: emp.name,
                        applicationRound: '사업신청',
                        dueDate: emp.business_applied_date,
                        type: 'business'
                    });
                }
            }
            
            // 채용자통보 기한 확인
            if (emp.hiring_notify_date && !emp.hiring_notify_complete) {
                const notifyDate = new Date(emp.hiring_notify_date);
                const daysElapsed = Math.floor((today - notifyDate) / (1000 * 60 * 60 * 24));
                if (daysElapsed >= 0) {
                    upcoming.push({
                        employeeId: emp.id,
                        companyId: emp.company_id,
                        companyName: emp.companies?.name,
                        employeeName: emp.name,
                        applicationRound: '채용자통보',
                        dueDate: emp.hiring_notify_date,
                        type: 'hiring'
                    });
                }
            }
            
            // 1~4차 신청 기한 도래 확인
            for (let round = 1; round <= maxRound; round++) {
                const dueDate = emp[`round${round}_due_date`];
                const appliedDate = emp[`round${round}_applied_date`];
                const isPaid = emp[`round${round}_paid`];
                
                // 신청 기한 도래
                if (dueDate && !appliedDate) {
                    const due = new Date(dueDate);
                    if (due <= today) {
                        upcoming.push({
                            employeeId: emp.id,
                            companyId: emp.company_id,
                            companyName: emp.companies?.name,
                            employeeName: emp.name,
                            applicationRound: `${round}차 지원금`,
                            dueDate: dueDate,
                            type: 'subsidy'
                        });
                    }
                }
                
                // 승인 대기 (신청했지만 지급 미확인)
                if (appliedDate && !isPaid) {
                    const applied = new Date(appliedDate);
                    const daysElapsed = Math.floor((today - applied) / (1000 * 60 * 60 * 24));
                    
                    pending.push({
                        employeeId: emp.id,
                        companyId: emp.company_id,
                        companyName: emp.companies?.name,
                        employeeName: emp.name,
                        applicationRound: `${round}차 지원금`,
                        appliedDate: appliedDate,
                        daysElapsed,
                        type: 'subsidy'
                    });
                }
            }
            
            // 청년고용 1~4차 안내 확인
            for (let round = 1; round <= 4; round++) {
                const dueDate = emp[`youth${round}_due_date`];
                const notifiedDate = emp[`youth${round}_notified_date`];
                const isCompleted = emp[`youth${round}_notified_complete`];
                
                // 안내 기한 도래
                if (dueDate && !notifiedDate) {
                    const due = new Date(dueDate);
                    if (due <= today) {
                        upcoming.push({
                            employeeId: emp.id,
                            companyId: emp.company_id,
                            companyName: emp.companies?.name,
                            employeeName: emp.name,
                            applicationRound: `청년${round}차 안내`,
                            dueDate: dueDate,
                            type: 'youth'
                        });
                    }
                }
                
                // 안내 완료 대기
                if (notifiedDate && !isCompleted) {
                    const notified = new Date(notifiedDate);
                    const daysElapsed = Math.floor((today - notified) / (1000 * 60 * 60 * 24));
                    
                    pending.push({
                        employeeId: emp.id,
                        companyId: emp.company_id,
                        companyName: emp.companies?.name,
                        employeeName: emp.name,
                        applicationRound: `청년${round}차 안내`,
                        appliedDate: notifiedDate,
                        daysElapsed,
                        type: 'youth'
                    });
                }
            }
        });
        
        console.log('📊 대시보드 데이터 생성:', {
            totalEmployees: employees.length,
            upcomingCount: upcoming.length,
            pendingCount: pending.length,
            upcomingSample: upcoming.slice(0, 3),
            pendingSample: pending.slice(0, 3)
        });
        
        res.json({
            success: true,
            data: {
                upcoming,
                pending
            }
        });
    } catch (error) {
        console.error('대시보드 조회 오류:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// TO 추가
app.post('/api/to', requireAuth, async (req, res) => {
    try {
        const { companyId, year, toCount } = req.body;
        
        const { data, error } = await supabase
            .from('company_to')
            .upsert([{
                company_id: companyId,
                year,
                to_count: toCount
            }], {
                onConflict: 'company_id,year'
            })
            .select()
            .single();
        
        if (error) throw error;
        
        res.json({
            success: true,
            message: 'TO가 설정되었습니다.',
            data
        });
    } catch (error) {
        console.error('TO 설정 오류:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// TO 상태 조회
app.get('/api/to/:companyId/status', requireAuth, async (req, res) => {
    try {
        const { companyId } = req.params;
        
        // TO 목록 조회
        const { data: toList, error: toError } = await supabase
            .from('company_to')
            .select('*')
            .eq('company_id', companyId);
        
        if (toError) throw toError;
        
        // 근로자 목록 조회
        const { data: employees, error: empError } = await supabase
            .from('employees')
            .select('hire_year')
            .eq('company_id', companyId)
            .eq('resigned', false);
        
        if (empError) throw empError;
        
        // TO 상태 계산
        const status = (toList || []).map(to => {
            const current = (employees || []).filter(e => e.hire_year === to.year).length;
            const exceeded = current > to.to_count;
            const available = Math.max(0, to.to_count - current);
            
            return {
                year: to.year,
                toCount: to.to_count,
                current,
                exceeded,
                available
            };
        });
        
        res.json({
            success: true,
            data: status
        });
    } catch (error) {
        console.error('TO 상태 조회 오류:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// TO 삭제
app.delete('/api/to/:companyId/:year', requireAuth, async (req, res) => {
    try {
        const { companyId, year } = req.params;
        
        const { error } = await supabase
            .from('company_to')
            .delete()
            .eq('company_id', companyId)
            .eq('year', parseInt(year));
        
        if (error) throw error;
        
        res.json({
            success: true,
            message: 'TO가 삭제되었습니다.'
        });
    } catch (error) {
        console.error('TO 삭제 오류:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 메모 조회
app.get('/api/memos/:employeeId', requireAuth, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('employee_memos')
            .select('*')
            .eq('employee_id', req.params.employeeId)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // 데이터 변환
        const memos = (data || []).map(memo => ({
            id: memo.id,
            employeeId: memo.employee_id,
            content: memo.content,
            date: memo.created_at.split('T')[0]
        }));
        
        res.json({
            success: true,
            data: memos
        });
    } catch (error) {
        console.error('메모 조회 오류:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 메모 추가
app.post('/api/memos', requireAuth, async (req, res) => {
    try {
        const { employeeId, content } = req.body;
        
        const { data, error } = await supabase
            .from('employee_memos')
            .insert([{
                employee_id: employeeId,
                content
            }])
            .select()
            .single();
        
        if (error) throw error;
        
        res.json({
            success: true,
            message: '메모가 추가되었습니다.',
            data: {
                id: data.id,
                employeeId: data.employee_id,
                content: data.content,
                date: data.created_at.split('T')[0]
            }
        });
    } catch (error) {
        console.error('메모 추가 오류:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 메모 삭제
app.delete('/api/memos/:id', requireAuth, async (req, res) => {
    try {
        const { error } = await supabase
            .from('employee_memos')
            .delete()
            .eq('id', req.params.id);
        
        if (error) throw error;
        
        res.json({
            success: true,
            message: '메모가 삭제되었습니다.'
        });
    } catch (error) {
        console.error('메모 삭제 오류:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 수수료 정산 데이터
app.get('/api/commission', requireAuth, async (req, res) => {
    try {
        // 지급 완료된 근로자 조회 (회사 정보 포함)
        const { data: employees, error } = await supabase
            .from('employees')
            .select('*, companies(name, commission)')
            .eq('resigned', false)
            .order('name', { ascending: true });
        
        if (error) throw error;
        
        console.log('📊 수수료 계산 시작, 총 근로자:', employees?.length || 0);
        
        // 월별 정산 데이터 생성
        const commissionData = {};
        
        (employees || []).forEach(emp => {
            const companyName = emp.companies?.name;
            let commissionRate = parseFloat(emp.companies?.commission) || 0;
            
            // 수수료율 검증
            if (commissionRate < 0 || commissionRate > 100) {
                console.warn(`⚠️ 비정상 수수료율: ${commissionRate}% (기업: ${companyName})`);
                commissionRate = 0;
            }
            
            // 각 차수별로 처리
            for (let round = 1; round <= 4; round++) {
                const isPaid = emp[`round${round}_paid`];
                const appliedDate = emp[`round${round}_applied_date`]; // 신청일 = 승인 버튼 누른 날
                
                // 지급확인이 되고, 신청일(승인일)이 있는 경우에만 처리
                if (isPaid && appliedDate) {
                    try {
                        const paidDate = new Date(appliedDate);
                        if (isNaN(paidDate.getTime())) continue;
                        
                        const yearMonth = `${paidDate.getFullYear()}-${String(paidDate.getMonth() + 1).padStart(2, '0')}`;
                        
                        // 해당 월 데이터 초기화
                        if (!commissionData[yearMonth]) {
                            commissionData[yearMonth] = {};
                        }
                        
                        // 해당 기업 데이터 초기화
                        if (!commissionData[yearMonth][emp.company_id]) {
                            commissionData[yearMonth][emp.company_id] = {
                                기업명: companyName,
                                수수료율: commissionRate,
                                총지급액: 0,
                                수수료: 0,
                                지급내역: [],
                                월말일: `${yearMonth}-01`
                            };
                        }
                        
                        // 금액 계산 (커스텀 금액이 있으면 사용, 없으면 기본 금액)
                        // null/undefined와 0을 구분하기 위해 ?? 연산자 사용
                        const customAmount = emp[`round${round}_amount`];
                        const amount = customAmount ?? getDefaultAmount(round, emp.hire_year || 2025);
                        
                        // 수수료 계산
                        const commission = Math.round(amount * commissionRate / 100);
                        
                        commissionData[yearMonth][emp.company_id].총지급액 += amount;
                        commissionData[yearMonth][emp.company_id].수수료 += commission;
                        commissionData[yearMonth][emp.company_id].지급내역.push({
                            근로자: emp.name,
                            회차: `${round}차`,
                            금액: amount,
                            지급일: appliedDate
                        });
                        
                        console.log(`  ✓ ${companyName} - ${emp.name} ${round}차: ${amount.toLocaleString()}원 × ${commissionRate}% = ${commission.toLocaleString()}원`);
                    } catch (e) {
                        console.error(`날짜 처리 오류 (${emp.name} ${round}차):`, e);
                    }
                }
            }
        });
        
        console.log('📊 수수료 계산 완료, 집계된 월:', Object.keys(commissionData).length);
        
        res.json({
            success: true,
            data: commissionData
        });
    } catch (error) {
        console.error('수수료 데이터 조회 오류:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

function getDefaultAmount(round, hireYear) {
    // hire_year가 null/undefined인 경우 경고 로그
    if (!hireYear) {
        console.warn(`⚠️ hire_year가 없습니다. 기본값 2025년 적용`);
        hireYear = 2025;
    }
    
    if (hireYear >= 2026) {
        return [0, 3600000, 1800000, 1800000][round] || 0;
    }
    return [0, 3600000, 1800000, 1800000, 4800000][round] || 0;
}

// 서버 시작
app.listen(PORT, () => {
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║                                                           ║');
    console.log('║   1자리도약장려금 관리 시스템 - Supabase 연동 버전        ║');
    console.log('║                                                           ║');
    console.log(`║   서버 실행 중: http://localhost:${PORT}                  ║`);
    console.log('║                                                           ║');
    console.log(`║   브라우저에서 http://localhost:${PORT} 로 접속하세요      ║`);
    console.log('║                                                           ║');
    console.log('║   🗄️  데이터베이스: Supabase                              ║');
    console.log('║                                                           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
});

// Vercel을 위한 export
module.exports = app;
