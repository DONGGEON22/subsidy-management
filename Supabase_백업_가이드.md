# 📦 Supabase 백업 전략 가이드

## 🤔 Supabase를 쓰는데 백업이 필요한가?

### Supabase가 제공하는 백업

#### ✅ Supabase의 기본 백업 기능

| 플랜 | 일일 백업 | 보관 기간 | PITR* | 비용 |
|------|----------|----------|-------|------|
| **Free** | ❌ 없음 | - | ❌ | $0 |
| **Pro** | ✅ 자동 | 7일 | ✅ 7일 | $25/월 |
| **Team** | ✅ 자동 | 14일 | ✅ 14일 | $599/월 |
| **Enterprise** | ✅ 자동 | 맞춤 | ✅ 맞춤 | 협의 |

\* PITR = Point-in-Time Recovery (특정 시점으로 복구)

#### 현재 플랜 확인하기
```
Supabase Dashboard → Settings → Billing
```

---

## 📊 백업 필요성 판단

### ✅ 추가 백업이 **필요한 경우**

#### 1. Free 플랜 사용 중
```
⚠️ 위험도: 높음
- Supabase 백업 없음
- 실수로 데이터 삭제 시 복구 불가능
- 서비스 장애 시 데이터 손실 가능
```

**권장**: 매일 자동 백업 필수!

#### 2. 중요한 비즈니스 데이터
```
⚠️ 위험도: 높음
- 고객 정보
- 금융 거래 기록
- 계약/법적 문서
```

**권장**: 최소 주 1회 + 중요 변경 시 수동 백업

#### 3. 규정 준수 필요
```
📜 법적 요구사항:
- 개인정보보호법: 3년 보관
- 근로기준법: 3년 보관
- 상법: 10년 보관 (중요 서류)
```

**권장**: 법정 보관 기간에 맞춰 백업 + 별도 저장

#### 4. 데이터 이전 계획
```
🔄 마이그레이션 시나리오:
- 다른 DB로 이전 계획
- 로컬 개발 환경 구축
- 데이터 분석 필요
```

**권장**: 정기적인 백업으로 이전 준비

---

### ⚠️ 추가 백업이 **선택사항인 경우**

#### 1. Pro 플랜 이상 + 테스트/개발 환경
```
✅ 안전도: 보통
- Supabase 자동 백업 있음
- 7-14일 복구 가능
- 데이터 손실 시 영향 적음
```

**선택**: 월 1회 백업으로 충분

#### 2. 데이터가 자주 변경되지 않음
```
✅ 안전도: 보통
- 변경 빈도 낮음
- 복구 시 손실 데이터 적음
```

**선택**: 중요 변경 시에만 수동 백업

---

## 🎯 현실적인 백업 전략 (추천)

### 📌 현재 상황: Free 플랜 사용 중

당신의 시스템은 **일자리도약장려금 관리 시스템**으로:
- ✅ 중요한 비즈니스 데이터 (근로자 정보, 지원금 기록)
- ✅ 법적 보관 의무 (근로기준법 3년)
- ✅ Free 플랜 (백업 없음)

**결론**: **백업 강력 권장! ⚠️**

---

## 🛡️ 권장 백업 전략

### 방법 1: 가벼운 백업 (권장 ⭐⭐⭐⭐⭐)

**장점**:
- 구현 간단 (10분 소요)
- 서버 부하 최소
- 무료

**단점**:
- 서버가 꺼지면 백업 안 됨
- Vercel 무료 플랜은 스케줄러 제한

