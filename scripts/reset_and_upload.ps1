$apiUrl = "https://testigos-backend-tw2v.onrender.com"
$loginUrl = "$apiUrl/api/auth/login"
$uploadUrl = "$apiUrl/api/excel/import"
$excelPath = "C:\Users\JXANX\Desktop\Formulario Plantilla\PLANTILLA_DEFINITIVA_QUINDIO_CONSOLIDADA.xlsx"

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host " RESET Y CARGA DE BASE DE DATOS" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

# -----------------------------------------------
# PASO 1: Login para obtener token del backend
# -----------------------------------------------
Write-Host "PASO 1: Iniciando sesion como AdminSuperior..." -ForegroundColor Yellow

$loginBody = @{
    correo   = "AdminSuperior"
    password = "AdminJSD"
} | ConvertTo-Json

$maxRetries = 5
$retryCount = 0
$token = $null

while ($retryCount -lt $maxRetries -and -not $token) {
    try {
        Write-Host "Intento de conexion $($retryCount + 1)/$maxRetries..." -ForegroundColor Cyan
        $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method Post -Body $loginBody -ContentType "application/json" -TimeoutSec 120
        $token = $loginResponse.data.token
        if ($token) {
            Write-Host "Token obtenido correctamente." -ForegroundColor Green
        } else {
            Write-Host "Respuesta exitosa pero sin token." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Fallo el intento: $_" -ForegroundColor Red
        $retryCount++
        if ($retryCount -lt $maxRetries) {
            Write-Host "El servidor en Render puede tardar hasta 2 minutos en despertar. Esperando 20s..." -ForegroundColor Yellow
            Start-Sleep -Seconds 20
        }
    }
}

if (-not $token) {
    Write-Host "ERROR FATAL: No se pudo conectar al servidor despues de $maxRetries intentos." -ForegroundColor Red
    exit 1
}

# -----------------------------------------------
# PASO 2: Verificar que el Excel existe
# -----------------------------------------------
Write-Host ""
Write-Host "PASO 2: Verificando archivo Excel..." -ForegroundColor Yellow
if (-not (Test-Path $excelPath)) {
    Write-Host "ERROR: No se encontro el archivo: $excelPath" -ForegroundColor Red
    exit 1
}
$fileSize = (Get-Item $excelPath).Length / 1KB
Write-Host "Archivo encontrado: $([System.IO.Path]::GetFileName($excelPath)) ($([Math]::Round($fileSize, 1)) KB)" -ForegroundColor Green

# -----------------------------------------------
# PASO 3: Descargar driver JDBC y ejecutar ClearDB
# -----------------------------------------------
Write-Host ""
Write-Host "PASO 3: Limpiando la base de datos..." -ForegroundColor Yellow

$driverJar = ".\postgresql-42.7.3.jar"
if (-not (Test-Path $driverJar)) {
    Write-Host "Descargando driver PostgreSQL JDBC..." -ForegroundColor Cyan
    $driverUrl = "https://jdbc.postgresql.org/download/postgresql-42.7.3.jar"
    try {
        Invoke-WebRequest -Uri $driverUrl -OutFile $driverJar -TimeoutSec 60
        Write-Host "Driver descargado correctamente." -ForegroundColor Green
    } catch {
        Write-Host "ERROR descargando driver: $_" -ForegroundColor Red
        Write-Host "Continuando sin limpiar (el import hara UPSERT)..." -ForegroundColor Yellow
    }
}

if (Test-Path $driverJar) {
    Write-Host "Compilando y ejecutando ClearDB..." -ForegroundColor Cyan
    javac -cp "." ClearDB.java 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        $clearResult = java -cp ".;$driverJar" ClearDB 2>&1
        Write-Host $clearResult
        if ($clearResult -match "borradas con") {
            Write-Host "Base de datos limpiada correctamente." -ForegroundColor Green
        }
    } else {
        Write-Host "Error compilando ClearDB. Continuando con UPSERT..." -ForegroundColor Yellow
    }
} else {
    Write-Host "ADVERTENCIA: Continuando sin limpiar (UPSERT)..." -ForegroundColor Yellow
}

# -----------------------------------------------
# PASO 4: Subir el nuevo Excel
# -----------------------------------------------
Write-Host ""
Write-Host "PASO 4: Subiendo Excel al servidor..." -ForegroundColor Yellow
Write-Host "Esto puede tardar varios minutos con un archivo grande." -ForegroundColor Cyan

$startTime = Get-Date

$curlResult = curl.exe -X POST $uploadUrl `
    -H "Authorization: Bearer $token" `
    -F "file=@`"$excelPath`"" `
    --max-time 600 `
    --connect-timeout 120 `
    -w "`n%{http_code}" `
    -s 2>&1

$endTime = Get-Date
$elapsed = ($endTime - $startTime).TotalSeconds

$lines = $curlResult -split "`n"
$httpCode = ($lines | Select-Object -Last 1).Trim()
$body = ($lines | Select-Object -SkipLast 1) -join "`n"

Write-Host ""
Write-Host "Tiempo: $([Math]::Round($elapsed, 1))s | HTTP: $httpCode" -ForegroundColor Cyan
if ($httpCode -eq "200") {
    Write-Host "Respuesta: $body" -ForegroundColor Green
    Write-Host ""
    Write-Host "=============================================" -ForegroundColor Green
    Write-Host " COMPLETADO EXITOSAMENTE" -ForegroundColor Green
    Write-Host "=============================================" -ForegroundColor Green
} else {
    Write-Host "Respuesta: $body" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "=============================================" -ForegroundColor Red
    Write-Host " ERROR - HTTP $httpCode" -ForegroundColor Red
    Write-Host " Revisa la respuesta del servidor." -ForegroundColor Red
    Write-Host "=============================================" -ForegroundColor Red
}
