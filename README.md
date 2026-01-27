# 1자리도약장려금 관리 시스템 - 독립형 웹앱

구글 앱스크립트에서 독립형 Node.js 웹 애플리케이션으로 마이그레이션된 지원금 관리 시스템입니다.

## 🚀 시작하기

### 필수 요구사항
- Node.js (v14 이상)
- npm

### 설치 및 실행

1. **의존성 설치**
```bash
npm install
```

2. **서버 실행**
```bash
npm start
```

3. **브라우저에서 접속**
```
http://localhost:3001
```

## 📁 프로젝트 구조

```
new/
├── server.js              # Express 서버 및 API 엔드포인트
├── package.json           # 프로젝트 의존성
├── public/                # 프론트엔드 파일
│   ├── index.html        # 메인 HTML
│   ├── css/
│   │   └── styles.css    # 스타일시트
│   └── js/
│       └── app.js        # 클라이언트 JavaScript
└── data/                  # JSON 데이터 파일 (자동 생성)
    ├── companies.json
    ├── employees_type1.json
    ├── employees_type2.json
    ├── to.json
    └── memos.json
```

## 🔄 구글 앱스크립트에서의 주요 변경사항

### 1. 데이터 저장소
- **이전**: Google Sheets
- **현재**: JSON 파일 (data/ 디렉토리)

### 2. API 호출
- **이전**: `google.script.run.functionName()`
- **현재**: `fetch('/api/endpoint')` (REST API)

### 3. 서버
- **이전**: Google Apps Script 런타임
- **현재**: Node.js + Express

## 📡 API 엔드포인트

### 기업 관리
- `GET /api/companies` - 모든 기업 조회
- `POST /api/companies` - 새 기업 추가
- `PUT /api/companies/:id` - 기업 정보 수정
- `DELETE /api/companies/:id` - 기업 삭제

### 직원 관리
- `GET /api/employees/:companyId/:type` - 특정 기업의 직원 조회
- `POST /api/employees` - 새 직원 추가
- `PUT /api/employees/:id` - 직원 정보 수정
- `DELETE /api/employees/:id` - 직원 삭제

### TO 관리
- `GET /api/to/:employeeId` - 특정 직원의 TO 조회
- `POST /api/to` - 새 TO 추가
- `PUT /api/to/:id` - TO 수정
- `DELETE /api/to/:id` - TO 삭제

### 메모 관리
- `GET /api/memos/:employeeId` - 특정 직원의 메모 조회
- `POST /api/memos` - 새 메모 추가
- `DELETE /api/memos/:id` - 메모 삭제

### 대시보드
- `GET /api/dashboard` - 대시보드 데이터 조회
- `GET /api/commission/:companyId` - 수수료 계산

## 🎨 기능

### ✅ 구현된 기능
- 기업 관리 (추가, 수정, 삭제)
- 직원 관리 (추가, 수정, 삭제)
- 유형1/유형2 지원금 관리
- TO(Turnover) 관리
- 메모 및 히스토리
- 수수료 자동 계산
- 대시보드 (신청 예정 목록)
- Toss 스타일 UI/UX

### 📊 데이터 구조

#### 기업 (companies.json)
```json
{
  "id": "unique-id",
  "name": "기업명",
  "type": "유형1" | "유형2",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

#### 직원 (employees_type1.json, employees_type2.json)
```json
{
  "id": "unique-id",
  "companyId": "company-id",
  "name": "직원명",
  "birthdate": "1990-01-01",
  "hireDate": "2024-01-01",
  "status": "근무중" | "퇴사",
  "payments": { ... },
  "youthPayments": { ... }
}
```

## 🔧 개발 모드

서버를 수정한 후 자동으로 재시작하려면:

```bash
npm install -g nodemon
nodemon server.js
```

## 📝 주의사항

1. **데이터 백업**: `data/` 디렉토리의 JSON 파일을 정기적으로 백업하세요.
2. **포트 변경**: 포트 3001이 사용 중이면 `server.js`의 `PORT` 상수를 변경하세요.
3. **보안**: 프로덕션 환경에서는 인증 및 권한 관리를 추가해야 합니다.

## 🐛 문제 해결

### 서버가 시작되지 않을 때
```bash
# 포트가 이미 사용 중인 경우
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### 데이터가 표시되지 않을 때
- `data/` 디렉토리가 존재하는지 확인
- JSON 파일의 형식이 올바른지 확인
- 브라우저 콘솔에서 에러 메시지 확인

## 📄 라이선스

이 프로젝트는 내부 사용을 위한 것입니다.

## 🙋‍♂️ 지원

문제가 발생하면 개발자에게 문의하세요.
