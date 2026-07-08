$excelPath = "C:\Users\JXANX\Desktop\Formulario Plantilla\PLANTILLA_DEFINITIVA_QUINDIO_CONSOLIDADA.xlsx"
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

$workbook = $excel.Workbooks.Open($excelPath)
$sheet = $workbook.Sheets.Item(1)
$usedRange = $sheet.UsedRange
$rows = $usedRange.Rows.Count

$documentos = @{}
$modificados = 0

for ($r = 2; $r -le $rows; $r++) {
    $doc = $sheet.Cells.Item($r, 11).Text.Trim()
    if ($doc -ne "") {
        if ($documentos.ContainsKey($doc)) {
            $count = $documentos[$doc] + 1
            $documentos[$doc] = $count
            $newDoc = "$doc-$count"
            $sheet.Cells.Item($r, 11).Value2 = $newDoc
            Write-Host "Fila ${r}: Documento cambiado de $doc a $newDoc"
            $modificados++
        } else {
            $documentos[$doc] = 1
        }
    }
}

$workbook.Save()
$workbook.Close($true)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
Write-Host "Excel modificado correctamente. $modificados documentos duplicados fueron actualizados."
