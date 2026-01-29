# 📦 데이터 백업 사용법

## 🚀 빠른 시작

### 1. 백업 실행 (지금 당장!)

```bash
# 백업 실행
node backup.js

# 결과: backups/backup-2026-01-29.json 생성
```

### 2. 매주 백업 습관화

**추천 스케줄**: 매주 월요일 오전

```bash
# 캘린더에 반복 일정 추가
월요일 오전 10시: "node backup.js 실행"
```

### 3. 복원 (문제 발생 시)

```bash
# 백업 파일 목록 확인
ls backups/

# 복원 실행
node restore.js backups/backup-2026-01-29.json

# 확인 프롬프트에서 'yes' 입력
```

---

## 📋 백업 파일 관리

### 자동 정리

- ✅ 30일 이상 된 백업은 자동 삭제
- ✅ 디스크 공간 절약

### 백업 보관

```bash
# 중요한 백업은 별도 보관
# 1. 외장 하드
# 2. Google Drive
# 3. Dropbox
# 4. USB

# 예시: 외부로 복사
cp backups/backup-2026-01-29.json ~/Desktop/
```

---

## ⚠️ 주의사항

### 🔒 보안

```bash
# ❌ 절대 하지 말 것
git add backups/                # Git에 커밋 금지!
git commit -m "Add backup"      # 민감 정보 노출!

# ✅ .gitignore에 이미 추가됨
backups/
backup-*.json
```

### 📝 백업 전 체크리스트

- [ ] 중요 작업 전 백업 실행
- [ ] 백업 파일 생성 확인
- [ ] 파일 크기 정상 확인 (최소 1KB 이상)
- [ ] 안전한 장소에 복사

### 🔄 복원 시 주의

- ⚠️ 기존 데이터를 덮어씁니다!
- ⚠️ 테스트 환경에서 먼저 시도하세요!
- ⚠️ 복원 전 현재 데이터 백업하세요!

---

## 💡 유용한 팁

### 1. 백업 파일 확인

```bash
# 백업 파일 내용 미리보기 (Windows)
type backups\backup-2026-01-29.json | more

# 백업 파일 크기 확인
dir backups
```

### 2. 자동 백업 (고급)

**Windows 작업 스케줄러**:
```
1. 작업 스케줄러 실행
2. "기본 작업 만들기"
3. 트리거: 매주 월요일 오전 10시
4. 동작: 프로그램 시작
   - 프로그램: node
   - 인수: backup.js
   - 시작 위치: C:\Users\...\new
```

### 3. 백업 알림

**backup.js 끝에 추가**:
```javascript
// Windows 알림
const { exec } = require('child_process');
exec(`msg * "백업 완료: ${filename}"`);
```

---

## 🆘 문제 해결

### Q: "Cannot find module '@supabase/supabase-js'" 에러

```bash
npm install
```

### Q: 백업 파일이 너무 큽니다

```javascript
// backup.js 수정: 30일 → 7일로 변경
cleanOldBackups(backupDir, 7);  // 7일만 보관
```

### Q: 특정 테이블만 백업하고 싶어요

```javascript
// backup.js 수정
const tables = ['employees'];  // 원하는 테이블만
```

### Q: 복원 시 확인 없이 실행하고 싶어요

```bash
# restore.js 수정: question 부분 제거
# 또는 자동 yes 입력
echo yes | node restore.js backups/backup-2026-01-29.json
```

---

## 📊 백업 현황 확인

### 백업 파일 목록

```bash
# Windows
dir backups

# 결과 예시:
# backup-2026-01-22.json  (1.2 MB)
# backup-2026-01-29.json  (1.3 MB)
```

### 총 백업 크기

```bash
# Windows PowerShell
(Get-ChildItem backups | Measure-Object -Property Length -Sum).Sum / 1MB
```

---

## 🎯 백업 베스트 프랙티스

### 1. 3-2-1 백업 원칙

- **3**: 데이터 사본 3개
- **2**: 2가지 다른 저장 매체
- **1**: 1개는 오프사이트 보관

```
✅ 원본 (Supabase)
✅ 로컬 백업 (backups/)
✅ 외부 백업 (외장 하드 또는 클라우드)
```

### 2. 정기적인 복원 테스트

```bash
# 분기별 1회 권장
# 1. 테스트 Supabase 프로젝트 생성
# 2. .env 수정 (테스트 URL로)
# 3. 복원 실행
node restore.js backups/backup-2026-01-29.json
# 4. 데이터 확인
```

### 3. 중요 시점 백업

```bash
# 다음 시점에 반드시 백업:
- 대량 데이터 수정 전
- 시스템 업데이트 전
- 새 기능 배포 전
- 연말 결산 전
```

---

## 📅 백업 스케줄 예시

| 주기 | 보관 기간 | 용도 |
|------|----------|------|
| 매주 | 30일 | 일반 복구 |
| 매월 | 1년 | 월별 스냅샷 |
| 매년 | 영구 | 법적 보관 |

---

## ✅ 체크리스트

### 최초 설정 (한 번만)
- [x] backup.js 생성
- [x] restore.js 생성
- [x] .gitignore에 backups/ 추가
- [ ] 첫 백업 실행 (`node backup.js`)
- [ ] 백업 파일 확인
- [ ] 외부 저장소 준비 (외장 하드, 클라우드 등)

### 정기 작업 (매주)
- [ ] 백업 실행
- [ ] 백업 파일 확인
- [ ] 중요 백업 외부 복사

### 분기 작업 (3개월마다)
- [ ] 복원 테스트
- [ ] 백업 파일 정리
- [ ] 보관 정책 검토

---

**작성일**: 2026-01-29  
**다음 백업 예정**: 매주 월요일  
**상태**: ✅ 준비 완료

