@echo off
chcp 65001 >nul
echo ================================
echo Vercel 배포 시작
echo ================================
echo.

cd /d "C:\Users\ehdrj\OneDrive\Desktop\개발\new"

echo [1/3] Git 변경사항 추가 중...
git add .

echo [2/3] 커밋 중...
git commit -m "feat: 돈 관련 이미지로 로고 변경 (SVG)"

echo [3/3] GitHub에 푸시 중...
git push origin main

echo.
echo ================================
echo 완료! Vercel이 자동으로 배포를 시작합니다.
echo 배포 상태: https://vercel.com/dashboard
echo ================================
pause