```javascript
// server.js에 추가
const cron = require('node-cron');
const fs = require('fs');

// 매주 일요일 새벽 3시 백업
cron.schedule('0 3 * * 0', async () => {
    console.log('📦 주간 백업 시작...');
    
    try {
        const tables = ['companies', 'employees', 'company_to', 'employee_memos'];
        const backupData = {
            timestamp: new Date().toISOString(),
            version: '1.0',
            data: {}
        };
        
        for (const table of tables) {
            const { data, error } = await supabase
                .from(table)
                .select('*');
            
            if (error) throw error;
            backupData.data[table] = data;
        }
        
        // 백업 파일 저장
        const date = new Date().toISOString().split('T')[0];
        const filename = `backup-${date}.json`;
        
        if (!fs.existsSync('./backups')) {
            fs.mkdirSync('./backups');
        }
        
        fs.writeFileSync(
            `./backups/${filename}`, 
            JSON.stringify(backupData, null, 2)
        );
        
        console.log(`✅ 백업 완료: ${filename}`);
        
        // 30일 이상 된 백업 삭제
        cleanOldBackups(30);
    } catch (error) {
        console.error('❌ 백업 실패:', error);
    }
});

function cleanOldBackups(days) {
    const backupDir = './backups';
    if (!fs.existsSync(backupDir)) return;
    
    const files = fs.readdirSync(backupDir);
    const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    files.forEach(file => {
        const filePath = `${backupDir}/${file}`;
        const stats = fs.statSync(filePath);
        
        if (stats.mtimeMs < cutoff) {
            fs.unlinkSync(filePath);
            console.log(`🗑️ 오래된 백업 삭제: ${file}`);
        }
    });
}
```

**설치**:
```bash
npm install node-cron
mkdir backups
echo "backups/" >> .gitignore
```

---

### 방법 2: 수동 백업 스크립트 (초간단 ⭐⭐⭐⭐⭐)

매주 또는 매월 한 번씩 직접 실행

```javascript
// backup.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function backup() {
    console.log('📦 백업 시작...');
    
    const tables = ['companies', 'employees', 'company_to', 'employee_memos'];
    const backupData = {
        timestamp: new Date().toISOString(),
        data: {}
    };
    
    for (const table of tables) {
        console.log(`  - ${table} 백업 중...`);
        const { data } = await supabase.from(table).select('*');
        backupData.data[table] = data;
    }
    
    const filename = `backup-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(filename, JSON.stringify(backupData, null, 2));
    
    console.log(`✅ 백업 완료: ${filename}`);
    console.log(`📊 데이터:`);
    console.log(`  - 기업: ${backupData.data.companies?.length || 0}개`);
    console.log(`  - 근로자: ${backupData.data.employees?.length || 0}개`);
}

backup().catch(console.error);
```

**사용법**:
```bash
# 백업 실행
node backup.js

# 결과: backup-2026-01-29.json 생성
```

**장점**:
- 아주 간단
- 언제든 실행 가능
- 서버 불필요

**단점**:
- 수동으로 실행해야 함
- 잊어버릴 수 있음

---

### 방법 3: Supabase Dashboard 수동 백업

#### 가장 간단한 방법!

1. **Supabase Dashboard 접속**
   ```
   https://supabase.com/dashboard
   ```

2. **Database > Backups**
   - (Pro 플랜 이상만 가능)

3. **또는 SQL Editor에서**
   ```sql
   -- 전체 데이터 조회 후 CSV로 다운로드
   SELECT * FROM companies;
   SELECT * FROM employees;
   SELECT * FROM company_to;
   SELECT * FROM employee_memos;
   ```
   
4. **결과를 CSV로 Export**
   - 각 테이블별로 다운로드
   - Excel에서 열기 가능

---

### 방법 4: GitHub Actions 자동 백업 (고급 ⭐⭐⭐)

서버 없이도 자동 백업 가능!

```yaml
# .github/workflows/backup.yml
name: Database Backup

on:
  schedule:
    - cron: '0 3 * * 0'  # 매주 일요일 새벽 3시 (UTC)
  workflow_dispatch:  # 수동 실행 가능

jobs:
  backup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          npm install @supabase/supabase-js
      
      - name: Run backup
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        run: node backup.js
      
      - name: Upload backup
        uses: actions/upload-artifact@v3
        with:
          name: backup-${{ github.run_number }}
          path: backup-*.json
          retention-days: 90  # 90일 보관
```

**장점**:
- 완전 자동화
- 서버 불필요
- GitHub에 백업 저장
- 무료 (GitHub Actions 무료 사용량 내)

**단점**:
- GitHub Secrets 설정 필요
- 약간 복잡

---

## 💾 백업 복원 방법

### 백업 파일에서 복원

```javascript
// restore.js
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

