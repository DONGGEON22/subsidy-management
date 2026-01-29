#!/usr/bin/env node

/**
 * 🔄 Supabase 데이터 복원 스크립트
 * 
 * 사용법:
 *   node restore.js backups/backup-2026-01-29.json
 * 
 * ⚠️ 주의:
 *   - 기존 데이터를 덮어쓸 수 있습니다!
 *   - 운영 환경에서는 신중하게 사용하세요!
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const readline = require('readline');

// Supabase 연결
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

async function restore(filename) {
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║                                                           ║');
    console.log('║         🔄 Supabase 데이터 복원 시작                      ║');
    console.log('║                                                           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    
    // 파일 존재 확인
    if (!fs.existsSync(filename)) {
        console.error(`❌ 파일을 찾을 수 없습니다: ${filename}`);
        process.exit(1);
    }
    
    // 백업 파일 읽기
    console.log(`📄 백업 파일 읽는 중: ${filename}\n`);
    const backupData = JSON.parse(fs.readFileSync(filename, 'utf8'));
    
    console.log('백업 정보:');
    console.log(`  - 백업 시각: ${backupData.timestamp}`);
    console.log(`  - 버전: ${backupData.version}`);
    console.log(`  - 기업: ${backupData.data.companies?.length || 0}개`);
    console.log(`  - 근로자: ${backupData.data.employees?.length || 0}개`);
    console.log(`  - TO 정보: ${backupData.data.company_to?.length || 0}개`);
    console.log(`  - 메모: ${backupData.data.employee_memos?.length || 0}개\n`);
    
    // 확인 프롬프트
    console.log('⚠️  경고: 이 작업은 기존 데이터를 변경합니다!');
    const answer = await question('계속하시겠습니까? (yes/no): ');
    
    if (answer.toLowerCase() !== 'yes') {
        console.log('\n❌ 복원 취소됨');
        rl.close();
        process.exit(0);
    }
    
    console.log('\n🔄 복원 시작...\n');
    
    const tables = ['companies', 'employees', 'company_to', 'employee_memos'];
    let totalRestored = 0;
    
    for (const table of tables) {
        const data = backupData.data[table];
        
        if (!data || data.length === 0) {
            console.log(`⏭️  ${table}: 복원할 데이터 없음`);
            continue;
        }
        
        try {
            console.log(`📋 ${table} 복원 중... (${data.length}건)`);
            
            // 데이터 삽입 (upsert 사용)
            const { error } = await supabase
                .from(table)
                .upsert(data, { onConflict: 'id' });
            
            if (error) {
                console.error(`❌ ${table} 복원 실패:`, error.message);
                throw error;
            }
            
            totalRestored += data.length;
            console.log(`   ✅ ${data.length}건 복원 완료\n`);
        } catch (error) {
            console.error(`❌ ${table} 복원 중 오류:`, error);
            throw error;
        }
    }
    
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                    복원 완료!                             ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    console.log(`📊 총 ${totalRestored}건의 레코드 복원 완료\n`);
    
    rl.close();
}

// 실행
const filename = process.argv[2];

if (!filename) {
    console.error('\n사용법: node restore.js <backup-file.json>');
    console.error('\n예시:');
    console.error('  node restore.js backups/backup-2026-01-29.json\n');
    process.exit(1);
}

restore(filename)
    .then(() => {
        console.log('✅ 복원 프로세스 완료!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ 복원 실패:', error.message);
        rl.close();
        process.exit(1);
    });

