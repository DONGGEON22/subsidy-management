# UTF-8 인코딩 설정
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# 프로젝트 디렉토리로 이동
$projectPath = "C:\Users\ehdrj\OneDrive\Desktop\개발\new"
Set-Location $projectPath

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Vercel 배포 시작" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Git 경로 설정
$gitPath = "C:\Program Files\Git\cmd\git.exe"

Write-Host "[1/4] Git 상태 확인 중..." -ForegroundColor Yellow
& $gitPath status --short

Write-Host ""
Write-Host "[2/4] 변경사항 추가 중..." -ForegroundColor Yellow
& $gitPath add .

Write-Host ""
Write-Host "[3/4] 커밋 중..." -ForegroundColor Yellow
& $gitPath commit -m "feat: 돈 관련 이미지로 로고 변경 (SVG)"

Write-Host ""
Write-Host "[4/4] GitHub에 푸시 중..." -ForegroundColor Yellow
& $gitPath push origin main

Write-Host ""
Write-Host "================================" -ForegroundColor Green
Write-Host "완료! Vercel이 자동으로 배포합니다." -ForegroundColor Green
Write-Host "배포 상태: https://vercel.com/dashboard" -ForegroundColor Green
Write-Host "사이트: https://subsidy-management-qtjo.vercel.app/" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green
Write-Host ""
Write-Host "아무 키나 눌러 종료..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

