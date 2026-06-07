$apiUrl = "https://testigos-backend-tw2v.onrender.com"
$loginUrl = "$apiUrl/api/auth/login"
$uploadUrl = "$apiUrl/api/excel/import"
$excelPath = "C:\Users\JXANX\Desktop\Formulario Plantilla\PLANTILLA_DEFINITIVA_QUINDIO_CONSOLIDADA.xlsx"

Write-Host "1. Iniciando sesión como AdminSuperior..."
$loginBody = @{
    correo = "AdminSuperior"
    password = "AdminJSD"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri $loginUrl -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginResponse.data.token

Write-Host "Token obtenido correctamente."
Write-Host "2. Subiendo archivo Excel a la nube con curl (esto puede tardar unos minutos)..."

# Usar curl nativo de Windows (mucho más estable para subir archivos grandes)
curl.exe -X POST $uploadUrl -H "Authorization: Bearer $token" -F "file=@$excelPath"

Write-Host "`nProceso finalizado."
