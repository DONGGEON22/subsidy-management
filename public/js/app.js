// ================================================================
// API 호출 헬퍼 함수 (google.script.run 대체)
// ================================================================
const api = {
    async call(endpoint, method = 'GET', data = null) {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include' // 세션 쿠키 포함
        };
        
        if (data && method !== 'GET') {
            options.body = JSON.stringify(data);
        }
        
        try {
            const response = await fetch(`/api/${endpoint}`, options);
            
            // 에러 응답도 JSON으로 파싱 시도
            const result = await response.json();
            
            if (!response.ok) {
                // 서버에서 보낸 에러 메시지 사용
                const errorMessage = result.error || result.message || `HTTP ${response.status} 오류`;
                throw new Error(errorMessage);
            }
            
            if (result.success === false) {
                throw new Error(result.error || result.message || '알 수 없는 오류');
            }
            
            return result;
        } catch (error) {
            console.error('API 호출 오류:', error);
            throw error;
        }
    }
};

// ================================================================
// 메인 앱 로직
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
    // ===============================================================
    // 상태 관리 & 전역 변수
    // ===============================================================
    const state = {
        currentView: 'dashboard',
        companies: [],
        allEmployees: [],
        employees: [],
        filteredEmployees: [],
        urgentTasks: [],    // 🚨 긴급 항목 (입사일 + 3개월 기한)
        upcomingTasks: [],
        pendingTasks: [],
        selectedCompanyId: null,
        searchKeyword: '',
        dataLoaded: false,
        showResigned: true
    };
    
    // 상수 정의
    const SUBSIDY_AMOUNTS = {
        1: 3600000,
        2: 1800000,
        3: 1800000,
        4: 4800000
    };
    
    const YOUTH_SUBSIDY_AMOUNTS = {
        1: 1200000,
        2: 1200000,
        3: 1200000,
        4: 1200000
    };
    
    const SCHEDULE_MONTHS = {
        1: 6,
        2: 9,
        3: 12,
        4: 24
    };
    
    const YOUTH_SCHEDULE_MONTHS = {
        1: 6,
        2: 12,
        3: 18,
        4: 24
    };

    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => document.querySelectorAll(selector);
    const mainContent = $('#main-content');
    const sidebar = $('#sidebar');
    const companyNavList = $('#company-nav-list');
    const employeeModal = $('#employee-modal');
    const formModal = $('#form-modal');
    const loader = $('#loader');

    // ===============================================================
    // 유틸리티 함수
    // ===============================================================
    const showLoader = () => loader.style.display = 'flex';
    const hideLoader = () => loader.style.display = 'none';
    const handleFailure = (error) => { 
        showToast('오류: ' + error.message, true); 
        hideLoader(); 
    };
    const getTodayDate = () => new Date().toISOString().split('T')[0];
    
    const formatDate = (dateValue) => {
        if (!dateValue || typeof dateValue === 'boolean') return '';
        
        if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const year = parseInt(dateValue.split('-')[0]);
            if (year < 1980) return '';
            return dateValue;
        }
        
        try {
            const date = new Date(dateValue);
            if (isNaN(date.getTime())) return '';
            if (date.getFullYear() < 1980) return '';
            return date.toISOString().split('T')[0];
        } catch (e) {
            console.error('날짜 변환 오류:', dateValue, e);
            return '';
        }
    };
    
    const showToast = (message, isError = false) => {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        if (isError) toast.style.backgroundColor = '#dc3545';
        $('#toast-container').appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    };

    const getSubsidyAmount = (round, hireYear) => {
        if (hireYear >= 2026) {
            const amounts = { 1: 3600000, 2: 1800000, 3: 1800000 };
            return amounts[round] || 0;
        }
        const amounts = { 1: 3600000, 2: 1800000, 3: 1800000, 4: 4800000 };
        return amounts[round] || 0;
    };
    
    const getYouthSubsidyAmount = (businessType, round) => {
        if (businessType === '비수도권') {
            return 1200000;
        } else if (businessType === '우대지원지역') {
            return 1500000;
        } else if (businessType === '특별지원지역') {
            return 1800000;
        } else if (businessType === '유형2') {
            return 1200000;
        }
        return 0;
    };
    
    const getScheduleMonths = (round, hireYear) => {
        // 모든 연도 통일: 6, 9, 12개월
        const months = { 1: 6, 2: 9, 3: 12, 4: 24 };
        return months[round] || 0;
    };
    
    const calculateDueDate = (hireDate, round, isYouth = false) => {
        if (!hireDate) return '';
        const date = new Date(hireDate);
        const hireYear = date.getFullYear();
        const months = isYouth ? YOUTH_SCHEDULE_MONTHS[round] : getScheduleMonths(round, hireYear);
        if (!months) return '';
        date.setMonth(date.getMonth() + months);
        return date.toISOString().split('T')[0];
    };
    
    const calculateSubsidy = (employee) => {
        let totalReceived = 0;
        let totalExpected = 0;
        let companySubsidyReceived = 0;
        let companySubsidyExpected = 0;
        let youthSubsidyReceived = 0;
        let youthSubsidyExpected = 0;
        const details = [];
        
        const businessType = employee.사업유형 || '유형1';
        const hireYear = employee.입사년도 || (employee.입사일 ? new Date(employee.입사일).getFullYear() : 9999);
        const maxRound = (hireYear > 0 && hireYear <= 2024) ? 4 : 3;
        
        for (let round = 1; round <= maxRound; round++) {
            const customAmount = employee[`${round}차금액`];
            const amount = customAmount ? parseFloat(customAmount) : getSubsidyAmount(round, hireYear);
            const isPaid = employee[`${round}차 지급확인`];
            
            if (isPaid) {
                totalReceived += amount;
                companySubsidyReceived += amount;
                details.push({ round, amount, status: '지급완료', type: '기업' });
            } else {
                totalExpected += amount;
                companySubsidyExpected += amount;
                details.push({ round, amount, status: '미지급', type: '기업' });
            }
        }
        
        const hasYouthSubsidy = ['유형2', '비수도권', '우대지원지역', '특별지원지역'].includes(businessType);
        if (hasYouthSubsidy) {
            for (let round = 1; round <= 4; round++) {
                const customAmount = employee[`청년${round}차금액`];
                const amount = customAmount ? parseFloat(customAmount) : getYouthSubsidyAmount(businessType, round);
                const isCompleted = employee[`청년${round}차 안내완료`];
                
                if (isCompleted) {
                    // 청년 지원금은 회사 수취지원금에 포함하지 않음
                    youthSubsidyReceived += amount;
                    details.push({ round, amount, status: '안내완료', type: '청년' });
                } else {
                    // 청년 지원금은 회사 수취지원금에 포함하지 않음
                    youthSubsidyExpected += amount;
                    details.push({ round, amount, status: '미안내', type: '청년' });
                }
            }
        }
        
        return { 
            totalReceived,  // 회사가 받은 지원금만 포함
            totalExpected,  // 회사가 받을 지원금만 포함
            total: totalReceived + totalExpected,  // 회사 지원금 총액
            companySubsidyReceived,
            companySubsidyExpected,
            youthSubsidyReceived,  // 청년이 받은 지원금 (별도 관리)
            youthSubsidyExpected,  // 청년이 받을 지원금 (별도 관리)
            details,
            hireYear
        };
    };
    
    const formatCurrency = (amount) => {
        return amount.toLocaleString('ko-KR') + '원';
    };
    
    const isOverdue = (dueDate) => {
        if (!dueDate) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);
        return due < today;
    };
    
    // 🎯 마감일까지 남은 일수 계산
    const getDaysUntilDue = (dueDate) => {
        if (!dueDate) return Infinity;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);
        const diffTime = due - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };
    
    const needsApplication = (employee) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const businessType = employee.사업유형 || '유형1';
        const hireYear = employee.입사년도 || (employee.입사일 ? new Date(employee.입사일).getFullYear() : 9999);
        const maxRound = (hireYear > 0 && hireYear <= 2024) ? 4 : 3;
        
        for (let round = 1; round <= maxRound; round++) {
            const dueDate = employee[`${round}차 신청 예정일`];
            const applied = employee[`${round}차 신청일`];
            const paid = employee[`${round}차 지급확인`];
            
            if (dueDate && !applied && !paid) {
                const due = new Date(dueDate);
                due.setHours(0, 0, 0, 0);
                if (due <= today) {
                    return { needed: true, round: round, overdue: true };
                }
            }
        }
        return { needed: false };
    };

    // ===============================================================
    // 렌더링 함수
    // ===============================================================
    const render = () => {
        renderSidebar();
        if (state.currentView === 'dashboard') renderDashboardView();
        else if (state.currentView === 'employees') renderEmployeeView();
    };

    const renderSidebar = () => {
        const keyword = state.searchKeyword.toLowerCase();
        const filteredCompanies = keyword 
            ? state.companies.filter(c => c.name.toLowerCase().includes(keyword))
            : state.companies;
        
        const existingSearch = $('#company-search');
        const searchValue = existingSearch ? existingSearch.value : state.searchKeyword;
        
        companyNavList.innerHTML = `
            <div id="search-wrapper" style="padding: 0 8px 16px 8px;">
                <input type="text" 
                       id="company-search" 
                       placeholder="🔍 기업 검색..." 
                       value="${searchValue}"
                       class="form-control"
                       style="margin-bottom: 8px;">
            </div>
            <div id="company-list">
                <a href="#" class="nav-item ${state.currentView === 'dashboard' ? 'active' : ''}" data-view="dashboard">🏠 대시보드</a>
                ${filteredCompanies.length > 0 
                    ? filteredCompanies.map(c => `
                        <div class="nav-item-wrapper">
                            <a href="#" class="nav-item ${state.selectedCompanyId === c.id ? 'active' : ''}" 
                               data-id="${c.id}" data-name="${c.name}">${c.name}</a>
                            ${c.email && c.siteUrl ? `<div>
                                <button class="btn-company-menu btn-email-access" data-company='${JSON.stringify(c).replace(/'/g, "&apos;")}' title="이메일 접속">📧</button>
                            </div>` : ''}
                        </div>
                    `).join('')
                    : '<div class="no-result" style="padding: 20px; text-align: center; color: #ADB3BA;">검색 결과 없음</div>'
                }
            </div>`;
        
        const newSearch = $('#company-search');
        if (newSearch) {
            newSearch.addEventListener('input', (e) => {
                e.stopPropagation();
                state.searchKeyword = e.target.value;
                const kw = e.target.value.toLowerCase();
                const filtered = kw 
                    ? state.companies.filter(c => c.name.toLowerCase().includes(kw))
                    : state.companies;
                
                const companyListContainer = $('#company-list');
                if (companyListContainer) {
                    const listHtml = `
                <a href="#" class="nav-item ${state.currentView === 'dashboard' ? 'active' : ''}" data-view="dashboard">🏠 대시보드</a>
                        ${filtered.length > 0 
                            ? filtered.map(c => `
                                <div class="nav-item-wrapper">
                                    <a href="#" class="nav-item ${state.selectedCompanyId === c.id ? 'active' : ''}" 
                                       data-id="${c.id}" data-name="${c.name}">${c.name}</a>
                                    ${c.email && c.siteUrl ? `<div>
                                        <button class="btn-company-menu btn-email-access" data-company='${JSON.stringify(c).replace(/'/g, "&apos;")}' title="이메일 접속">📧</button>
                                    </div>` : ''}
                                </div>
                            `).join('')
                            : '<div class="no-result" style="padding: 20px; text-align: center; color: #ADB3BA;">검색 결과 없음</div>'
                        }`;
                    companyListContainer.innerHTML = listHtml;
                }
            });
        }
    };

    const renderDashboardView = () => {
        mainContent.innerHTML = `
            <div class="content-header"><h1>대시보드</h1></div>
            
            <div class="card dashboard-card">
                <h2>⚠️ 신청 기한 도래 항목</h2>
                <div style="margin-bottom: 16px; padding: 12px; background: var(--background-gray); border-radius: var(--radius-md); font-size: 13px; color: var(--text-secondary);">
                    <strong>순서:</strong> ① 사업신청 (입사일+2개월) → ② 채용자통보 (사업신청+2개월) → ③ 1~4차 지원금 신청
                </div>
                <div id="upcoming-list">
                ${state.upcomingTasks.length > 0 ? state.upcomingTasks.map(task => {
                    const isOverdueTask = isOverdue(task.dueDate);
                    
                    // 🎯 급한 항목 판단 로직
                    const daysUntilDue = getDaysUntilDue(task.dueDate);
                    let urgencyClass = '';
                    
                    if (isOverdueTask) {
                        urgencyClass = 'overdue';  // 🔴 기한 지남
                    } else if (daysUntilDue <= 3) {
                        urgencyClass = 'within-3days';  // 🟠 3일 이내
                    } else if (daysUntilDue <= 7) {
                        urgencyClass = 'within-week';  // 🟡 7일 이내
                    }
                    
                    let typeIcon = '💰';
                    let typeClass = 'subsidy';
                    let priorityBadge = '';
                    let dateLabel = '';
                    
                    if (task.type === 'business') {
                        typeIcon = '📋';
                        typeClass = 'business';
                        priorityBadge = '<span class="priority-badge critical">필수</span>';
                        dateLabel = isOverdueTask ? '🚨 기한 지남' : daysUntilDue <= 3 ? '🔥 급함' : '📅';
                    } else if (task.type === 'hiring') {
                        typeIcon = '📢';
                        typeClass = 'hiring';
                        priorityBadge = '<span class="priority-badge high">중요</span>';
                        dateLabel = isOverdueTask ? '🚨 기한 지남' : daysUntilDue <= 3 ? '🔥 급함' : '📅';
                    } else if (task.type === 'youth') {
                        typeIcon = '👤';
                        typeClass = 'youth';
                        priorityBadge = '<span class="priority-badge" style="background: #E1BEE7; color: #6A1B9A;">청년</span>';
                        dateLabel = isOverdueTask ? '🚨 기한 지남' : daysUntilDue <= 3 ? '🔥 급함' : '📅';
                    } else if (task.type === 'confirmation') {
                        typeIcon = '⏰';
                        typeClass = 'confirmation';
                        priorityBadge = '<span class="priority-badge warning">확인 필요</span>';
                        dateLabel = `⚠️ ${task.daysElapsed}일 경과`;
                    } else {
                        dateLabel = isOverdueTask ? '🚨 기한 지남' : daysUntilDue <= 3 ? '🔥 급함' : '📅';
                    }
                    
                    return `<div class="todo-item ${urgencyClass} ${typeClass}" 
                                 data-employee-id="${task.employeeId}" 
                                 data-company-id="${task.companyId}">
                        <span class="name">
                            ${typeIcon} <strong>${task.companyName}</strong> ${task.employeeName}
                            ${priorityBadge}
                        </span>
                        <span class="round">${task.applicationRound}</span>
                        <span class="due-date ${urgencyClass || (task.type === 'confirmation' ? 'overdue' : '')}">
                            ${dateLabel} ${task.dueDate}
                        </span>
                    </div>`;
                }).join('') : '<p class="empty-state">✅ 처리할 항목이 없습니다.</p>'}
                </div>
            </div>
            
            <div class="card dashboard-card" style="margin-top: 24px;">
                <h2>⏳ 승인 대기 항목</h2>
                <div style="margin-bottom: 16px; padding: 12px; background: #FFF9E6; border-radius: var(--radius-md); font-size: 13px; color: var(--text-secondary); border: 1px solid #FFE699;">
                    신청은 완료했지만 아직 승인 처리가 되지 않은 항목입니다.
                </div>
                <div id="pending-list">
                ${state.pendingTasks.length > 0 ? state.pendingTasks.map(task => {
                    let typeIcon = '💰';
                    let typeClass = 'pending-item subsidy';
                    let priorityBadge = '';
                    
                    const isUrgent = task.daysElapsed >= 14;
                    
                    if (task.type === 'business') {
                        typeIcon = '📋';
                        typeClass = `pending-item business ${isUrgent ? 'urgent' : ''}`;
                        priorityBadge = isUrgent 
                            ? '<span class="priority-badge urgent-badge">⚠️ 확인 필요</span>' 
                            : '<span class="priority-badge pending-badge">승인 대기</span>';
                    } else if (task.type === 'hiring') {
                        typeIcon = '📢';
                        typeClass = `pending-item hiring ${isUrgent ? 'urgent' : ''}`;
                        priorityBadge = isUrgent 
                            ? '<span class="priority-badge urgent-badge">⚠️ 확인 필요</span>' 
                            : '<span class="priority-badge pending-badge">승인 대기</span>';
                    } else if (task.type === 'youth') {
                        typeIcon = '👤';
                        typeClass = `pending-item youth ${isUrgent ? 'urgent' : ''}`;
                        priorityBadge = isUrgent 
                            ? '<span class="priority-badge urgent-badge">⚠️ 확인 필요</span>' 
                            : '<span class="priority-badge" style="background: #E1BEE7; color: #6A1B9A;">청년</span>';
                    } else {
                        typeClass = `pending-item subsidy ${isUrgent ? 'urgent' : ''}`;
                        priorityBadge = isUrgent 
                            ? '<span class="priority-badge urgent-badge">⚠️ 확인 필요</span>' 
                            : '<span class="priority-badge pending-badge">승인 대기</span>';
                    }
                    
                    const dateInfo = isUrgent 
                        ? `📝 신청일: ${task.appliedDate} (${task.daysElapsed}일 경과)` 
                        : `📝 신청일: ${task.appliedDate}`;
                    
                    return `<div class="todo-item ${typeClass}" 
                                 data-employee-id="${task.employeeId}" 
                                 data-company-id="${task.companyId}">
                        <span class="name">
                            ${typeIcon} <strong>${task.companyName}</strong> ${task.employeeName}
                            ${priorityBadge}
                        </span>
                        <span class="round">${task.applicationRound}</span>
                        <span class="due-date ${isUrgent ? 'pending-date urgent-date' : 'pending-date'}">
                            ${dateInfo}
                        </span>
                    </div>`;
                }).join('') : '<p class="empty-state">✅ 승인 대기 항목이 없습니다.</p>'}
                </div>
            </div>
            
            <div class="card dashboard-card" style="margin-top: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h2>💰 수수료 정산</h2>
                    <button id="btn-go-commission" class="btn-primary" style="padding: 10px 20px;">
                        📊 수수료 정산 보기
                    </button>
                </div>
                <p style="margin-top: 12px; color: var(--text-secondary); font-size: 14px;">
                    월별/기업별 지급 내역을 확인하고 수수료를 정산하세요.
                </p>
            </div>`;
            
        setTimeout(() => {
            const btnGoCommission = document.getElementById('btn-go-commission');
            if (btnGoCommission) {
                btnGoCommission.addEventListener('click', () => {
                    renderCommissionView();
                });
            }
        }, 0);
    };

    // 회계 양식 엑셀 내보내기 (템플릿 기반)
    const exportCommissionToExcel = async (yearMonth, companies, lastDay) => {
        if (!window.XLSX) {
            showToast('Excel 라이브러리 로딩 실패', true);
            return;
        }
        
        showLoader();
        
        try {
            // 템플릿 파일 다운로드
            const response = await fetch('/매출거래명세표일괄등록.xls');
            if (!response.ok) {
                throw new Error('템플릿 파일을 찾을 수 없습니다');
            }
            
            const arrayBuffer = await response.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            
            // 첫 번째 시트 가져오기
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // 시트를 배열로 변환 (헤더 포함)
            const existingData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
            
            // 날짜 파싱 (예: "2025-01" -> lastDay = "2025-01-31")
            const [year, month] = yearMonth.split('-');
            const monthEndDate = lastDay || `${year}-${month}-${new Date(year, month, 0).getDate()}`;
            
            // 각 기업별로 행 생성
            const newRows = [];
            Object.entries(companies).forEach(([companyId, company]) => {
                const companyName = company.기업명 || '';
                const businessNumber = company.사업자번호 || '';
                const commissionAmount = company.수수료; // 수수료 금액 (부가세 별도)
                const taxAmount = Math.round(commissionAmount * 0.1); // 세액 = 수수료 * 10%
                
                newRows.push([
                    monthEndDate,           // 거래일자: 말일
                    '사업자',                // 구분
                    companyName,            // 거래처명
                    businessNumber,         // 등록번호
                    '별도',                  // 부가세구분: 무조건 "별도"
                    '',                     // 프로젝트/창고: 공란
                    '',                     // 창고: 공란
                    monthEndDate,           // 품목월일: 말일
                    '',                     // 품목코드: 공란
                    '경리아웃소싱 대행 수수료', // 품목명
                    '',                     // 규격: 공란
                    1,                      // 수량: 1
                    '건',                   // 단위
                    commissionAmount,       // 단가
                    commissionAmount,       // 공급가액: 수수료 금액
                    taxAmount               // 세액: 수수료 * 10%
                ]);
            });
            
            // 헤더만 유지하고 2행부터 새 데이터 추가
            // 1행 = 헤더, 2행부터 = 새 데이터
            const headerRow = existingData.length > 0 ? [existingData[0]] : [];
            const combinedData = [...headerRow, ...newRows];
            
            // 새 시트 생성
            const newWorksheet = XLSX.utils.aoa_to_sheet(combinedData);
            
            // 기존 시트의 열 너비가 있으면 유지, 없으면 기본값 설정
            if (!newWorksheet['!cols']) {
                newWorksheet['!cols'] = [
                    { wch: 12 },  // 거래일자
                    { wch: 10 },  // 구분
                    { wch: 20 },  // 거래처명
                    { wch: 15 },  // 등록번호
                    { wch: 10 },  // 부가세구분
                    { wch: 12 },  // 프로젝트/창고
                    { wch: 10 },  // 창고
                    { wch: 12 },  // 품목월일
                    { wch: 10 },  // 품목코드
                    { wch: 25 },  // 품목명
                    { wch: 10 },  // 규격
                    { wch: 8 },   // 수량
                    { wch: 8 },   // 단위
                    { wch: 12 },  // 단가
                    { wch: 12 },  // 공급가액
                    { wch: 12 }   // 세액
                ];
            }
            
            // 새 워크북 생성
            const newWorkbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, sheetName);
            
            // 파일 다운로드
            const fileName = `매출거래명세표_${yearMonth}.xls`;
            XLSX.writeFile(newWorkbook, fileName);
            
            hideLoader();
            showToast(`${fileName} 다운로드 완료! (${newRows.length}개 기업 추가)`);
            
        } catch (error) {
            hideLoader();
            console.error('Excel 생성 오류:', error);
            showToast('Excel 파일 생성 중 오류 발생: ' + error.message, true);
        }
    };

    const renderCommissionView = async (selectedYearMonth = null) => {
        showLoader();
        
        try {
            const result = await api.call('commission');
            hideLoader();
            
            if (!result || !result.data) {
                console.error('수수료 데이터 조회 결과가 없습니다.');
                showToast('수수료 데이터 조회 실패', true);
                return;
            }
            
            const commissionData = result.data || {};
            const sortedMonths = Object.keys(commissionData).sort().reverse();
            
            if (sortedMonths.length === 0) {
                const modal = document.createElement('div');
                modal.className = 'modal';
                modal.id = 'commission-modal';
                modal.style.display = 'flex';
                modal.innerHTML = `
                    <div class="modal-content" style="max-width: 600px;">
                        <div class="modal-header">
                            <h2>💰 수수료 정산</h2>
                            <span class="close-btn">&times;</span>
                        </div>
                        <div class="modal-body">
                            <div style="text-align: center; padding: 40px 20px;">
                                <div style="font-size: 64px; margin-bottom: 24px;">📊</div>
                                <p style="font-size: 18px; font-weight: 600; color: var(--text-primary); margin-bottom: 12px;">
                                    아직 수수료 정산 내역이 없습니다
                                </p>
                                <p style="font-size: 14px; color: var(--text-secondary);">
                                    근로자 지급확인을 체크하면 자동으로 집계됩니다.
                                </p>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn-secondary btn-close-modal">닫기</button>
                        </div>
                    </div>
                `;
                document.body.appendChild(modal);
                
                // X 버튼과 닫기 버튼 이벤트
                const closeBtn = modal.querySelector('.close-btn');
                const closeBtnModal = modal.querySelector('.btn-close-modal');
                if (closeBtn) closeBtn.addEventListener('click', () => modal.remove());
                if (closeBtnModal) closeBtnModal.addEventListener('click', () => modal.remove());
                
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) modal.remove();
                });
                return;
            }
            
            // 기존 모달이 있으면 제거
            const existingModal = document.getElementById('commission-modal');
            if (existingModal) existingModal.remove();
            
            const currentYearMonth = selectedYearMonth || sortedMonths[0] || '';
            const currentIndex = sortedMonths.indexOf(currentYearMonth);
            const prevMonth = currentIndex < sortedMonths.length - 1 ? sortedMonths[currentIndex + 1] : null;
            const nextMonth = currentIndex > 0 ? sortedMonths[currentIndex - 1] : null;
            const currentMonthData = commissionData[currentYearMonth] || {};
            const companies = currentMonthData;
            
            let monthTotal = 0;
            let paymentTotal = 0;
            let totalCount = 0;
            
            Object.values(companies).forEach(company => {
                monthTotal += company.수수료;
                paymentTotal += company.총지급액;
                totalCount += company.지급내역.length;
            });
            
            const firstCompany = Object.values(companies)[0];
            const lastDay = firstCompany?.월말일 || '';
            
            const modal = document.createElement('div');
            modal.className = 'modal';
            modal.id = 'commission-modal';
            modal.style.display = 'flex';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 1200px; max-height: 90vh;">
                    <div class="modal-header">
                        <h2>💰 수수료 정산 - ${currentYearMonth}</h2>
                        <span class="close-btn">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div style="display: flex; justify-content: space-between; align-items: center; gap: 20px; margin-bottom: 24px; padding: 16px; background: var(--background-gray); border-radius: var(--radius-md);">
                            <button id="btn-prev-month" class="btn-secondary" style="padding: 10px 16px; font-size: 14px; ${!prevMonth ? 'opacity: 0.3; cursor: not-allowed;' : ''}" ${!prevMonth ? 'disabled' : ''}>
                                ← 이전월
                            </button>
                            
                            <div style="text-align: center; min-width: 150px;">
                                <div style="font-size: 20px; font-weight: 700; color: var(--text-primary);">
                                    ${currentYearMonth || '데이터 없음'}
                                </div>
                            </div>
                            
                            <button id="btn-next-month" class="btn-secondary" style="padding: 10px 16px; font-size: 14px; ${!nextMonth ? 'opacity: 0.3; cursor: not-allowed;' : ''}" ${!nextMonth ? 'disabled' : ''}>
                                다음월 →
                            </button>
                        </div>
                        
                        <div style="margin-bottom: 24px; padding: 24px; background: var(--primary-blue); border-radius: var(--radius-lg); color: white;">
                            <div style="font-size: 14px; opacity: 0.9; margin-bottom: 8px;">💰 ${currentYearMonth} 총 수수료</div>
                            <div style="font-size: 36px; font-weight: 700; margin-bottom: 12px;">${monthTotal.toLocaleString()}원</div>
                            <div style="display: flex; gap: 24px; font-size: 13px; opacity: 0.9;">
                                <div>총 지급액: <strong>${paymentTotal.toLocaleString()}원</strong></div>
                                <div>지급 건수: <strong>${totalCount}건</strong></div>
                                <div>기업 수: <strong>${Object.keys(companies).length}개</strong></div>
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 12px; font-size: 16px; font-weight: 600; color: var(--text-primary);">
                            🏢 기업별 수수료 내역
                        </div>
                        
                        ${Object.keys(companies).length > 0 ? `
                            <div style="background: white; border-radius: var(--radius-md); overflow: hidden; border: 1px solid var(--border-color);">
                                <table class="commission-table">
                                    <thead>
                                        <tr>
                                            <th style="width: 20%;">기업명</th>
                                            <th style="width: 10%; text-align: center;">수수료율</th>
                                            <th style="width: 35%;">지급 내역 요약</th>
                                            <th style="width: 15%; text-align: right;">총 지급액</th>
                                            <th style="width: 15%; text-align: right;">💰 수수료</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${Object.entries(companies).map(([companyId, company]) => {
                                            const employeeGroups = {};
                                            company.지급내역.forEach(item => {
                                                if (!employeeGroups[item.근로자]) {
                                                    employeeGroups[item.근로자] = [];
                                                }
                                                employeeGroups[item.근로자].push(item.회차);
                                            });
                                            
                                            const summary = Object.entries(employeeGroups)
                                                .map(([name, rounds]) => name + '(' + rounds.join(', ') + ')')
                                                .join(', ');
                                            const shortSummary = summary.length > 50 ? summary.substring(0, 50) + '...' : summary;
                                            
                                            return `
                                            <tr class="commission-table-row">
                                                <td>
                                                    <div style="display: flex; align-items: center; gap: 8px;">
                                                        <span style="font-size: 18px;">🏢</span>
                                                        <strong style="font-size: 14px;">${company.기업명}</strong>
                                                    </div>
                                                </td>
                                                <td style="text-align: center;">
                                                    <span class="commission-rate-badge">${company.수수료율}%</span>
                                                </td>
                                                <td>
                                                    <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.6;">
                                                        ${shortSummary}
                                                    </div>
                                                </td>
                                                <td style="text-align: right;">
                                                    <strong style="font-size: 15px;">${company.총지급액.toLocaleString()}원</strong>
                                                    <div style="font-size: 11px; color: var(--text-secondary); margin-top: 2px;">
                                                        ${company.지급내역.length}건
                                                    </div>
                                                </td>
                                                <td style="text-align: right;">
                                                    <strong style="font-size: 18px; color: var(--primary-blue);">
                                                        ${company.수수료.toLocaleString()}원
                                                    </strong>
                                                </td>
                                            </tr>
                                        `;
                                        }).join('')}
                                    </tbody>
                                </table>
                            </div>`
                        : `
                            <div style="text-align: center; padding: 40px 20px; background: white; border-radius: var(--radius-md); border: 1px solid var(--border-color);">
                                <div style="font-size: 48px; margin-bottom: 12px;">📊</div>
                                <p style="font-size: 14px; color: var(--text-secondary);">
                                    이 월에는 수수료 정산 내역이 없습니다.
                                </p>
                            </div>
                        `}
                    </div>
                    <div class="modal-footer">
                        <button type="button" id="btn-export-excel" class="btn-primary" style="margin-right: auto;">📊 회계 엑셀 다운로드</button>
                        <button type="button" class="btn-secondary btn-close-modal">닫기</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // X 버튼과 닫기 버튼 이벤트
            const closeBtn = modal.querySelector('.close-btn');
            const closeBtnModal = modal.querySelector('.btn-close-modal');
            if (closeBtn) closeBtn.addEventListener('click', () => modal.remove());
            if (closeBtnModal) closeBtnModal.addEventListener('click', () => modal.remove());
            
            // 모달 배경 클릭 시 닫기
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });
            
            // 이벤트 리스너 추가
            setTimeout(() => {
                const btnPrevMonth = document.getElementById('btn-prev-month');
                if (btnPrevMonth && prevMonth) {
                    btnPrevMonth.addEventListener('click', () => {
                        renderCommissionView(prevMonth);
                    });
                }
                
                const btnNextMonth = document.getElementById('btn-next-month');
                if (btnNextMonth && nextMonth) {
                    btnNextMonth.addEventListener('click', () => {
                        renderCommissionView(nextMonth);
                    });
                }
                
                const btnExportExcel = document.getElementById('btn-export-excel');
                if (btnExportExcel) {
                    btnExportExcel.addEventListener('click', () => {
                        exportCommissionToExcel(currentYearMonth, companies, lastDay);
                    });
                }
            }, 0);
            
        } catch (error) {
            hideLoader();
            console.error('수수료 데이터 조회 실패:', error);
            showToast('수수료 데이터 조회 중 오류 발생', true);
        }
    };

    const renderEmployeeView = () => {
        const company = state.companies.find(c => c.id === state.selectedCompanyId);
        
        if (!company) {
            showToast('기업 정보를 찾을 수 없습니다.', true);
            state.currentView = 'dashboard';
            renderDashboardView();
            return;
        }
        
        let displayEmployees = state.filteredEmployees.length > 0 || state.searchKeyword 
            ? state.filteredEmployees 
            : state.employees;
        
        if (!state.showResigned) {
            displayEmployees = displayEmployees.filter(emp => !emp.퇴사여부);
        }
        
        const activeCount = state.employees.filter(emp => !emp.퇴사여부).length;
        const resignedCount = state.employees.filter(emp => emp.퇴사여부).length;
        
        const employeesByYear = {};
        displayEmployees.forEach(emp => {
            let year = emp.입사년도;
            if (!year && emp.입사일) {
                try {
                    const hireDate = new Date(emp.입사일);
                    if (!isNaN(hireDate.getTime())) {
                        year = hireDate.getFullYear();
                    }
                } catch (e) {
                    year = '미정';
                }
            }
            if (!year) year = '미정';
            
            if (!employeesByYear[year]) {
                employeesByYear[year] = [];
            }
            employeesByYear[year].push(emp);
        });
        
        const sortedYears = Object.keys(employeesByYear).sort((a, b) => {
            if (a === '미정') return -1;
            if (b === '미정') return 1;
            return b - a;
        });
            
        mainContent.innerHTML = `
            <div class="content-header">
                <h1>${company.name}</h1>
            </div>
            <div class="table-header">
                <div style="flex: 1;">
                    <h3>근로자 목록</h3>
                    <div style="display: flex; gap: 8px; align-items: center; margin-top: 8px; font-size: 13px; color: var(--text-secondary);">
                        <span>재직 ${activeCount}명 · 퇴사 ${resignedCount}명</span>
                        <input type="text" 
                               id="employee-search" 
                               placeholder="🔍 근로자 이름으로 검색..." 
                               class="form-control"
                               style="max-width: 260px;">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 14px; color: var(--text-secondary); user-select: none;">
                            <input type="checkbox" id="show-resigned-toggle" ${state.showResigned ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
                            <span>퇴사자 포함</span>
                        </label>
                    </div>
                </div>
                <div style="display: flex; gap: 12px;">
                    <button class="btn-secondary" id="view-company-info-btn">🏢 기업 정보</button>
                    <button class="btn-secondary" id="manage-to-btn">📊 TO 관리</button>
                    <button class="btn-primary" id="add-employee-btn">+ 근로자 등록</button>
                </div>
            </div>
            ${sortedYears.map(year => {
                const yearEmployees = employeesByYear[year];
                let globalIndex = 0;
                for (let y of sortedYears) {
                    if (y === year) break;
                    globalIndex += employeesByYear[y].length;
                }
                
                return `
                <div class="year-section">
                    <div class="year-header">${year}년 입사 (${yearEmployees.length}명)</div>
            <div class="table-wrapper">
                <table>
                            <thead>
                                <tr>
                                    <th style="width: 60px;">No.</th>
                                    <th>이름</th>
                                    <th>입사일</th>
                                    <th>상태</th>
                                    <th>다음 예정일</th>
                                    <th style="width: 130px; white-space: nowrap;">수취 지원금</th>
                                    <th style="width: 90px;">관리</th>
                                </tr>
                            </thead>
                    <tbody>
                            ${yearEmployees.map((emp, idx) => {
                                const num = globalIndex + idx + 1;
                                let status = '', nextDueDate = '', statusClass = '';
                                const applicationNeeded = needsApplication(emp);
                                const isResigned = emp.퇴사여부;
                                
                                if (isResigned) {
                                    status = '퇴사';
                                    statusClass = 'resigned';
                                    nextDueDate = emp.퇴사일 || '-';
                                } else if (!emp.사업신청완료 && !emp.사업신청일) {
                                    status = '사업신청 대기';
                                    statusClass = 'waiting';
                                    if (emp.입사일) {
                                        try {
                                            const businessDueDate = new Date(emp.입사일);
                                            if (!isNaN(businessDueDate.getTime())) {
                                                businessDueDate.setMonth(businessDueDate.getMonth() + 2);
                                                nextDueDate = businessDueDate.toISOString().split('T')[0];
                                            } else {
                                                nextDueDate = '-';
                                            }
                                        } catch (e) {
                                            nextDueDate = '-';
                                        }
                                    } else {
                                        nextDueDate = '-';
                                    }
                                } else if (!emp.사업신청완료 && emp.사업신청일) {
                                    status = '사업승인 대기중';
                                    statusClass = 'in-progress';
                                    nextDueDate = formatDate(emp.사업신청일) || '-';
                                } else if (emp.사업신청완료 && !emp.채용자통보일) {
                                    status = '사업신청 승인완료';
                                    statusClass = 'approved';
                                    try {
                                        const validBusinessDate = formatDate(emp.사업신청일);
                                        const validHireDate = formatDate(emp.입사일);
                                        
                                        if (validBusinessDate && validHireDate) {
                                            const fromBusinessDate = new Date(validBusinessDate);
                                            fromBusinessDate.setMonth(fromBusinessDate.getMonth() + 2);
                                            
                                            const fromHireDate = new Date(validHireDate);
                                            fromHireDate.setMonth(fromHireDate.getMonth() + 2);
                                            
                                            const hiringDueDate = fromBusinessDate > fromHireDate ? fromBusinessDate : fromHireDate;
                                            nextDueDate = hiringDueDate.toISOString().split('T')[0];
                                        } else if (validBusinessDate) {
                                            const hiringDueDate = new Date(validBusinessDate);
                                            hiringDueDate.setMonth(hiringDueDate.getMonth() + 2);
                                            nextDueDate = hiringDueDate.toISOString().split('T')[0];
                                        } else if (validHireDate) {
                                            const hiringDueDate = new Date(validHireDate);
                                            hiringDueDate.setMonth(hiringDueDate.getMonth() + 2);
                                            nextDueDate = hiringDueDate.toISOString().split('T')[0];
                                        } else {
                                            nextDueDate = '-';
                                        }
                                    } catch (e) {
                                        nextDueDate = '-';
                                    }
                                } else if (emp.채용자통보일 && !emp.채용자통보완료) {
                                    status = '채용자통보 승인 대기중';
                                    statusClass = 'in-progress';
                                    nextDueDate = formatDate(emp.채용자통보일) || '-';
                                } else if (emp.채용자통보완료 && !emp['1차 신청일']) {
                                    status = '채용자통보 승인완료';
                                    statusClass = 'approved';
                                    nextDueDate = formatDate(emp['1차 신청 예정일']) || '-';
                                } else if (emp['1차 신청일'] && !emp['1차 지급확인']) {
                                    status = '1차 지원금 대기중';
                                    statusClass = 'subsidy-progress';
                                    nextDueDate = formatDate(emp['1차 신청일']) || '-';
                                } else if (emp['1차 지급확인'] && !emp['2차 신청일']) {
                                    status = '1차 승인완료';
                                    statusClass = 'approved';
                                    nextDueDate = formatDate(emp['2차 신청 예정일']) || '-';
                                } else if (emp['2차 신청일'] && !emp['2차 지급확인']) {
                                    status = '2차 지원금 대기중';
                                    statusClass = 'subsidy-progress';
                                    nextDueDate = formatDate(emp['2차 신청일']) || '-';
                                } else if (emp['2차 지급확인'] && !emp['3차 신청일']) {
                                    status = '2차 승인완료';
                                    statusClass = 'approved';
                                    nextDueDate = formatDate(emp['3차 신청 예정일']) || '-';
                                } else if (emp['3차 신청일'] && !emp['3차 지급확인']) {
                                    status = '3차 지원금 대기중';
                                    statusClass = 'subsidy-progress';
                                    nextDueDate = formatDate(emp['3차 신청일']) || '-';
                                } else if (emp['3차 지급확인']) {
                                    const businessType = emp.사업유형 || '유형1';
                                    const empHireYear = emp.입사년도 || (emp.입사일 ? new Date(emp.입사일).getFullYear() : 9999);
                                    const has4thRound = (empHireYear > 0 && empHireYear <= 2024);
                                    
                                    if (!has4thRound) {
                                        status = '전체 승인완료';
                                        statusClass = 'completed';
                                        nextDueDate = '-';
                                    } else if (!emp['4차 신청일']) {
                                        status = '3차 승인완료';
                                        statusClass = 'approved';
                                        nextDueDate = formatDate(emp['4차 신청 예정일']) || '-';
                                    } else if (emp['4차 신청일'] && !emp['4차 지급확인']) {
                                        status = '4차 지원금 대기중';
                                        statusClass = 'subsidy-progress';
                                        nextDueDate = formatDate(emp['4차 신청일']) || '-';
                                    } else if (emp['4차 지급확인']) {
                                        status = '전체 승인완료';
                                        statusClass = 'completed';
                                        nextDueDate = '-';
                                    }
                                } else {
                                    status = '상태 확인 필요';
                                    statusClass = 'pending';
                                    nextDueDate = '-';
                                }
                                
                                const isOverdueDate = !isResigned && nextDueDate !== '-' && isOverdue(nextDueDate);
                                const rowClass = `${applicationNeeded.needed && applicationNeeded.overdue && !isResigned ? 'overdue-row' : ''} ${isResigned ? 'resigned-row' : ''}`;
                                
                                const subsidy = calculateSubsidy(emp);
                                const totalDisplay = subsidy.totalReceived > 0 
                                    ? formatCurrency(subsidy.totalReceived) 
                                    : '-';
                                
                                return `<tr data-id="${emp.근로자ID}" class="${rowClass} employee-row">
                                            <td style="font-weight: 600; color: var(--text-tertiary);">${num}</td>
                                            <td><strong style="color: ${isResigned ? '#9E9E9E' : 'inherit'};">${isResigned ? '🚫 ' : ''}${applicationNeeded.needed && applicationNeeded.overdue && !isResigned ? '🚨 ' : ''}${emp.이름}</strong></td>
                                    <td style="color: ${isResigned ? '#9E9E9E' : 'inherit'};">${emp.입사일 || '-'}</td>
                                            <td><span class="status-tag ${statusClass}">${status}</span></td>
                                            <td class="${isOverdueDate ? 'overdue-date' : ''}" style="color: ${isResigned ? '#9E9E9E' : 'inherit'};">${isOverdueDate && !isResigned ? '⚠️ ' : ''}${nextDueDate}</td>
                                            <td style="text-align: right; font-weight: 700; color: ${isResigned ? '#9E9E9E' : 'var(--primary-blue)'}; font-size: 14px; white-space: nowrap;">${totalDisplay}</td>
                                            <td>
                                                <button class="btn-secondary btn-employee-actions" data-id="${emp.근로자ID}" style="white-space: nowrap; padding: 6px 14px; font-size: 13px;">수정</button>
                                            </td>
                                </tr>`
                    }).join('')}
                                ${(() => {
                                    let yearGrandTotal = 0;
                                    
                                    yearEmployees.forEach(emp => {
                                        const subsidy = calculateSubsidy(emp);
                                        yearGrandTotal += subsidy.totalReceived;
                                    });
                                    
                                    if (yearGrandTotal === 0) return '';
                                    
                                    const totalSum = formatCurrency(yearGrandTotal);
                                    
                                    return `
                                    <tr style="background: #f8f9fa; border-top: 2px solid var(--border-color); font-weight: 700;">
                                        <td colspan="5" style="text-align: right; padding-right: 16px; color: var(--text-secondary); font-size: 15px;">
                                            ${year}년 입사 총계
                                        </td>
                                        <td style="text-align: right; color: var(--primary-blue); font-size: 16px; white-space: nowrap;">${totalSum}</td>
                                        <td></td>
                                    </tr>`;
                                })()}
                    </tbody>
                </table>
                    </div>
            </div>`;
            }).join('')}
            ${displayEmployees.length === 0 ? '<div class="empty-state">검색 결과가 없습니다.</div>' : ''}`;
        
        const employeeSearchInput = $('#employee-search');
        if (employeeSearchInput) {
            employeeSearchInput.addEventListener('input', (e) => {
                const keyword = e.target.value.toLowerCase().trim();
                if (keyword) {
                    state.filteredEmployees = state.employees.filter(emp => 
                        emp.이름.toLowerCase().includes(keyword)
                    );
                } else {
                    state.filteredEmployees = [];
                }
                renderEmployeeView();
            });
        }
        
        const showResignedToggle = $('#show-resigned-toggle');
        if (showResignedToggle) {
            showResignedToggle.addEventListener('change', (e) => {
                state.showResigned = e.target.checked;
                renderEmployeeView();
            });
        }
        
        const viewCompanyInfoBtn = $('#view-company-info-btn');
        if (viewCompanyInfoBtn) {
            viewCompanyInfoBtn.addEventListener('click', () => {
                const company = state.companies.find(c => c.id === state.selectedCompanyId);
                if (company) {
                    openEditCompanyModal(company);
                }
            });
        }
        
        const manageTOBtn = $('#manage-to-btn');
        if (manageTOBtn) {
            manageTOBtn.addEventListener('click', () => {
                openFormModal('to');
            });
        }
    };

    const renderEmployeeModal = (employee) => {
        const isResigned = employee.퇴사여부;
        
        const modalHeader = employeeModal.querySelector('.modal-header');
        modalHeader.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <h2 id="modal-title">${employee.이름}</h2>
                <div style="display: flex; gap: 8px; align-items: center;">
                    <button type="button" class="btn-modal-resign" data-id="${employee.근로자ID}" data-is-resigned="${isResigned}"
                            style="background: ${isResigned ? 'var(--primary-blue)' : 'var(--warning-color)'}; color: white; border: none; padding: 8px 16px; border-radius: var(--radius-sm); cursor: pointer; font-size: 14px; font-weight: 600;">
                        ${isResigned ? '🔄 재직 전환' : '👋 퇴사 처리'}
                    </button>
                    <button type="button" class="btn-modal-delete" data-id="${employee.근로자ID}" data-name="${employee.이름}"
                            style="background: var(--error-color); color: white; border: none; padding: 8px 16px; border-radius: var(--radius-sm); cursor: pointer; font-size: 14px; font-weight: 600;">
                        🗑️ 삭제
                    </button>
                    <span class="close-btn" data-modal-id="employee-modal" style="cursor: pointer; font-size: 28px; margin-left: 8px;">&times;</span>
                </div>
            </div>
        `;
        
        $('#employee-details-form').dataset.id = employee.근로자ID;
        
        const todayDate = getTodayDate();
        const businessAppliedDate = formatDate(employee.사업신청일);
        const hiringNotifyDate = formatDate(employee.채용자통보일);
        const hireDateFormatted = formatDate(employee.입사일);
        const businessType = employee.사업유형 || '유형1';
        
        $('#tab-preliminary').innerHTML = `
            <div class="form-grid">
                <div class="form-group">
                    <label>근로자 이름</label>
                    <input type="text" name="이름" value="${employee.이름}" class="form-control" required>
                </div>
                <div class="form-group">
                    <label>입사일</label>
                    <input type="date" name="입사일" value="${hireDateFormatted}" class="form-control">
                    <div style="font-size: 12px; color: var(--text-tertiary); margin-top: 4px;">
                        ${!employee.입사일 ? '💡 입사일을 입력하면 1~4차 신청 예정일이 자동 계산됩니다.' : ''}
                    </div>
                </div>
                <div class="form-group">
                    <label>사업유형</label>
                    <select name="사업유형" class="form-control" ${employee.사업신청완료 ? 'disabled style="background-color: var(--background-gray); cursor: not-allowed;"' : ''}>
                        <option value="유형1" ${businessType === '유형1' ? 'selected' : ''}>유형1 (구)</option>
                        <option value="유형2" ${businessType === '유형2' ? 'selected' : ''}>유형2 (구)</option>
                        <option value="수도권" ${businessType === '수도권' ? 'selected' : ''}>수도권 (26년도)</option>
                        <option value="비수도권" ${businessType === '비수도권' ? 'selected' : ''}>비수도권 (26년도)</option>
                        <option value="우대지원지역" ${businessType === '우대지원지역' ? 'selected' : ''}>우대지원지역 (26년도)</option>
                        <option value="특별지원지역" ${businessType === '특별지원지역' ? 'selected' : ''}>특별지원지역 (26년도)</option>
                    </select>
                </div>
            </div>
            <div class="form-grid" style="margin-top: 20px;">
                <div class="form-group">
                    <label>사업신청일</label>
                    <div class="date-input-wrapper">
                        <input type="date" name="사업신청일" id="date-사업신청일" value="${businessAppliedDate}" class="form-control">
                        <button type="button" class="btn-today" data-target="date-사업신청일">오늘</button>
                    </div>
                    <div class="checkbox-group">
                        <input type="checkbox" name="사업신청완료" ${employee.사업신청완료 ? 'checked' : ''}>
                        <label>승인</label>
                    </div>
                </div>
                <div class="form-group">
                    <label>채용자통보일</label>
                    <div class="date-input-wrapper">
                        <input type="date" name="채용자통보일" id="date-채용자통보일" value="${hiringNotifyDate}" class="form-control">
                        <button type="button" class="btn-today" data-target="date-채용자통보일">오늘</button>
                    </div>
                    <div class="checkbox-group">
                        <input type="checkbox" name="채용자통보완료" ${employee.채용자통보완료 ? 'checked' : ''}>
                        <label>승인</label>
                    </div>
                </div>
            </div>`;
        
        const subsidy = calculateSubsidy(employee);
        
        $('#tab-payments').innerHTML = `
            <div class="subsidy-summary">
                <div class="subsidy-card">
                    <div class="subsidy-label">승인 완료</div>
                    <div class="subsidy-amount received">${formatCurrency(subsidy.companySubsidyReceived)}</div>
                </div>
                <div class="subsidy-card">
                    <div class="subsidy-label">수령예정 지원금</div>
                    <div class="subsidy-amount pending">${formatCurrency(subsidy.companySubsidyExpected)}</div>
                </div>
                <div class="subsidy-card total">
                    <div class="subsidy-label">총 지원금</div>
                    <div class="subsidy-amount total">${formatCurrency(subsidy.companySubsidyReceived + subsidy.companySubsidyExpected)}</div>
                </div>
            </div>
            ${(() => {
                const empHireYear = employee.입사년도 || (employee.입사일 ? new Date(employee.입사일).getFullYear() : 9999);
                const rounds = (empHireYear > 0 && empHireYear <= 2024) ? [1,2,3,4] : [1,2,3];
                
                return rounds.map(round => {
                    const defaultAmount = SUBSIDY_AMOUNTS[round];
                    const customAmount = employee[`${round}차금액`];
                    const displayAmount = customAmount || defaultAmount;
                    const isPaid = employee[`${round}차 지급확인`];
                    const autoDueDate = employee.입사일 ? calculateDueDate(employee.입사일, round) : '';
                    const dueDate = formatDate(employee[`${round}차 신청 예정일`]) || autoDueDate;
                    const appliedDate = formatDate(employee[`${round}차 신청일`]);
                    const paidDate = formatDate(employee[`${round}차 지급일`]);
                
                return `
                <div class="payment-row">
                    <div class="payment-row-title">${round}차 지원금 
                        <span class="subsidy-badge" style="${customAmount ? 'background: #FFF3CD; color: #856404;' : ''}">${formatCurrency(displayAmount)}</span>
                        ${customAmount ? '<span style="font-size: 11px; color: #856404; margin-left: 8px;">✏️ 수정됨</span>' : ''}
                    </div>
                    <div class="form-group">
                        <label>${round}차 지원금 금액 
                            <span style="font-size: 12px; color: var(--text-tertiary); font-weight: 400;">
                                (기본: ${formatCurrency(defaultAmount)}, 변경 시 입력)
                            </span>
                        </label>
                        <input type="text" 
                               name="${round}차금액" 
                               value="${customAmount ? customAmount.toLocaleString('ko-KR') : ''}" 
                               placeholder="${defaultAmount.toLocaleString('ko-KR')}" 
                               class="form-control amount-input" 
                               style="font-weight: 600;"
                               data-raw-value="${customAmount || ''}"
                               inputmode="numeric">
                    </div>
                    <div class="form-group">
                        <label>신청 대상 기간</label>
                        <div style="padding: 10px 12px; background: #F0F7FF; border: 1px solid #90CAF9; border-radius: 6px; font-size: 14px; font-weight: 600; color: #1976D2;">
                            ${(() => {
                                if (!employee.입사일) return '-';
                                const hireDate = new Date(employee.입사일);
                                // 이전 차수의 종료일 다음날부터
                                const prevMonths = round === 1 ? 0 : SCHEDULE_MONTHS[round - 1];
                                const startDate = new Date(hireDate);
                                startDate.setMonth(startDate.getMonth() + prevMonths);
                                
                                // 현재 차수의 마지막 날 (신청예정일 전날)
                                const endDate = new Date(hireDate);
                                endDate.setMonth(endDate.getMonth() + SCHEDULE_MONTHS[round]);
                                endDate.setDate(endDate.getDate() - 1);
                                
                                return `${formatDate(startDate.toISOString().split('T')[0])} ~ ${formatDate(endDate.toISOString().split('T')[0])}`;
                            })()}
                        </div>
                        <div style="margin-top: 6px; font-size: 11px; color: var(--text-tertiary);">
                            ※ 신청 예정일: ${dueDate || '-'} (입사일+${SCHEDULE_MONTHS[round]}개월)
                        </div>
                    </div>
                    <div class="form-group">
                        <label>${round}차 신청일</label>
                        <div class="date-input-wrapper">
                            <input type="date" name="${round}차 신청일" id="date-${round}차-신청일" value="${appliedDate}" class="form-control">
                            <button type="button" class="btn-today" data-target="date-${round}차-신청일">오늘</button>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>${round}차 지급일 <span style="font-size: 12px; color: #E91E63; font-weight: 600;">★ 수수료 정산 기준일</span></label>
                        <div class="date-input-wrapper">
                            <input type="date" name="${round}차 지급일" id="date-${round}차-지급일" value="${paidDate}" class="form-control">
                            <button type="button" class="btn-today" data-target="date-${round}차-지급일">오늘</button>
                        </div>
                        <div class="checkbox-group">
                            <input type="checkbox" name="${round}차 지급확인" ${isPaid ? 'checked' : ''}>
                            <label>승인 ${isPaid ? '✅' : ''}</label>
                        </div>
                    </div>
                </div>
                `;
                }).join('');
            })()}`;
        
        const hasYouthSubsidy = ['유형2', '비수도권', '우대지원지역', '특별지원지역'].includes(businessType);
        const youthAmountPerRound = getYouthSubsidyAmount(businessType, 1);
        const youthTotalAmount = youthAmountPerRound * 4;
        $('#tab-youth').innerHTML = hasYouthSubsidy ? `
            <div style="margin-bottom: 20px; padding: 16px; background: #E8F5E9; border-radius: var(--radius-md); border: 1px solid #4CAF50;">
                <div style="font-size: 14px; color: #2E7D32; margin-bottom: 8px;">
                    💰 <strong>채용자(청년) 지원금</strong> - ${businessType}
                </div>
                <div style="font-size: 13px; color: #424242;">
                    입사일로부터 6개월, 12개월, 18개월, 24개월에 각 ${formatCurrency(youthAmountPerRound)} 지급 (총 ${formatCurrency(youthTotalAmount)}).<br>
                    <strong style="color: #1976D2;">📢 청년에게 지원금 안내를 해야 합니다!</strong>
                </div>
            </div>
            <div class="subsidy-summary">
                <div class="subsidy-card">
                    <div class="subsidy-label">승인 완료</div>
                    <div class="subsidy-amount received">${formatCurrency(subsidy.youthSubsidyReceived)}</div>
                </div>
                <div class="subsidy-card">
                    <div class="subsidy-label">수령예정 지원금</div>
                    <div class="subsidy-amount pending">${formatCurrency(subsidy.youthSubsidyExpected)}</div>
                </div>
                <div class="subsidy-card total">
                    <div class="subsidy-label">총 지원금</div>
                    <div class="subsidy-amount total">${formatCurrency(subsidy.youthSubsidyReceived + subsidy.youthSubsidyExpected)}</div>
                </div>
            </div>
            ${[1,2,3,4].map(round => {
                const defaultAmount = YOUTH_SUBSIDY_AMOUNTS[round];
                const customAmount = employee[`청년${round}차금액`];
                const displayAmount = customAmount || defaultAmount;
                const isCompleted = employee[`청년${round}차 안내완료`];
                const autoDueDate = employee.입사일 ? calculateDueDate(employee.입사일, round, true) : '';
                const dueDate = formatDate(employee[`청년${round}차 안내 예정일`]) || autoDueDate;
                const notifiedDate = formatDate(employee[`청년${round}차 안내일`]);
                
                return `
                <div class="payment-row">
                    <div class="payment-row-title">청년${round}차 지원금 
                        <span class="subsidy-badge" style="${customAmount ? 'background: #FFF3CD; color: #856404;' : ''}">${formatCurrency(displayAmount)}</span>
                        ${customAmount ? '<span style="font-size: 11px; color: #856404; margin-left: 8px;">✏️ 수정됨</span>' : ''}
                    </div>
                    <div class="form-group">
                        <label>청년${round}차 지원금 금액 
                            <span style="font-size: 12px; color: var(--text-tertiary); font-weight: 400;">
                                (기본: ${formatCurrency(defaultAmount)}, 변경 시 입력)
                            </span>
                        </label>
                        <input type="text" 
                               name="청년${round}차금액" 
                               value="${customAmount ? customAmount.toLocaleString('ko-KR') : ''}" 
                               placeholder="${defaultAmount.toLocaleString('ko-KR')}" 
                               class="form-control amount-input" 
                               style="font-weight: 600;"
                               data-raw-value="${customAmount || ''}"
                               inputmode="numeric">
                    </div>
                    <div class="form-group">
                        <label>안내 대상 기간</label>
                        <div style="padding: 10px 12px; background: #F3E5F5; border: 1px solid #CE93D8; border-radius: 6px; font-size: 14px; font-weight: 600; color: #7B1FA2;">
                            ${(() => {
                                if (!employee.입사일) return '-';
                                const hireDate = new Date(employee.입사일);
                                // 이전 차수의 종료일 다음날부터
                                const prevMonths = round === 1 ? 0 : YOUTH_SCHEDULE_MONTHS[round - 1];
                                const startDate = new Date(hireDate);
                                startDate.setMonth(startDate.getMonth() + prevMonths);
                                
                                // 현재 차수의 마지막 날 (안내예정일 전날)
                                const endDate = new Date(hireDate);
                                endDate.setMonth(endDate.getMonth() + YOUTH_SCHEDULE_MONTHS[round]);
                                endDate.setDate(endDate.getDate() - 1);
                                
                                return `${formatDate(startDate.toISOString().split('T')[0])} ~ ${formatDate(endDate.toISOString().split('T')[0])}`;
                            })()}
                        </div>
                        <div style="margin-top: 6px; font-size: 11px; color: var(--text-tertiary);">
                            ※ 안내 예정일: ${dueDate || '-'} (입사일+${YOUTH_SCHEDULE_MONTHS[round]}개월)
                        </div>
                    </div>
                    <div class="form-group">
                        <label>청년${round}차 안내일</label>
                        <div class="date-input-wrapper">
                            <input type="date" name="청년${round}차 안내일" id="date-청년${round}차-안내일" value="${notifiedDate}" class="form-control">
                            <button type="button" class="btn-today" data-target="date-청년${round}차-안내일">오늘</button>
                        </div>
                        <div class="checkbox-group">
                            <input type="checkbox" name="청년${round}차 안내완료" ${isCompleted ? 'checked' : ''}>
                            <label>안내완료 ${isCompleted ? '✅' : ''}</label>
                        </div>
                    </div>
                </div>
                `;
            }).join('')}
        ` : `
            <div style="text-align: center; padding: 60px 20px; color: var(--text-tertiary);">
                <div style="font-size: 48px; margin-bottom: 16px;">ℹ️</div>
                <div style="font-size: 16px; margin-bottom: 8px; color: var(--text-secondary);">채용자 지원금은 유형2, 비수도권, 우대/특별지역만 해당됩니다</div>
                <div style="font-size: 14px;">이 근로자는 <strong>${businessType}</strong>입니다.</div>
            </div>
        `;
        
        const youthTabBtn = $('#tab-youth-btn');
        if (youthTabBtn) {
            youthTabBtn.style.display = hasYouthSubsidy ? 'inline-block' : 'none';
        }
        
        $('#tab-memo').innerHTML = `
            <div style="margin-bottom: 20px;">
                <h3 style="margin-bottom: 12px; font-size: 16px;">📝 새 메모 작성</h3>
                <textarea id="new-memo-content" placeholder="메모 내용을 입력하세요..." style="width: 100%; min-height: 100px; padding: 12px; border: 1px solid var(--border-color); border-radius: var(--radius-md); font-size: 14px; resize: vertical; font-family: inherit;"></textarea>
                <button type="button" id="btn-add-memo" class="btn-primary" style="margin-top: 8px;">➕ 메모 추가</button>
            </div>
            <hr style="border: none; border-top: 1px solid var(--border-color); margin: 24px 0;">
            <div>
                <h3 style="margin-bottom: 16px; font-size: 16px;">📋 메모 목록</h3>
                <div id="memo-list" style="min-height: 100px;">
                    <div style="text-align: center; padding: 40px; color: var(--text-tertiary);">
                        ⏳ 메모를 불러오는 중...
                    </div>
                </div>
            </div>
        `;
        
        const renderMemoList = (memos) => {
            if (!memos || memos.length === 0) {
                return '<div style="text-align: center; padding: 40px; color: var(--text-tertiary);">📝 등록된 메모가 없습니다.</div>';
            }
            
            return memos.map((memo) => `
                <div class="memo-item" data-memo-id="${memo.id}" style="background: white; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                        <div style="font-size: 13px; color: var(--text-tertiary);">
                            📅 ${memo.date}
                        </div>
                        <div style="display: flex; gap: 8px;">
                            <button type="button" class="btn-delete-memo" data-memo-id="${memo.id}" style="padding: 4px 10px; font-size: 12px; background: var(--error-light); color: var(--error-color); border: none; border-radius: var(--radius-sm); cursor: pointer;">🗑️ 삭제</button>
                        </div>
                    </div>
                    <div style="white-space: pre-wrap; line-height: 1.6; color: var(--text-primary);">${memo.content}</div>
                </div>
            `).join('');
        };
        
        const refreshMemoList = async () => {
            try {
                const result = await api.call(`memos/${employee.근로자ID}`);
                if (result && result.data) {
                    $('#memo-list').innerHTML = renderMemoList(result.data);
                    attachMemoEventListeners();
                }
            } catch (error) {
                $('#memo-list').innerHTML = '<div style="text-align: center; padding: 40px; color: var(--error-color);">⚠️ 메모를 불러올 수 없습니다.</div>';
                console.error('메모 로드 오류:', error);
            }
        };
        
        refreshMemoList();
        
        const attachMemoEventListeners = () => {
            $$('.btn-delete-memo').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (confirm('이 메모를 삭제하시겠습니까?')) {
                        const memoId = btn.dataset.memoId;
                        btn.disabled = true;
                        btn.innerHTML = '⏳';
                        
                        try {
                            await api.call(`memos/${memoId}`, 'DELETE');
                            showToast('메모가 삭제되었습니다.');
                            refreshMemoList();
                        } catch (error) {
                            showToast('메모 삭제 실패', true);
                            btn.disabled = false;
                            btn.innerHTML = '🗑️ 삭제';
                        }
                    }
                });
            });
        };
        
        setTimeout(() => {
            $('#btn-add-memo')?.addEventListener('click', async () => {
                const content = $('#new-memo-content').value.trim();
                if (!content) {
                    showToast('메모 내용을 입력해주세요.', true);
                    return;
                }
                
                const addBtn = $('#btn-add-memo');
                addBtn.disabled = true;
                addBtn.innerHTML = '⏳ 저장 중...';
                
                try {
                    await api.call('memos', 'POST', {
                        employeeId: employee.근로자ID,
                        content: content
                    });
                    $('#new-memo-content').value = '';
                    showToast('메모가 추가되었습니다.');
                    refreshMemoList();
                } catch (error) {
                    showToast('메모 추가 실패', true);
                } finally {
                    addBtn.disabled = false;
                    addBtn.innerHTML = '➕ 메모 추가';
                }
            });
            
            $$('.btn-today').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const targetId = btn.dataset.target;
                    const targetInput = $('#' + targetId);
                    if (targetInput) {
                        targetInput.value = todayDate;
                        targetInput.style.background = '#EBF4FF';
                        setTimeout(() => {
                            targetInput.style.background = '';
                        }, 300);
                    }
                });
            });
            
            $$('.amount-input').forEach(input => {
                input.addEventListener('input', (e) => {
                    let value = e.target.value.replace(/[^0-9]/g, '');
                    if (value) {
                        e.target.value = parseInt(value).toLocaleString('ko-KR');
                        e.target.dataset.rawValue = value;
                    } else {
                        e.target.value = '';
                        e.target.dataset.rawValue = '';
                    }
                });
                
                input.addEventListener('focus', (e) => {
                    const rawValue = e.target.dataset.rawValue;
                    if (rawValue) {
                        e.target.value = rawValue;
                    }
                });
                
                input.addEventListener('blur', (e) => {
                    const rawValue = e.target.dataset.rawValue;
                    if (rawValue) {
                        e.target.value = parseInt(rawValue).toLocaleString('ko-KR');
                    }
                });
            });
        }, 0);
        
        employeeModal.style.display = 'flex';
    };

    const openEditCompanyModal = (company) => {
        const form = $('#generic-form');
        const title = $('#form-modal-title');
        const body = $('#form-modal-body');
        
        title.textContent = '기업 정보 수정';
        body.innerHTML = `
            <input type="hidden" id="edit-company-id" value="${company.id}">
            <div class="form-group">
                <label for="edit-company-name">기업명 <span style="color: var(--error-color);">*</span></label>
                <input type="text" id="edit-company-name" required class="form-control" value="${company.name}" placeholder="예: (주)토스">
            </div>
            <div class="form-group">
                <label for="edit-business-number">사업자등록번호</label>
                <input type="text" id="edit-business-number" class="form-control" value="${company.businessNumber || ''}" placeholder="예: 123-45-67890" maxlength="12">
            </div>
            <div class="form-group">
                <label for="edit-ceo-name">대표자명</label>
                <input type="text" id="edit-ceo-name" class="form-control" value="${company.ceoName || ''}" placeholder="예: 홍길동">
            </div>
            <div class="form-group">
                <label for="edit-ceo-id-number">대표자 주민등록번호</label>
                <input type="text" id="edit-ceo-id-number" class="form-control" value="${company.ceoIdNumber || ''}" placeholder="예: 123456-1234567" maxlength="14">
            </div>
            <div class="form-group">
                <label for="edit-contact">연락처</label>
                <input type="tel" id="edit-contact" class="form-control" value="${company.contact || ''}" placeholder="예: 010-1234-5678">
            </div>
            <div class="form-group">
                <label for="edit-email">이메일</label>
                <input type="email" id="edit-email" class="form-control" value="${company.email || ''}" placeholder="예: company@example.com">
            </div>
            <div class="form-group">
                <label for="edit-password">비밀번호</label>
                <input type="password" id="edit-password" class="form-control" value="${company.password || ''}" placeholder="이메일 계정 비밀번호">
                <div style="font-size: 12px; color: var(--text-tertiary); margin-top: 4px;">
                    💡 빠른 로그인을 위해 저장됩니다 (선택사항)
                </div>
            </div>
            <div class="form-group">
                <label for="edit-site-url">사이트 URL</label>
                <input type="url" id="edit-site-url" class="form-control" value="${company.siteUrl || ''}" placeholder="예: https://www.work.go.kr">
                <div style="font-size: 12px; color: var(--text-tertiary); margin-top: 4px;">
                    💡 이메일 접속 시 열릴 사이트 주소
                </div>
            </div>
            <div class="form-group">
                <label for="edit-commission">수수료 (%)</label>
                <input type="number" id="edit-commission" class="form-control" value="${company.commission || ''}" placeholder="예: 10" min="0" max="100" step="0.1">
                <div style="font-size: 12px; color: var(--text-tertiary); margin-top: 4px;">
                    💡 지원금 대비 수수료 비율 (%)
                </div>
            </div>
        `;
        
        form.onsubmit = handleUpdateCompany;
        formModal.style.display = 'flex';
    };

    const openFormModal = (type) => {
        const form = $('#generic-form');
        const title = $('#form-modal-title');
        const body = $('#form-modal-body');
        
        if (type === 'company') {
            title.textContent = '새 기업 추가';
            body.innerHTML = `
                <div class="form-group">
                    <label for="new-company-name">기업명 <span style="color: var(--error-color);">*</span></label>
                    <input type="text" id="new-company-name" required class="form-control" placeholder="예: (주)토스">
                </div>
                <div class="form-group">
                    <label for="new-business-number">사업자등록번호</label>
                    <input type="text" id="new-business-number" class="form-control" placeholder="예: 123-45-67890" maxlength="12">
                </div>
                <div class="form-group">
                    <label for="new-ceo-name">대표자명</label>
                    <input type="text" id="new-ceo-name" class="form-control" placeholder="예: 홍길동">
                </div>
                <div class="form-group">
                    <label for="new-ceo-id-number">대표자 주민등록번호</label>
                    <input type="text" id="new-ceo-id-number" class="form-control" placeholder="예: 123456-1234567" maxlength="14">
                </div>
                <div class="form-group">
                    <label for="new-contact">연락처</label>
                    <input type="tel" id="new-contact" class="form-control" placeholder="예: 010-1234-5678">
                </div>
                <div class="form-group">
                    <label for="new-email">이메일</label>
                    <input type="email" id="new-email" class="form-control" placeholder="예: company@example.com">
                </div>
                <div class="form-group">
                    <label for="new-password">비밀번호</label>
                    <input type="password" id="new-password" class="form-control" placeholder="이메일 계정 비밀번호">
                    <div style="font-size: 12px; color: var(--text-tertiary); margin-top: 4px;">
                        💡 빠른 로그인을 위해 저장됩니다 (선택사항)
                    </div>
                </div>
                <div class="form-group">
                    <label for="new-site-url">사이트 URL</label>
                    <input type="url" id="new-site-url" class="form-control" placeholder="예: https://www.work.go.kr">
                    <div style="font-size: 12px; color: var(--text-tertiary); margin-top: 4px;">
                        💡 이메일 접속 시 열릴 사이트 주소
                    </div>
                </div>
                <div class="form-group">
                    <label for="new-commission">수수료 (%)</label>
                    <input type="number" id="new-commission" class="form-control" placeholder="예: 10" min="0" max="100" step="0.1">
                    <div style="font-size: 12px; color: var(--text-tertiary); margin-top: 4px;">
                        💡 지원금 대비 수수료 비율 (%)
                    </div>
                </div>
                <div style="padding: 12px; background: var(--primary-blue-light); border-radius: var(--radius-md); font-size: 13px; color: var(--text-secondary); margin-top: 16px;">
                    <strong>💡 필수항목:</strong> 기업명만 필수이며, 나머지는 선택사항입니다.<br>
                    신청 시 필요한 정보이므로 미리 입력하시면 편리합니다.
                </div>
            `;
            form.onsubmit = handleAddCompany;
        } else if (type === 'employee') {
            title.textContent = '새 근로자 등록';
            body.innerHTML = `
                <div class="form-group">
                    <label for="new-employee-name">근로자 이름 <span style="color: var(--error-color);">*</span></label>
                    <input type="text" id="new-employee-name" required class="form-control" placeholder="예: 홍길동">
                </div>
                <div class="form-group">
                    <label for="new-employee-hire-date">입사일</label>
                    <input type="date" id="new-employee-hire-date" class="form-control">
                </div>
                <div class="form-group">
                    <label for="new-employee-business-type">사업유형</label>
                    <select id="new-employee-business-type" class="form-control">
                        <option value="유형1">유형1 (구)</option>
                        <option value="유형2">유형2 (구)</option>
                        <option value="수도권">수도권 (26년도)</option>
                        <option value="비수도권">비수도권 (26년도)</option>
                        <option value="우대지원지역">우대지원지역 (26년도)</option>
                        <option value="특별지원지역">특별지원지역 (26년도)</option>
                    </select>
                </div>
            `;
            form.onsubmit = handleAddEmployee;
        } else if (type === 'to') {
            title.textContent = '📊 TO(정원) 관리';
            const currentCompany = state.companies.find(c => c.id === state.selectedCompanyId);
            const companyName = currentCompany ? currentCompany.name : '';
            
            body.innerHTML = `
                <div style="margin-bottom: 20px; padding: 16px; background: var(--background-gray); border-radius: var(--radius-md);">
                    <div style="font-weight: 700; font-size: 16px; margin-bottom: 12px; color: var(--primary-blue);">
                        🏢 ${companyName}
                    </div>
                    <div style="font-size: 14px; color: var(--text-secondary);">
                        연도별 TO(정원) 설정 및 현황을 관리합니다.
                    </div>
                </div>
                
                <div id="to-status-list" style="margin-bottom: 20px; max-height: 300px; overflow-y: auto;">
                    <div style="text-align: center; padding: 60px 20px; color: var(--text-tertiary);">
                        <div class="spinner" style="display: inline-block; width: 40px; height: 40px; border: 4px solid var(--border-color); border-top-color: var(--primary-blue); border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
                        <div style="margin-top: 16px; font-size: 14px;">TO 현황 불러오는 중...</div>
                    </div>
                </div>
                
                <div style="border-top: 2px solid var(--border-color); padding-top: 20px; margin-top: 20px;">
                    <div style="font-weight: 700; font-size: 16px; margin-bottom: 16px; color: var(--text-primary);">
                        ➕ 새 TO 추가
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                        <div class="form-group">
                            <label for="to-year">연도</label>
                            <input type="number" id="to-year" min="2020" max="2100" value="${new Date().getFullYear()}" required class="form-control" placeholder="예: 2024">
                        </div>
                        <div class="form-group">
                            <label for="to-count">TO 정원</label>
                            <input type="number" id="to-count" min="1" max="999" required class="form-control" placeholder="예: 3">
                        </div>
                    </div>
                </div>
            `;
            
            form.onsubmit = handleAddTO;
            formModal.style.display = 'flex';
            
            // TO 현황 비동기로 로드
            api.call(`to/${state.selectedCompanyId}/status`).then(result => {
                const toStatus = result.data || [];
                const toListContainer = $('#to-status-list');
                if (toListContainer) {
                    toListContainer.innerHTML = toStatus.length === 0 ? 
                        '<div style="text-align: center; padding: 40px; color: var(--text-tertiary);">설정된 TO가 없습니다</div>' :
                        toStatus.map(to => `
                            <div class="to-status-card" style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: white; border-radius: var(--radius-md); margin-bottom: 12px; border: 1px solid var(--border-color); ${to.exceeded ? 'border-left: 4px solid var(--error-color);' : 'border-left: 4px solid var(--success-color);'}">
                                <div>
                                    <div style="font-weight: 700; font-size: 18px; margin-bottom: 4px;">
                                        ${to.year}년도
                                    </div>
                                    <div style="font-size: 14px; color: var(--text-secondary);">
                                        현재 ${to.current}명 / TO ${to.toCount}명
                                        ${to.exceeded ? 
                                            '<span style="color: var(--error-color); font-weight: 600; margin-left: 8px;">⚠️ 초과</span>' : 
                                            `<span style="color: var(--success-color); font-weight: 600; margin-left: 8px;">✓ ${to.available}명 추가 가능</span>`
                                        }
                                    </div>
                                </div>
                                <button type="button" class="btn-icon-delete" data-year="${to.year}" style="background: var(--error-light); color: var(--error-color); border: none; padding: 8px 12px; border-radius: var(--radius-sm); cursor: pointer; font-size: 14px; font-weight: 600;">
                                    🗑️ 삭제
                                </button>
                            </div>
                        `).join('');
                    
                    // TO 삭제 버튼 이벤트
                    $$('.btn-icon-delete').forEach(btn => {
                        btn.addEventListener('click', async (e) => {
                            e.preventDefault();
                            const year = btn.dataset.year;
                            if (confirm(`${year}년도 TO를 삭제하시겠습니까?`)) {
                                const originalText = btn.innerHTML;
                                btn.innerHTML = '⏳';
                                btn.disabled = true;
                                
                                try {
                                    await api.call(`to/${state.selectedCompanyId}/${year}`, 'DELETE');
                                    showToast('TO가 삭제되었습니다.');
                                    openFormModal('to'); // 모달 새로고침
                                } catch (error) {
                                    showToast('TO 삭제 실패: ' + error.message, true);
                                    btn.innerHTML = originalText;
                                    btn.disabled = false;
                                }
                            }
                        });
                    });
                }
            }).catch(error => {
                const toListContainer = $('#to-status-list');
                if (toListContainer) {
                    toListContainer.innerHTML = `
                        <div style="text-align: center; padding: 40px; color: var(--error-color);">
                            ⚠️ 데이터 로드 실패<br>
                            <span style="font-size: 13px; color: var(--text-tertiary); margin-top: 8px; display: inline-block;">${error.message}</span>
                        </div>
                    `;
                }
            });
            
            return; // 모달이 이미 열렸으므로 아래 코드 실행 방지
        }
        
        formModal.style.display = 'flex';
    };

    // ===============================================================
    // 폼 핸들러
    // ===============================================================
    const handleAddCompany = async (e) => {
        e.preventDefault();
        
        const companyData = {
            name: $('#new-company-name').value.trim(),
            businessNumber: $('#new-business-number').value.trim(),
            ceoName: $('#new-ceo-name').value.trim(),
            ceoIdNumber: $('#new-ceo-id-number').value.trim(),
            contact: $('#new-contact').value.trim(),
            email: $('#new-email').value.trim(),
            password: $('#new-password').value.trim(),
            siteUrl: $('#new-site-url').value.trim(),
            commission: $('#new-commission').value ? parseFloat($('#new-commission').value) : 0
        };
        
        if (!companyData.name) {
            showToast('기업명을 입력해주세요.', true);
            return;
        }
        
        formModal.style.display = 'none';
        showLoader();
        
        try {
            await api.call('companies', 'POST', companyData);
            showToast('기업이 추가되었습니다.');
            await loadAllData();
        } catch (error) {
            handleFailure(error);
        }
    };

    const handleUpdateCompany = async (e) => {
        e.preventDefault();
        
        const companyData = {
            companyId: $('#edit-company-id').value,
            name: $('#edit-company-name').value.trim(),
            businessNumber: $('#edit-business-number').value.trim(),
            ceoName: $('#edit-ceo-name').value.trim(),
            ceoIdNumber: $('#edit-ceo-id-number').value.trim(),
            contact: $('#edit-contact').value.trim(),
            email: $('#edit-email').value.trim(),
            password: $('#edit-password').value.trim(),
            siteUrl: $('#edit-site-url').value.trim(),
            commission: $('#edit-commission').value ? parseFloat($('#edit-commission').value) : 0
        };
        
        if (!companyData.name) {
            showToast('기업명을 입력해주세요.', true);
            return;
        }
        
        formModal.style.display = 'none';
        showLoader();
        
        try {
            await api.call(`companies/${companyData.companyId}`, 'PUT', companyData);
            showToast('기업 정보가 수정되었습니다.');
            await loadAllData();
        } catch (error) {
            handleFailure(error);
        }
    };

    const handleAddEmployee = async (e) => {
        e.preventDefault();
        
        const name = $('#new-employee-name').value.trim();
        const hireDate = $('#new-employee-hire-date').value;
        const businessType = $('#new-employee-business-type').value;
        
        if (!name) {
            showToast('근로자 이름을 입력해주세요.', true);
            return;
        }
        
        if (!state.selectedCompanyId) {
            showToast('기업을 선택해주세요.', true);
            return;
        }
        
        formModal.style.display = 'none';
        showLoader();
        
        try {
            await api.call('employees', 'POST', {
                companyId: state.selectedCompanyId,
                name: name,
                hireDate: hireDate,
                businessType: businessType
            });
            showToast('근로자가 등록되었습니다.');
            await loadAllData();
        } catch (error) {
            handleFailure(error);
        }
    };

    const handleAddTO = async (e) => {
        e.preventDefault();
        
        const year = parseInt($('#to-year').value);
        const toCount = parseInt($('#to-count').value);
        
        if (!year || !toCount || toCount < 1) {
            showToast('연도와 TO 정원을 올바르게 입력해주세요.', true);
            return;
        }
        
        if (!state.selectedCompanyId) {
            showToast('기업을 선택해주세요.', true);
            return;
        }
        
        showLoader();
        
        try {
            await api.call('to', 'POST', {
                companyId: state.selectedCompanyId,
                year: year,
                toCount: toCount
            });
            hideLoader();
            showToast('TO가 추가되었습니다.');
            openFormModal('to'); // 모달 새로고침
        } catch (error) {
            hideLoader();
            showToast('TO 추가 실패: ' + error.message, true);
        }
    };

    // ===============================================================
    // 데이터 로딩
    // ===============================================================
    const loadAllData = async () => {
        try {
            showLoader();
            
            const [companiesResult, employeesResult, dashboardResult] = await Promise.all([
                api.call('companies'),
                api.call('employees'),
                api.call('dashboard')
            ]);
            
            state.companies = companiesResult.data || [];
            state.allEmployees = employeesResult.data || [];
            state.urgentTasks = dashboardResult.data?.urgent || [];      // 🚨 긴급 항목
            state.upcomingTasks = dashboardResult.data?.upcoming || [];
            state.pendingTasks = dashboardResult.data?.pending || [];
            state.dataLoaded = true;
            
            console.log('📊 대시보드 데이터 로드:', {
                urgent: state.urgentTasks.length,
                upcoming: state.upcomingTasks.length,
                pending: state.pendingTasks.length,
                urgentTasks: state.urgentTasks,
                upcomingTasks: state.upcomingTasks,
                pendingTasks: state.pendingTasks,
                dashboardResult: dashboardResult
            });
            
            if (state.selectedCompanyId) {
                state.employees = state.allEmployees.filter(emp => emp.기업ID === state.selectedCompanyId);
            }
            
            render();
            hideLoader();
        } catch (error) {
            handleFailure(error);
        }
    };

    // ===============================================================
    // 이벤트 리스너
    // ===============================================================
    $('#add-company-btn').addEventListener('click', () => {
        openFormModal('company');
    });

    document.addEventListener('click', e => {
        const dashboardNav = e.target.closest('[data-view="dashboard"]');
        const addEmployeeBtn = e.target.closest('#add-employee-btn');
        const employeeRow = e.target.closest('.employee-row');
        const employeeActionsBtn = e.target.closest('.btn-employee-actions');
        const todoItem = e.target.closest('.todo-item');
        const companyNav = e.target.closest('.nav-item[data-id]'); // 더 구체적인 선택자
        const emailAccessBtn = e.target.closest('.btn-email-access');
        
        // 이메일 접속 버튼 클릭
        if (emailAccessBtn) {
            e.preventDefault();
            e.stopPropagation();
            
            try {
                const companyData = JSON.parse(emailAccessBtn.dataset.company.replace(/&apos;/g, "'"));
                
                // 사이트 열기
                if (companyData.siteUrl) {
                    window.open(companyData.siteUrl, '_blank');
                    
                    // 로그인 정보 모달 표시
                    const loginModal = document.createElement('div');
                    loginModal.className = 'modal';
                    loginModal.style.display = 'flex';
                    loginModal.innerHTML = `
                        <div class="modal-content" style="max-width: 500px;">
                            <div class="modal-header">
                                <h2>📧 ${companyData.name} 로그인 정보</h2>
                                <span class="close-btn">&times;</span>
                            </div>
                            <div class="modal-body">
                                <div style="padding: 16px; background: var(--background-gray); border-radius: var(--radius-md); margin-bottom: 16px;">
                                    <div style="font-size: 14px; color: var(--text-secondary); margin-bottom: 12px;">
                                        🌐 사이트가 새 탭에서 열렸습니다. 아래 정보를 복사하여 로그인하세요.
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label style="font-weight: 600; color: var(--text-secondary); font-size: 13px;">이메일</label>
                                    <div style="padding: 12px; background: var(--background-gray); border-radius: var(--radius-sm); font-size: 15px; color: var(--text-primary); display: flex; gap: 8px; align-items: center;">
                                        <span style="flex: 1; user-select: all;">${companyData.email || ''}</span>
                                        ${companyData.email ? `<button type="button" class="btn-secondary" onclick="
                                            navigator.clipboard.writeText('${companyData.email}');
                                            this.textContent = '✅';
                                            setTimeout(() => this.textContent = '📋', 2000);
                                        " style="padding: 6px 12px; white-space: nowrap; font-size: 13px;">📋</button>` : ''}
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label style="font-weight: 600; color: var(--text-secondary); font-size: 13px;">비밀번호</label>
                                    <div style="padding: 12px; background: var(--background-gray); border-radius: var(--radius-sm); font-size: 15px; color: var(--text-primary); display: flex; gap: 8px; align-items: center;">
                                        <span style="flex: 1; user-select: all; font-family: monospace;">${companyData.password ? '●'.repeat(companyData.password.length) : ''}</span>
                                        ${companyData.password ? `<button type="button" class="btn-secondary" onclick="
                                            this.previousElementSibling.textContent = this.previousElementSibling.textContent.includes('●') ? '${companyData.password.replace(/'/g, "\\'")}' : '${'●'.repeat(companyData.password.length)}';
                                            this.textContent = this.previousElementSibling.textContent.includes('●') ? '👁️' : '🙈';
                                        " style="padding: 6px 12px; white-space: nowrap; font-size: 13px;">👁️</button>` : ''}
                                        ${companyData.password ? `<button type="button" class="btn-secondary" onclick="
                                            navigator.clipboard.writeText('${companyData.password.replace(/'/g, "\\'")}');
                                            this.textContent = '✅';
                                            setTimeout(() => this.textContent = '📋', 2000);
                                        " style="padding: 6px 12px; white-space: nowrap; font-size: 13px;">📋</button>` : ''}
                                    </div>
                                </div>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn-secondary btn-close-modal">닫기</button>
                            </div>
                        </div>
                    `;
                    document.body.appendChild(loginModal);
                    
                    // X 버튼과 닫기 버튼 이벤트
                    const closeBtn = loginModal.querySelector('.close-btn');
                    const closeBtnModal = loginModal.querySelector('.btn-close-modal');
                    if (closeBtn) closeBtn.addEventListener('click', () => loginModal.remove());
                    if (closeBtnModal) closeBtnModal.addEventListener('click', () => loginModal.remove());
                    
                    loginModal.addEventListener('click', (e) => {
                        if (e.target === loginModal) {
                            loginModal.remove();
                        }
                    });
                } else {
                    showToast('사이트 URL이 설정되지 않았습니다.', true);
                }
            } catch (error) {
                console.error('이메일 접속 오류:', error);
                showToast('이메일 접속 정보를 불러올 수 없습니다.', true);
            }
            
            return;
        }
        
        if (dashboardNav) {
            e.preventDefault();
            state.currentView = 'dashboard';
            state.selectedCompanyId = null;
            render();
            return; // 추가: 다른 핸들러 실행 방지
        }
        
        // 근로자 관련 이벤트를 먼저 처리
        if (employeeActionsBtn) {
            e.stopPropagation();
            e.preventDefault();
            const employeeId = employeeActionsBtn.dataset.id;
            const employee = state.allEmployees.find(emp => emp.근로자ID === employeeId);
            if (employee) {
                renderEmployeeModal(employee);
            }
            return; // 추가: 다른 핸들러 실행 방지
        }
        
        if (employeeRow && !employeeActionsBtn) {
            e.preventDefault();
            const employeeId = employeeRow.dataset.id;
            const employee = state.allEmployees.find(emp => emp.근로자ID === employeeId);
            if (employee) {
                renderEmployeeModal(employee);
            }
            return; // 추가: 다른 핸들러 실행 방지
        }
        
        // 회사 네비게이션 클릭 (사이드바만)
        if (companyNav && !companyNav.hasAttribute('data-view')) {
            e.preventDefault();
            const companyId = companyNav.dataset.id;
            state.selectedCompanyId = companyId;
            state.currentView = 'employees';
            state.employees = state.allEmployees.filter(emp => emp.기업ID === companyId);
            state.filteredEmployees = [];
            state.searchKeyword = '';
            render();
            return;
        }
        
        if (addEmployeeBtn) {
            e.preventDefault();
            openFormModal('employee');
            return;
        }
        
        if (todoItem) {
            e.preventDefault();
            const employeeId = todoItem.dataset.employeeId;
            const employee = state.allEmployees.find(emp => emp.근로자ID === employeeId);
            if (employee) {
                const companyId = todoItem.dataset.companyId;
                state.selectedCompanyId = companyId;
                state.currentView = 'employees';
                state.employees = state.allEmployees.filter(emp => emp.기업ID === companyId);
                render();
                setTimeout(() => {
                    renderEmployeeModal(employee);
                }, 100);
            }
            return;
        }
    });

    document.addEventListener('click', e => {
        const closeBtn = e.target.closest('.close-btn');
        if (closeBtn && closeBtn.dataset.modalId) {
            $(`#${closeBtn.dataset.modalId}`).style.display = 'none';
        }
    });

    employeeModal.addEventListener('click', e => {
        const tabBtn = e.target.closest('.tab-btn');
        const resignBtn = e.target.closest('.btn-modal-resign');
        const deleteBtn = e.target.closest('.btn-modal-delete');
        
        if (tabBtn) {
            $$('.tab-btn').forEach(btn => btn.classList.remove('active'));
            $$('.tab-content').forEach(content => content.classList.remove('active'));
            tabBtn.classList.add('active');
            $(`#${tabBtn.dataset.tab}`).classList.add('active');
        }
        
        if (resignBtn) {
            const employeeId = resignBtn.dataset.id;
            const isResigned = resignBtn.dataset.isResigned === 'true';
            const employee = state.allEmployees.find(emp => emp.근로자ID === employeeId);
            
            if (!employee) return;
            
            if (isResigned) {
                if (confirm(`${employee.이름} 근로자를 재직 상태로 전환하시겠습니까?`)) {
                    employeeModal.style.display = 'none';
                    showLoader();
                    
                    // 근로자 전체 데이터를 가져와서 업데이트
                    const updateData = {
                        ...employee,
                        퇴사여부: false,
                        퇴사일: null
                    };
                    
                    console.log('🔄 재직 전환 요청:', updateData);
                    
                    api.call(`employees/${employeeId}`, 'PUT', updateData)
                        .then((result) => {
                            console.log('✅ 재직 전환 성공:', result);
                            showToast('✅ 재직 상태로 전환되었습니다.');
                            loadAllData();
                        }).catch(handleFailure);
                }
            } else {
                const resignDate = prompt(`${employee.이름} 근로자의 퇴사일을 입력해주세요 (형식: YYYY-MM-DD)\n비워두면 오늘 날짜로 설정됩니다.`, getTodayDate());
                if (resignDate !== null) {
                    employeeModal.style.display = 'none';
                    showLoader();
                    
                    // 근로자 전체 데이터를 가져와서 업데이트
                    const updateData = {
                        ...employee,
                        퇴사여부: true,
                        퇴사일: resignDate || getTodayDate()
                    };
                    
                    console.log('🚫 퇴사 처리 요청:', updateData);
                    
                    api.call(`employees/${employeeId}`, 'PUT', updateData)
                        .then((result) => {
                            console.log('✅ 퇴사 처리 성공:', result);
                            showToast('🚫 퇴사 처리되었습니다.');
                            loadAllData();
                        }).catch(handleFailure);
                }
            }
        }
        
        if (deleteBtn) {
            const employeeId = deleteBtn.dataset.id;
            const employeeName = deleteBtn.dataset.name;
            
            if (confirm(`${employeeName} 근로자를 완전히 삭제하시겠습니까?\n⚠️ 이 작업은 되돌릴 수 없습니다.`)) {
                employeeModal.style.display = 'none';
                showLoader();
                
                api.call(`employees/${employeeId}`, 'DELETE').then(() => {
                    showToast('근로자가 삭제되었습니다.');
                    loadAllData();
                }).catch(handleFailure);
            }
        }
    });

    $('#employee-details-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        if (submitBtn.disabled) return;
        
        const employeeId = e.target.dataset.id;
        const updateData = { 근로자ID: employeeId };
        
        submitBtn.disabled = true;
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '저장 중...';
        submitBtn.style.opacity = '0.6';
        
        e.target.querySelectorAll('input[type="text"]:not(.amount-input)').forEach(textInput => {
            if (textInput.name) {
                updateData[textInput.name] = textInput.value.trim();
            }
        });
        
        e.target.querySelectorAll('.amount-input').forEach(amountInput => {
            if (amountInput.name) {
                const rawValue = amountInput.dataset.rawValue || amountInput.value.replace(/[^0-9]/g, '');
                if (rawValue) {
                    updateData[amountInput.name] = parseFloat(rawValue);
                } else {
                    updateData[amountInput.name] = '';
                }
            }
        });
        
        e.target.querySelectorAll('input[type="date"]').forEach(dateInput => {
            if (dateInput.name) {
                const dateValue = dateInput.value ? dateInput.value.trim() : '';
                if (dateValue && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    updateData[dateInput.name] = dateValue;
                } else {
                    updateData[dateInput.name] = '';
                }
            }
        });
        
        e.target.querySelectorAll('input[type="number"]').forEach(numberInput => {
            if (numberInput.name) {
                const numValue = numberInput.value.trim();
                updateData[numberInput.name] = numValue ? parseFloat(numValue) : '';
            }
        });
        
        e.target.querySelectorAll('select').forEach(selectInput => {
            if (selectInput.name) {
                updateData[selectInput.name] = selectInput.value;
            }
        });
        
        e.target.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            if (checkbox.name) {
                updateData[checkbox.name] = checkbox.checked;
            }
        });
        
        const employeeIndex = state.allEmployees.findIndex(emp => emp.근로자ID === employeeId);
        if (employeeIndex !== -1) {
            for (const key in updateData) {
                if (key !== '근로자ID') {
                    state.allEmployees[employeeIndex][key] = updateData[key];
                }
            }
            
            if (state.selectedCompanyId) {
                state.employees = state.allEmployees.filter(emp => emp.기업ID === state.selectedCompanyId);
            }
        }
        
        employeeModal.style.display = 'none';
        render();
        showToast('💾 저장 중...');
        
        try {
            await api.call(`employees/${employeeId}`, 'PUT', updateData);
            showToast('✅ 저장되었습니다.');
            await loadAllData();
        } catch (error) {
            showToast('❌ 저장 실패: ' + error.message, true);
            await loadAllData();
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            submitBtn.style.opacity = '1';
        }
    });

    window.onclick = (e) => {
        if (e.target === employeeModal) employeeModal.style.display = 'none';
        if (e.target === formModal) formModal.style.display = 'none';
    };

    // 비밀번호 변경 버튼
    const changePasswordBtn = document.getElementById('change-password-btn');
    const passwordModal = document.getElementById('password-modal');
    const passwordForm = document.getElementById('password-change-form');
    
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', () => {
            passwordModal.style.display = 'flex';
            document.getElementById('current-password').value = '';
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-password').value = '';
        });
    }
    
    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            
            if (newPassword !== confirmPassword) {
                showToast('❌ 새 비밀번호가 일치하지 않습니다.', true);
                return;
            }
            
            if (newPassword.length < 8) {
                showToast('❌ 새 비밀번호는 8자 이상이어야 합니다.', true);
                return;
            }
            
            try {
                showLoader();
                const response = await fetch('/api/auth/change-password', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({ currentPassword, newPassword })
                });
                
                const result = await response.json();
                
                hideLoader();
                
                if (result.success) {
                    passwordModal.style.display = 'none';
                    
                    // 해시값을 클립보드에 복사 시도
                    if (result.newHash && navigator.clipboard) {
                        try {
                            await navigator.clipboard.writeText(result.newHash);
                            showToast('✅ ' + result.message + '\n📋 새 해시값이 클립보드에 복사되었습니다!');
                        } catch (e) {
                            showToast('✅ ' + result.message + '\n⚠️ 콘솔 로그를 확인하세요.');
                        }
                    } else {
                        showToast('✅ ' + result.message);
                    }
                    
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('새 비밀번호 해시값:');
                    console.log(result.newHash);
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                } else {
                    showToast('❌ ' + result.error, true);
                }
            } catch (error) {
                hideLoader();
                console.error('비밀번호 변경 오류:', error);
                showToast('❌ 비밀번호 변경 중 오류가 발생했습니다.', true);
            }
        });
    }
    
    // 로그아웃 버튼
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (confirm('로그아웃하시겠습니까?')) {
                try {
                    const response = await fetch('/api/auth/logout', {
                        method: 'POST',
                        credentials: 'include'
                    });
                    
                    const result = await response.json();
                    
                    if (result.success) {
                        showToast('✅ 로그아웃되었습니다.');
                        setTimeout(() => {
                            window.location.href = '/login.html';
                        }, 500);
                    }
                } catch (error) {
                    console.error('로그아웃 오류:', error);
                    showToast('❌ 로그아웃 중 오류가 발생했습니다.', true);
                }
            }
        });
    }

    // ===============================================================
    // 앱 초기화
    // ===============================================================
    loadAllData();
});

