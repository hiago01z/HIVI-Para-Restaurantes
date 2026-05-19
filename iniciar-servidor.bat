@echo off
title HIVI - Servidor Local

cd /d "%~dp0"

echo.
echo  =========================================
echo   HIVI Para Restaurantes
echo   Iniciando servidor local...
echo  =========================================
echo.

:: Tenta encontrar o node em locais comuns se nao estiver no PATH
where node >nul 2>&1
if %errorlevel% neq 0 (
    if exist "C:\Program Files\nodejs\npm.cmd" (
        set PATH=C:\Program Files\nodejs;%PATH%
    ) else if exist "%APPDATA%\nvm\nvm.exe" (
        echo  [AVISO] Usando nvm - ative a versao do Node primeiro.
    ) else (
        echo  [ERRO] Node.js nao encontrado.
        echo  Instale em: https://nodejs.org
        echo.
        pause
        exit /b 1
    )
)

:: Verifica se npm esta disponivel
where npm >nul 2>&1
if %errorlevel% neq 0 (
    set PATH=C:\Program Files\nodejs;%PATH%
)

echo  Node.js encontrado!
echo.

:: Instala dependencias se necessario
if not exist "node_modules\" (
    echo  Instalando dependencias pela primeira vez...
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
    echo  [AVISO] .env.local nao encontrado - crie com base no .env.example
    echo.
)

:: Pega o IP local
set LOCAL_IP=SEU-IP-LOCAL
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /i "IPv4" ^| findstr /v "127.0.0.1"') do (
    set RAW=%%a
    goto :found
)
:found
for /f "tokens=* delims= " %%a in ("%RAW%") do set LOCAL_IP=%%a

echo  Servidor rodando em:
echo.
echo    PC      : http://localhost:3000
echo    Celular : http://%LOCAL_IP%:3000
echo.
echo  Pressione Ctrl+C para parar.
echo.

npm run dev:host

echo.
echo  Servidor parado.
pause
