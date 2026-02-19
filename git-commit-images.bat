@echo off
chcp 65001 >nul
cd /d "C:\Users\ehdrj\OneDrive\Desktop\개발\new"
git add public/images/ public/login.html convert-svg-to-png.html
git commit -m "feat: 돈 관련 이미지로 로고 변경 (SVG)"
git push origin main
pause

