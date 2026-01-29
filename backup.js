#!/usr/bin/env node

/**
 * 📦 Supabase 데이터 백업 스크립트
 * 
 * 사용법:
 *   node backup.js
 * 
 * 결과:
 *   backup-YYYY-MM-DD.json 파일 생성
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase 연결
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function backup() {
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║                                                           ║');
    console.log('║         📦 Supabase 데이터 백업 시작                      ║');
    console.log('║                                                           ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    
    const tables = ['companies', 'employees', 'company_to', 'employee_memos'];
    const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: {}
    };
    
    let totalRecords = 0;
    
    // 각 테이블 백업
    for (const table of tables) {
        try {
            console.log(`📋 ${table} 백업 중...`);
            const { data, error } = await supabase.from(table).select('*');
            
            if (error) {
                console.error(`❌ ${table} 백업 실패:`, error.message);
                throw error;
            }
            
            backupData.data[table] = data || [];
            totalRecords += data?.length || 0;
            console.log(`   ✅ ${data?.length || 0}건 백업 완료`);
        } catch (error) {
            console.error(`❌ ${table} 백업 중 오류:`, error);
            throw error;
        }
    }
    
    // 백업 디렉토리 생성
    const backupDir = path.join(__dirname, 'backups');
    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir);
        console.log(`\n📁 백업 디렉토리 생성: ${backupDir}`);
    }
    
    // 백업 파일 저장
    const date = new Date().toISOString().split('T')[0];
    const filename = `backup-${date}.json`;
    const filepath = path.join(backupDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(backupData, null, 2));
    
    // 파일 크기 계산
    const stats = fs.statSync(filepath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║                    백업 완료!                             ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    console.log(`📄 파일명: ${filename}`);
    console.log(`📂 경로: ${filepath}`);
    console.log(`💾 크기: ${fileSizeMB} MB`);
    console.log(`📊 총 레코드: ${totalRecords}건\n`);
    console.log('데이터 상세:');
    console.log(`  - 기업: ${backupData.data.companies?.length || 0}개`);
    console.log(`  - 근로자: ${backupData.data.employees?.length || 0}개`);
    console.log(`  - TO 정보: ${backupData.data.company_to?.length || 0}개`);
    console.log(`  - 메모: ${backupData.data.employee_memos?.length || 0}개`);
    console.log('\n⚠️  주의: 이 백업 파일을 안전한 곳에 보관하세요!');
    console.log('🔒 Git에 커밋하지 마세요! (민감 정보 포함)\n');
    
    // 오래된 백업 정리
    cleanOldBackups(backupDir, 30);
}

function cleanOldBackups(backupDir, days) {
    console.log(`🧹 ${days}일 이상 된 백업 파일 정리 중...\n`);
    
    const files = fs.readdirSync(backupDir);
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    let deletedCount = 0;
    
    files.forEach(file => {
        if (!file.startsWith('backup-') || !file.endsWith('.json')) return;
        
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtimeMs < cutoff) {
            fs.unlinkSync(filePath);
            console.log(`   🗑️  삭제: ${file}`);
            deletedCount++;
        }
    });
    
    if (deletedCount > 0) {
        console.log(`\n✅ ${deletedCount}개의 오래된 백업 파일 삭제 완료\n`);
    } else {
        console.log('✅ 정리할 오래된 백업 파일 없음\n');
    }
}

// 실행
backup()
    .then(() => {
        console.log('✅ 백업 프로세스 완료!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ 백업 실패:', error.message);
        process.exit(1);
    });

