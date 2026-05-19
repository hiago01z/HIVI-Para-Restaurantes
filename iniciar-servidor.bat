@echo off
chcp 65001 >nul
title HIVI — Servidor Local

cd /d "%~dp0"

echo.
echo  ╔══════════════════════════════════════════╗
echo  ║         HIVI Para Restaurantes           ║
echo  ║         Iniciando servidor local...      ║
echo  ╚══════════════════════════════════════════╝
echo.

:: Verifica se node está instalado
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERRO] Node.js nao encontrado.
    echo  Instale em: https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: Verifica node_modules
if not exist "node_modules\" (
    echo  Instalando dependencias...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo  [ERRO] Falha no npm install.
        pause
        exit /b 1
    )
    echo.
)

:: Verifica .env.local
if not exist ".env.local" (
    echo  [ERRO] Arquivo .env.local nao encontrado.
    echo.
    echo  Crie o arquivo .env.local na pasta do projeto
    echo  com base no .env.example e preencha as chaves:
    echo.
    echo    - NEXT_PUBLIC_SUPABASE_URL
    echo    - NEXT_PUBLIC_SUPABASE_ANON_KEY
    echo    - SUPABASE_SERVICE_ROLE_KEY
    echo    - STRIPE_SECRET_KEY
    echo    - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    echo    - STRIPE_WEBHOOK_SECRET
    echo    - RESEND_API_KEY
    echo.
    pause
    exit /b 1
)

:: Pega o IP local (ignora loopback)
set LOCAL_IP=
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1"') do (
    if not defined LOCAL_IP (
        set RAW_IP=%%a
    )
)
for /f "tokens=* delims= " %%a in ("%RAW_IP%") do set LOCAL_IP=%%a

echo  Tudo certo! Servidor iniciando...
echo.
echo  ┌─────────────────────────────────────────┐
echo  │  PC      →  http://localhost:3000        │
echo  │  Celular →  http://%LOCAL_IP%:3000
echo  └─────────────────────────────────────────┘
echo.
echo  Pressione Ctrl+C para parar o servidor.
echo.

npx next dev -H 0.0.0.0 -p 3000

echo.
echo  Servidor parado.
pause
