$apiUrl = "http://localhost:8080"
$loginUrl = "$apiUrl/api/auth/login"
$uploadUrl = "$apiUrl/api/excel/import"
$excelPath = "C:\Users\shinm\OneDrive\Escritorio\formulario-plantilla\PLANTILLA_DEFINITIVA_QUINDIO_CONSOLIDADA.xlsx"

Write-Host "1. Iniciando sesión como AdminSuperior en LOCALHOST..."
$loginBody = @{
    correo = "AdminSuperior"
    password = "AdminJSD"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.token
    if (-not $token) {
        $token = $loginResponse.data.token
    }
} catch {
    Write-Host "Error al iniciar sesión. Asegúrate de que el backend esté corriendo."
    exit
}

Write-Host "Token obtenido correctamente."
Write-Host "2. Subiendo archivo Excel localmente con curl..."

curl.exe -X POST $uploadUrl -H "Authorization: Bearer $token" -F "file=@$excelPath"

Write-Host "`nProceso finalizado."
