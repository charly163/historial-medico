# setup-db.ps1
# Script para inicializar PostgreSQL portable y crear la base de datos de Mediqux

$root = "c:\Users\carlos.ciappina\Desktop\CLINICA\Mediqux"
$pgDir = "$root\pgsql"
$dataDir = "$root\pgdata"
$pgBin = "$pgDir\bin"

Write-Host "=== Setup PostgreSQL Portable para Mediqux ===" -ForegroundColor Cyan

# Leer variables del .env
$envFile = "$root\.env"
$envVars = @{}
Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.+)$') {
        $key = $matches[1].Trim()
        $val = $matches[2].Trim()
        # Remover comentarios inline
        $val = ($val -split '#')[0].Trim()
        $envVars[$key] = $val
    }
}

$pgPassword = $envVars['POSTGRES_PASSWORD']
$pgUser = $envVars['POSTGRES_USER']
$pgDb = $envVars['POSTGRES_DB']
$pgPort = "5433"  # Puerto alternativo (5432 ya está en uso por otra instancia)

Write-Host "DB: $pgDb | User: $pgUser | Port: $pgPort"

# Crear directorio de datos si no existe
if (-not (Test-Path $dataDir)) {
    New-Item -ItemType Directory -Path $dataDir | Out-Null
}

# Inicializar cluster de PostgreSQL
Write-Host "`nInicializando cluster de base de datos..." -ForegroundColor Yellow
$env:PGPASSWORD = $pgPassword

# Crear archivo de password para initdb
$pwFile = "$env:TEMP\pg_init_pass.txt"
Set-Content -Path $pwFile -Value $pgPassword -NoNewline

& "$pgBin\initdb.exe" -D $dataDir -U $pgUser --pwfile=$pwFile --encoding=UTF8 --locale=en_US.UTF-8 2>&1
Remove-Item $pwFile -ErrorAction SilentlyContinue

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error al inicializar la base de datos" -ForegroundColor Red
    exit 1
}

# Configurar puerto en postgresql.conf
$pgConf = "$dataDir\postgresql.conf"
(Get-Content $pgConf) -replace "#port = 5432", "port = $pgPort" | Set-Content $pgConf

Write-Host "`nIniciando servidor PostgreSQL..." -ForegroundColor Yellow
& "$pgBin\pg_ctl.exe" -D $dataDir -l "$dataDir\postgres.log" start

Start-Sleep -Seconds 3

# Crear la base de datos
Write-Host "`nCreando base de datos '$pgDb'..." -ForegroundColor Yellow
$env:PGPASSWORD = $pgPassword
& "$pgBin\createdb.exe" -h localhost -p $pgPort -U $pgUser $pgDb

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ PostgreSQL listo en localhost:$pgPort" -ForegroundColor Green
    Write-Host "✅ Base de datos '$pgDb' creada" -ForegroundColor Green
} else {
    Write-Host "Error al crear la base de datos" -ForegroundColor Red
    exit 1
}
