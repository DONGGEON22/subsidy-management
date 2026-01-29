#!/usr/bin/env node

/**
 * 🔐 환경변수 파일(.env) 설정 스크립트
 * 
 * 실행 방법:
 *   node setup-env.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║                                                           ║');
console.log('║         🔐 환경변수 파일(.env) 설정 도구                   ║');
console.log('║                                                           ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

// 기존 .env 파일이 있는지 확인
if (fs.existsSync(envPath)) {
    console.log('⚠️  .env 파일이 이미 존재합니다.');
    console.log('📄 경로:', envPath);
    console.log('\n기존 파일을 백업하려면 다음 명령을 실행하세요:');
    console.log('   cp .env .env.backup\n');
    process.exit(0);
}

// JWT Secret 생성
const jwtSecret = crypto.randomBytes(32).toString('hex');

// .env.example 파일 생성
const envExampleContent = `# 🔐 보안 설정 예시 파일
# 이 파일을 .env로 복사하고 실제 값으로 수정하세요: cp .env.example .env

# Supabase 연결 정보
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key-here

# JWT 시크릿 키 (강력한 랜덤 문자열 사용 필수!)
# 생성 방법: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your-very-strong-random-secret-key-here

# 관리자 계정 정보
ADMIN_USERNAME=admin
# 비밀번호 해시 생성 방법: node generate-default-password.js
ADMIN_PASSWORD_HASH=your-bcrypt-password-hash-here

# 서버 설정
PORT=3001
NODE_ENV=production

# CORS 허용 도메인 (쉼표로 구분, 공백 없이)
ALLOWED_ORIGINS=https://your-domain.vercel.app,http://localhost:3001

# 쿠키 도메인 (선택사항)
COOKIE_DOMAIN=
`;

// .env 파일 생성 (기본 Supabase 정보 포함)
const envContent = `# 🔐 보안 설정 - 이 파일은 절대 Git에 커밋하지 마세요!

# Supabase 연결 정보
SUPABASE_URL=https://knkffxwcsrkxjneffyzh.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtua2ZmeHdjc3JreGpuZWZmeXpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0MzM1MjcsImV4cCI6MjA4NTAwOTUyN30.qNn5K02eo7dT_ToFEOS8oGKloKzSrCtxJsDM-2U_cVU

# JWT 시크릿 키 (자동 생성된 강력한 랜덤 문자열)
JWT_SECRET=${jwtSecret}

# 관리자 계정 정보
ADMIN_USERNAME=admin
# 기본 비밀번호: admin1234 (로그인 후 반드시 변경하세요!)
ADMIN_PASSWORD_HASH=$2b$10$LjtsxnUJpQ/G8FoHPaxTB.c5UmkJ5E8NrcH7BMOzV0yb/5oYkOF12

# 서버 설정
PORT=3001
NODE_ENV=production

# CORS 허용 도메인 (쉼표로 구분, 공백 없이)
ALLOWED_ORIGINS=https://subsidy-management-qtjo.vercel.app,http://localhost:3001

# 쿠키 도메인 (선택사항)
COOKIE_DOMAIN=
`;

try {
    // .env.example 생성
    fs.writeFileSync(envExamplePath, envExampleContent, 'utf8');
    console.log('✅ .env.example 파일이 생성되었습니다.');
    
    // .env 생성
    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log('✅ .env 파일이 생성되었습니다.');
    
    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║                    설정 완료!                             ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    
    console.log('📋 생성된 파일:');
    console.log('   - .env           (실제 환경변수, Git에서 제외됨)');
    console.log('   - .env.example   (예시 파일, Git에 포함 가능)');
    
    console.log('\n🔑 생성된 JWT Secret:');
    console.log('   ' + jwtSecret);
    console.log('   (이미 .env 파일에 저장되었습니다)');
    
    console.log('\n⚠️  중요 보안 사항:');
    console.log('   1. .env 파일을 절대 Git에 커밋하지 마세요!');
    console.log('   2. 기본 관리자 비밀번호(admin1234)를 즉시 변경하세요!');
    console.log('   3. Supabase 키는 현재 프로젝트의 키를 사용하고 있습니다.');
    console.log('   4. 운영 환경에서는 Supabase 키를 재발급하는 것을 권장합니다.');
    
    console.log('\n🚀 다음 단계:');
    console.log('   1. 서버 실행: npm start 또는 node server.js');
    console.log('   2. 로그인: admin / admin1234');
    console.log('   3. 비밀번호 변경: 로그인 후 🔑 버튼 클릭');
    
    console.log('\n📚 참고:');
    console.log('   - 비밀번호 해시 생성: node generate-default-password.js');
    console.log('   - Supabase Dashboard: https://supabase.com/dashboard');
    
    console.log('\n');
} catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
    console.error('파일 생성에 실패했습니다.\n');
    process.exit(1);
}

