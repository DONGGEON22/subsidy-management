# 🔐 보안 설정 가이드

## 📋 목차
1. [긴급 보안 패치 적용](#긴급-보안-패치-적용)
2. [환경변수 설정](#환경변수-설정)
3. [Git 히스토리 정리](#git-히스토리-정리)
4. [Vercel 배포 설정](#vercel-배포-설정)
5. [보안 체크리스트](#보안-체크리스트)

---

## 🚨 긴급 보안 패치 적용

### 적용된 보안 개선사항

✅ **1. 민감 정보 하드코딩 제거**
- Supabase URL/Key를 환경변수로 이동
- JWT Secret을 환경변수로 이동
- 필수 환경변수 검증 로직 추가

✅ **2. CORS 정책 강화**
- 모든 도메인 허용 → 특정 도메인만 허용
- CORS 차단 로깅 추가

✅ **3. 비밀번호 해시 응답 제거**
- HTTP 응답에서 해시값 제거
- .env 파일 자동 업데이트 기능 추가
- 서버 로그에만 해시값 출력

---

## ⚙️ 환경변수 설정

### 방법 1: 자동 설정 스크립트 (권장)

```bash
# 1. 환경변수 파일 자동 생성
node setup-env.js

# 2. 서버 실행
npm start
```

### 방법 2: 수동 설정

```bash
# 1. .env 파일 생성
touch .env

# 2. 다음 내용을 .env 파일에 추가
```

```env
# Supabase 연결 정보
SUPABASE_URL=https://knkffxwcsrkxjneffyzh.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtua2ZmeHdjc3JreGpuZWZmeXpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MzM1MjcsImV4cCI6MjA4NTAwOTUyN30.qNn5K02eo7dT_ToFEOS8oGKloKzSrCtxJsDM-2U_cVU

# JWT 시크릿 키 (강력한 랜덤 문자열로 변경)
# 생성: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-strong-random-secret-here

# 관리자 계정
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=$2b$10$LjtsxnUJpQ/G8FoHPaxTB.c5UmkJ5E8NrcH7BMOzV0yb/5oYkOF12

# 서버 설정
PORT=3001
NODE_ENV=production

# CORS 허용 도메인 (쉼표로 구분)
ALLOWED_ORIGINS=https://subsidy-management-qtjo.vercel.app,http://localhost:3001
```

### ⚠️ 중요 사항

1. **.env 파일을 절대 Git에 커밋하지 마세요!**
   - 이미 `.gitignore`에 포함되어 있습니다.
   - 확인: `cat .gitignore | grep .env`

2. **JWT_SECRET 변경**
   ```bash
   # 강력한 랜덤 키 생성
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **기본 비밀번호 즉시 변경**
   - 기본: `admin` / `admin1234`
   - 로그인 후 🔑 버튼 클릭하여 변경

---

## 🧹 Git 히스토리 정리

### ⚠️ 이미 Git에 커밋된 민감정보 제거

```bash
# 1. 백업 생성 (권장)
git clone <repository-url> backup-repo
cd <original-repo>

# 2. 민감정보가 포함된 파일의 히스토리 제거
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch server.js" \
  --prune-empty --tag-name-filter cat -- --all

# 3. 강제 푸시 (협업자와 사전 협의 필수!)
git push origin --force --all
git push origin --force --tags

# 4. 로컬 캐시 정리
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive
```

### 🔄 더 안전한 방법: BFG Repo-Cleaner

```bash
# 1. BFG 다운로드
# https://rtyley.github.io/bfg-repo-cleaner/

# 2. 민감정보가 포함된 문자열 제거
java -jar bfg.jar --replace-text passwords.txt

# 3. Git 정리
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

### 🔑 Supabase 키 재발급 (권장)

민감정보가 이미 노출되었을 가능성이 있으므로:

1. **Supabase Dashboard 접속**
   - https://supabase.com/dashboard

2. **프로젝트 선택**
   - 해당 프로젝트 클릭

3. **Settings > API**
   - "Project API keys" 섹션
   - "Reset" 버튼 클릭하여 키 재발급

4. **새 키를 .env에 업데이트**
   ```env
   SUPABASE_ANON_KEY=새로_발급받은_키
   ```

---

## 🚀 Vercel 배포 설정

### 환경변수 설정

1. **Vercel Dashboard 접속**
   - https://vercel.com/dashboard

2. **프로젝트 선택**
   - subsidy-management 프로젝트 클릭

3. **Settings > Environment Variables**
   - 다음 환경변수 추가:

| Key | Value | Environment |
|-----|-------|-------------|
| `SUPABASE_URL` | `https://knkffxwcsrkxjneffyzh.supabase.co` | Production, Preview, Development |
| `SUPABASE_ANON_KEY` | `eyJhbGci...` | Production, Preview, Development |
| `JWT_SECRET` | `강력한_랜덤_문자열` | Production, Preview, Development |
| `ADMIN_USERNAME` | `admin` | Production, Preview, Development |
| `ADMIN_PASSWORD_HASH` | `$2b$10$...` | Production, Preview, Development |
| `NODE_ENV` | `production` | Production |
| `ALLOWED_ORIGINS` | `https://subsidy-management-qtjo.vercel.app` | Production |

4. **재배포**
   ```bash
   git add .
   git commit -m "Security: Apply security patches"
   git push
   ```

### CORS 도메인 업데이트

Vercel에서 커스텀 도메인을 사용하는 경우:

```env
# .env (Vercel 환경변수)
ALLOWED_ORIGINS=https://your-custom-domain.com,https://subsidy-management-qtjo.vercel.app
```

---

## ✅ 보안 체크리스트

### 즉시 조치 (완료 후 체크)

- [ ] `.env` 파일 생성 완료
- [ ] `.env` 파일이 `.gitignore`에 포함되어 있는지 확인
- [ ] 서버가 환경변수를 정상적으로 로드하는지 확인
- [ ] 기본 관리자 비밀번호 변경
- [ ] JWT_SECRET을 강력한 랜덤 문자열로 변경
- [ ] Vercel 환경변수 설정 완료
- [ ] Git 히스토리에서 민감정보 제거
- [ ] Supabase 키 재발급 (선택사항, 권장)

### 단기 조치 (1주 이내)

- [ ] 레이트 리미팅 적용
  ```bash
  npm install express-rate-limit
  ```
- [ ] 보안 헤더 적용
  ```bash
  npm install helmet
  ```
- [ ] 쿠키 설정 강화 (sameSite: 'strict')
- [ ] XSS 방어 (입력 검증 추가)
  ```bash
  npm install dompurify express-validator
  ```

### 중기 조치 (1개월 이내)

- [ ] Access Token + Refresh Token 구조 도입
- [ ] 로깅 시스템 구축
  ```bash
  npm install winston
  ```
- [ ] 비밀번호 정책 강화 (복잡도 요구사항)
- [ ] 에러 처리 개선 (정보 노출 방지)

### 장기 조치 (3개월 이내)

- [ ] 다중 인증(MFA) 도입
  ```bash
  npm install speakeasy qrcode
  ```
- [ ] 데이터 암호화 (민감 정보)
- [ ] 모니터링 및 알림 시스템
  ```bash
  npm install @sentry/node
  ```
- [ ] 정기 보안 감사 계획 수립

---

## 🆘 문제 해결

### Q1: 서버가 시작되지 않습니다.

```
❌ 필수 환경변수가 설정되지 않았습니다!
```

**해결방법:**
1. `.env` 파일이 존재하는지 확인
2. `.env` 파일에 필수 환경변수가 모두 있는지 확인
3. `node setup-env.js` 실행

### Q2: CORS 오류가 발생합니다.

```
Access to fetch at '...' has been blocked by CORS policy
```

**해결방법:**
1. `.env` 파일의 `ALLOWED_ORIGINS`에 프론트엔드 도메인 추가
   ```env
   ALLOWED_ORIGINS=https://your-domain.com,http://localhost:3001
   ```
2. 서버 재시작

### Q3: 로그인이 되지 않습니다.

**확인사항:**
1. `.env`의 `ADMIN_PASSWORD_HASH`가 올바른지 확인
2. 기본 비밀번호: `admin1234`
3. 비밀번호 재설정:
   ```bash
   node generate-default-password.js
   ```

### Q4: Vercel 배포 후 500 오류

**확인사항:**
1. Vercel 환경변수가 모두 설정되었는지 확인
2. Vercel 로그 확인:
   ```bash
   vercel logs <deployment-url>
   ```
3. `ALLOWED_ORIGINS`에 Vercel 도메인 포함 여부 확인

---

## 📚 추가 자료

- **보안 검사 보고서**: `보안검사_보고서.md`
- **OWASP Top 10**: https://owasp.org/www-project-top-ten/
- **Node.js 보안 가이드**: https://nodejs.org/en/docs/guides/security/
- **Supabase 보안 문서**: https://supabase.com/docs/guides/platform/security

---

## 📞 지원

보안 관련 문의사항이 있으시면 GitHub Issues 또는 이메일로 연락주세요.

**작성일**: 2026-01-29  
**버전**: 1.0

