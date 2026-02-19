@echo off
cd /d "C:\Users\ehdrj\OneDrive\Desktop\개발\new"
"C:\Program Files\Git\cmd\git.exe" add .
"C:\Program Files\Git\cmd\git.exe" commit -m "feat: 돈 관련 이미지로 로고 변경"
"C:\Program Files\Git\cmd\git.exe" push origin main
echo.
echo 배포 완료!
pause

