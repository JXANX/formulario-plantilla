$excelPath = "C:\Users\JXANX\Desktop\Formulario Plantilla\PLANTILLA_DEFINITIVA_QUINDIO_CONSOLIDADA.xlsx"

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

$workbook = $excel.Workbooks.Open($excelPath)
$sheet = $workbook.Sheets.Item(1)
$usedRange = $sheet.UsedRange
$rows = $usedRange.Rows.Count
$cols = $usedRange.Columns.Count

$documentos = @{}
$duplicados = @()

for ($r = 2; $r -le $rows; $r++) {
    $doc = $sheet.Cells.Item($r, 11).Text.Trim()
    if ($doc -ne "") {
        if ($documentos.ContainsKey($doc)) {
            $duplicados += [PSCustomObject]@{
                Documento = $doc
                FilaOriginal = $documentos[$doc]
                FilaDuplicada = $r
                Nombre = $sheet.Cells.Item($r, 12).Text.Trim()
                Apellido = $sheet.Cells.Item($r, 14).Text.Trim()
            }
        } else {
            $documentos[$doc] = $r
        }
    }
}

$workbook.Close($false)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null

Write-Host "========== LOS 17 DOCUMENTOS DUPLICADOS =========="
$duplicados | Format-Table -AutoSize
