@echo off
chcp 65001 >nul
cd /d "C:\Users\ehdrj\OneDrive\Desktop\개발\new"

echo ========================================
echo Git 상태 확인
echo ========================================
"C:\Program Files\Git\cmd\git.exe" status

echo.
echo ========================================
echo 모든 변경사항 추가
echo ========================================
"C:\Program Files\Git\cmd\git.exe" add -A

echo.
echo ========================================
echo 커밋
echo ========================================
"C:\Program Files\Git\cmd\git.exe" commit -m "fix: 이미지 경로 수정 및 돈 아이콘 추가"

echo.
echo ========================================
echo GitHub 푸시
echo ========================================
"C:\Program Files\Git\cmd\git.exe" push origin main

echo.
echo ========================================
echo 완료! 1-2분 후 사이트 확인
echo https://subsidy-management-qtjo.vercel.app/
echo ========================================
echo.
echo 브라우저에서 Ctrl+F5로 새로고침하세요!
pause

