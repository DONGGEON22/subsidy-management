@echo off
chcp 65001 >nul
cd /d "C:\Users\ehdrj\OneDrive\Desktop\개발\new"

echo ========================================
echo 파비콘 및 이미지 배포
echo ========================================
echo.

echo [1/4] Git 상태 확인...
"C:\Program Files\Git\cmd\git.exe" status --short

echo.
echo [2/4] 모든 변경사항 추가...
"C:\Program Files\Git\cmd\git.exe" add -A

echo.
echo [3/4] 커밋...
"C:\Program Files\Git\cmd\git.exe" commit -m "feat: 돈 아이콘 파비콘 추가 (브라우저 탭 아이콘)"

echo.
echo [4/4] GitHub 푸시...
"C:\Program Files\Git\cmd\git.exe" push origin main

echo.
echo ========================================
echo 배포 완료!
echo ========================================
echo.
echo 1-2분 후 다음 사이트에서 확인하세요:
echo https://subsidy-management-qtjo.vercel.app/
echo.
echo 브라우저 탭에 💰 금화 아이콘이 표시됩니다!
echo.
echo ⚠️ 브라우저 새로고침: Ctrl + F5
pause