async function restore(filename) {
    console.log('🔄 복원 시작...');
    
    const backupData = JSON.parse(fs.readFileSync(filename, 'utf8'));
    
    for (const [table, data] of Object.entries(backupData.data)) {
        console.log(`  - ${table} 복원 중... (${data.length}건)`);
        
        // 기존 데이터 삭제 (주의!)
        // await supabase.from(table).delete().neq('id', 0);
        
        // 데이터 삽입
        const { error } = await supabase.from(table).insert(data);
        
        if (error) {
            console.error(`❌ ${table} 복원 실패:`, error);
        } else {
            console.log(`✅ ${table} 복원 완료`);
        }
    }
    
    console.log('🎉 복원 완료!');
}

// 사용법: node restore.js backup-2026-01-29.json
const filename = process.argv[2];
if (!filename) {
    console.error('사용법: node restore.js <backup-file.json>');
    process.exit(1);
}

restore(filename).catch(console.error);
```

---

## 🎯 최종 권장사항

### 당신의 경우 (일자리도약장려금 시스템)

#### ✅ 최소한 구현하세요:

1. **수동 백업 스크립트** (5분 소요)
   ```bash
   # backup.js 생성
   # 매주 월요일 오전에 실행
   node backup.js
   ```

2. **중요 변경 전 백업**
   - 대량 데이터 수정 전
   - 시스템 업데이트 전
   - 새 기능 배포 전

3. **월 1회 백업 확인**
   - 백업 파일 존재 확인
   - 복원 테스트 (개발 환경에서)

#### 🌟 여유 있으면 추가:

4. **GitHub Actions 자동 백업** (30분 소요)
   - 완전 자동화
   - 잊어버릴 걱정 없음

5. **Google Drive/Dropbox 연동**
   - 백업 파일 클라우드 저장
   - 다중 백업

---

## 💰 비용 vs 효과

| 방법 | 구현 시간 | 비용 | 안전성 | 추천도 |
|------|----------|------|--------|--------|
| 수동 백업 스크립트 | 5분 | 무료 | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| 서버 cron 자동 백업 | 10분 | 무료 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| GitHub Actions | 30분 | 무료 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Supabase Pro 플랜 | 0분 | $25/월 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 🚨 주의사항

### ⚠️ 백업 시 고려사항

1. **민감 정보 암호화**
   ```javascript
   // 백업 파일에 비밀번호 해시 등 포함됨
   // Git에 절대 올리지 말 것!
   ```

2. **용량 관리**
   ```javascript
   // 데이터가 많으면 백업 파일 크기 증가
   // 압축 고려: gzip 사용
   ```

3. **보관 장소**
   ```
   ❌ Git 저장소에 커밋
   ✅ 로컬 또는 별도 클라우드 저장소
   ```

4. **정기적인 복원 테스트**
   ```
   백업이 있어도 복원이 안 되면 무용지물!
   분기별로 복원 테스트 권장
   ```

---

## ✅ 결론

### 당신의 경우:

**백업 필요도**: ⭐⭐⭐⭐⭐ (5/5) - **강력 권장!**

**이유**:
- ✅ Free 플랜 (Supabase 백업 없음)
- ✅ 중요 비즈니스 데이터
- ✅ 법적 보관 의무
- ✅ 실수로 인한 데이터 손실 위험

**추천 방법**:
1. **지금 당장**: 수동 백업 스크립트 만들기 (5분)
2. **이번 주**: 매주 월요일 백업 습관화
3. **여유 있으면**: GitHub Actions 자동 백업 (30분)

---

## 🚀 시작하기

백업 스크립트를 만들어드릴까요?
1. ✅ 수동 백업 스크립트 (backup.js)
2. ✅ 복원 스크립트 (restore.js)
3. ✅ GitHub Actions 설정

원하시는 것을 말씀해주세요!

---

**작성일**: 2026-01-29  
**버전**: 1.0

