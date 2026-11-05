# start-dev.ps1
# Inicia el servidor PostgreSQL, backend y frontend de Mediqux

$root = "c:\Users\carlos.ciappina\Desktop\CLINICA\Mediqux"
$pgDir = "$root\pgsql"
$dataDir = "$root\pgdata"
$pgBin = "$pgDir\bin"

# Leer variables del .env
$envVars = @{}
Get-Content "$root\.env" | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.+)$') {
        $key = $matches[1].Trim()
        $val = ($matches[2].Trim() -split '#')[0].Trim()
        $envVars[$key] = $val
    }
}
$pgPort = $envVars['POSTGRES_PORT']
$pgUser = $envVars['POSTGRES_USER']
$env:PGPASSWORD = $envVars['POSTGRES_PASSWORD']

Write-Host "=== Iniciando Mediqux (modo desarrollo) ===" -ForegroundColor Cyan

# 1. Iniciar PostgreSQL si no está corriendo
$pgRunning = & "$pgBin\pg_ctl.exe" -D $dataDir status 2>&1
if ($pgRunning -notmatch "server is running") {
    Write-Host "`n[1/3] Iniciando PostgreSQL..." -ForegroundColor Yellow
    & "$pgBin\pg_ctl.exe" -D $dataDir -l "$dataDir\postgres.log" start
    Start-Sleep -Seconds 3
} else {
    Write-Host "`n[1/3] PostgreSQL ya está corriendo ✅" -ForegroundColor Green
}

# 2. Iniciar Backend
Write-Host "`n[2/3] Iniciando Backend (puerto 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 3

# 3. Iniciar Frontend
Write-Host "`n[3/3] Iniciando Frontend (puerto 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev" -WindowStyle Normal

Write-Host "`n✅ Todo iniciado!" -ForegroundColor Green
Write-Host "   → Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "   → Backend:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "`nPrimera vez? Abrí http://localhost:5173 para crear el admin." -ForegroundColor White
