# 🚀 Vercel 배포 가이드

## 📋 배포 전 체크리스트

- [x] `vercel.json` 생성 완료
- [x] `.vercelignore` 생성 완료
- [x] 관리자 비밀번호 해시값 설정 완료
- [ ] Vercel 계정 생성/로그인
- [ ] GitHub에 코드 푸시
- [ ] Vercel에서 프로젝트 연결

---

## 🔧 1단계: GitHub에 코드 업로드

### 1️⃣ Git 초기화 (아직 안 했다면)

```bash
git init
git add .
git commit -m "Initial commit - 일자리도약장려금 관리 시스템"
```

### 2️⃣ GitHub 리포지토리 생성

1. GitHub 접속 (https://github.com)
2. `New repository` 클릭
3. 리포지토리 이름 입력 (예: `subsidy-management`)
4. **Private** 선택 (민감한 정보 보호) ⚠️
5. Create repository 클릭

### 3️⃣ GitHub에 푸시

```bash
git remote add origin https://github.com/your-username/subsidy-management.git
git branch -M main
git push -u origin main
```

---

## 🌐 2단계: Vercel 배포

### 1️⃣ Vercel 접속

https://vercel.com 접속 후 GitHub 계정으로 로그인

### 2️⃣ 프로젝트 가져오기

1. **"Add New..."** → **"Project"** 클릭
2. GitHub 리포지토리에서 `subsidy-management` 선택
3. **Import** 클릭

### 3️⃣ 환경 변수 설정 ⚠️ 중요!

**Environment Variables** 섹션에서 다음을 추가:

| Key | Value |
|-----|-------|
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD_HASH` | `$2b$10$LjtsxnUJpQ/G8FoHPaxTB.c5UmkJ5E8NrcH7BMOzV0yb/5oYkOF12` |
| `SESSION_SECRET` | `subsidy-mgmt-secret-key-2026-secure-random-string` |
| `NODE_ENV` | `production` |

**설정 방법:**
1. Key 입력
2. Value 입력
3. **Add** 클릭
4. 모든 환경 변수 추가 완료 후 다음 단계

### 4️⃣ 배포 설정

- **Framework Preset**: `Other` (자동 감지됨)
- **Root Directory**: `./` (기본값)
- **Build Command**: 비워두기 (Express는 빌드 불필요)
- **Output Directory**: 비워두기

### 5️⃣ 배포 시작

**"Deploy"** 버튼 클릭! 🚀

배포 시간: 약 1-2분

---

## ✅ 3단계: 배포 확인

배포가 완료되면:

1. **"Visit"** 버튼을 클릭하여 사이트 접속
2. 자동으로 로그인 페이지로 이동
3. 로그인 테스트:
   - **아이디**: `admin`
   - **비밀번호**: `admin1234`

---

## 🔒 4단계: 비밀번호 변경 (필수!)

배포 후 **즉시** 비밀번호를 변경하세요:

1. 로그인 후 사이드바의 🔑 버튼 클릭
2. 현재 비밀번호: `admin1234`
3. 새 비밀번호 입력
4. 콘솔에 표시되는 **새 해시값** 복사
5. Vercel 대시보드로 이동:
   - **Settings** → **Environment Variables**
   - `ADMIN_PASSWORD_HASH` 수정
   - 새 해시값 입력 후 **Save**
6. **Deployments** 탭 → 최신 배포의 **...** → **Redeploy**

---

## 🌍 도메인 설정 (선택사항)

Vercel은 자동으로 `your-project.vercel.app` 도메인을 제공합니다.

### 커스텀 도메인 연결:

1. Vercel 프로젝트 → **Settings** → **Domains**
2. 도메인 입력 (예: `mycompany.com`)
3. DNS 설정 안내에 따라 네임서버 설정
4. 자동 HTTPS 인증서 발급 (무료)

---

## ⚠️ 중요 보안 사항

### 1. GitHub 리포지토리는 반드시 Private으로!

```
⚠️ Public 리포지토리는 절대 안 됩니다!
   - Supabase 키가 노출됩니다
   - 보안 위험이 매우 큽니다
```

### 2. 환경 변수로 민감 정보 관리

모든 민감한 정보는 Vercel 환경 변수에서 관리:
- ✅ 비밀번호 해시
- ✅ 세션 시크릿
- ✅ API 키 (Supabase 등)

### 3. HTTPS 강제 사용

Vercel은 기본적으로 HTTPS를 강제합니다. ✅

---

## 🔧 문제 해결

### Q: "503 Service Unavailable" 오류

**A:** 서버가 시작되지 않았습니다.
- Vercel 대시보드 → **Deployments** → 최신 배포의 **View Function Logs**
- 오류 메시지 확인

### Q: 로그인이 안 됩니다

**A:** 환경 변수 확인:
- `ADMIN_PASSWORD_HASH`가 올바르게 설정되었는지 확인
- Redeploy 후 다시 시도

### Q: 세션이 자주 만료됩니다

**A:** Vercel Serverless는 stateless입니다.
- 이는 정상적인 동작입니다
- 더 긴 세션이 필요하면 JWT 기반 인증으로 전환 권장

### Q: API 요청이 느립니다

**A:** Cold start 현상:
- 첫 요청은 느릴 수 있습니다 (5-10초)
- 이후 요청은 빠릅니다
- Pro 플랜으로 업그레이드하면 개선됩니다

---

## 📊 Vercel 무료 플랜 제한

- ✅ 대역폭: 100GB/월
- ✅ 실행 시간: 10초/요청
- ✅ 배포 횟수: 무제한
- ✅ HTTPS: 무료
- ✅ 서버리스 함수: 12개

일반적인 사용에는 무료 플랜으로 충분합니다! 👍

---

## 🎯 배포 완료 후 확인 사항

- [ ] 로그인 페이지 접속 확인
- [ ] 관리자 로그인 성공
- [ ] 기업 데이터 조회 확인
- [ ] 근로자 데이터 조회 확인
- [ ] 데이터 추가/수정 테스트
- [ ] 로그아웃 테스트
- [ ] 비밀번호 변경 완료
- [ ] 새 비밀번호로 재로그인 성공

---

## 🚀 배포 URL 예시

```
https://subsidy-management.vercel.app
또는
https://your-custom-domain.com
```

---

## 📝 추가 팁

### 자동 배포 설정

GitHub에 코드를 푸시하면 자동으로 Vercel에 배포됩니다!

```bash
# 코드 수정 후
git add .
git commit -m "Update: 기능 개선"
git push

# Vercel이 자동으로 감지하고 재배포! 🎉
```

### 배포 미리보기

PR(Pull Request)을 만들면 Vercel이 자동으로 미리보기 환경을 생성합니다!

---

## 🎉 완료!

이제 전 세계 어디서나 접속 가능한 웹 애플리케이션이 완성되었습니다! 🌍

**배포 완료 체크리스트:**
- ✅ Vercel 배포 성공
- ✅ 로그인 작동 확인
- ✅ 비밀번호 변경 완료
- ✅ 모든 기능 테스트 완료
- ✅ 프로덕션 환경에서 사용 가능

축하합니다! 🎊

