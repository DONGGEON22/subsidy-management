// 빠른 API 테스트
const http = require('http');

const baseUrl = 'http://localhost:3001';

function testAPI(path, description) {
    return new Promise((resolve, reject) => {
        http.get(baseUrl + path, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log(`✅ ${description}: 성공 (${res.statusCode})`);
                    try {
                        const json = JSON.parse(data);
                        resolve({ success: true, data: json, description });
                    } catch (e) {
                        resolve({ success: true, data: null, description });
                    }
                } else {
                    console.log(`🔴 ${description}: 실패 (${res.statusCode})`);
                    resolve({ success: false, status: res.statusCode, description });
                }
            });
        }).on('error', (err) => {
            console.log(`🔴 ${description}: 오류 - ${err.message}`);
            reject(err);
        });
    });
}

async function runTests() {
    console.log('='.repeat(70));
    console.log('🧪 API 종합 테스트 시작');
    console.log('='.repeat(70));
    console.log('');

    const tests = [
        { path: '/', desc: '메인 페이지' },
        { path: '/api/companies', desc: '기업 목록 조회' },
        { path: '/api/dashboard', desc: '대시보드 데이터' },
        { path: '/api/commission', desc: '수수료 정산 데이터' }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
        try {
            const result = await testAPI(test.path, test.desc);
            if (result.success) {
                passed++;
                
                // 데이터 상세 정보
                if (test.path === '/api/companies' && result.data?.data) {
                    console.log(`   └─ 등록된 기업: ${result.data.data.length}개`);
                }
                if (test.path === '/api/dashboard' && result.data?.data) {
                    console.log(`   └─ 신청 예정: ${result.data.data.upcoming?.length || 0}건`);
                    console.log(`   └─ 승인 대기: ${result.data.data.pending?.length || 0}건`);
                }
                if (test.path === '/api/commission' && result.data?.data) {
                    const months = Object.keys(result.data.data);
                    console.log(`   └─ 정산 데이터: ${months.length}개월`);
                    if (months.length > 0) {
                        const firstMonth = months[0];
                        const companies = Object.keys(result.data.data[firstMonth] || {});
                        console.log(`   └─ ${firstMonth}: ${companies.length}개 기업`);
                    }
                }
            } else {
                failed++;
            }
        } catch (err) {
            failed++;
        }
        console.log('');
    }

    console.log('='.repeat(70));
    console.log(`📊 테스트 결과: 통과 ${passed}/${tests.length} (${Math.round(passed/tests.length*100)}%)`);
    console.log('='.repeat(70));

    if (failed === 0) {
        console.log('🎉 모든 API 테스트 통과!');
    } else {
        console.log(`⚠️  ${failed}개 테스트 실패`);
    }
}

runTests().catch(console.error);

