$filePath = "c:\Users\JXANX\Desktop\Formulario Plantilla\Testigos_Mesa_QUINDIO_ordenado_municipio.xlsx"

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

$workbook = $excel.Workbooks.Open($filePath)
$sheet = $workbook.Sheets.Item(1)
$usedRange = $sheet.UsedRange
$rows = $usedRange.Rows.Count
$cols = $usedRange.Columns.Count

Write-Host "Filas totales: $rows"
Write-Host "Columnas totales: $cols"

Write-Host "=== CABECERA (Fila 1) ==="
for ($c = 1; $c -le $cols; $c++) {
    $val = $sheet.Cells.Item(1, $c).Text
    if ($val -ne "") {
        Write-Host "  Columna $($c): $($val)"
    }
}

Write-Host ""
Write-Host "=== FILA 2 (Datos de ejemplo) ==="
for ($c = 1; $c -le $cols; $c++) {
    $val = $sheet.Cells.Item(2, $c).Text
    if ($val -ne "") {
        Write-Host "  Columna $($c): $($val)"
    }
}

$workbook.Close($false)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
