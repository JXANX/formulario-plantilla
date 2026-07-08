$filePath = "C:\Users\JXANX\Downloads\PLANTILLA_DEFINITIVA_QUINDIO_CONSOLIDADA.xlsx"

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

$workbook = $excel.Workbooks.Open($filePath)
Write-Host "Sheet Count: $($workbook.Sheets.Count)"

Write-Host "=== ALL SHEET NAMES ==="
foreach($sheet in $workbook.Sheets) {
    $usedRange = $sheet.UsedRange
    Write-Host "  $($sheet.Name) - Rows: $($usedRange.Rows.Count), Cols: $($usedRange.Columns.Count)"
}

foreach($sheet in $workbook.Sheets) {
    $name = $sheet.Name
    $usedRange = $sheet.UsedRange
    $rows = $usedRange.Rows.Count
    $cols = $usedRange.Columns.Count
    
    Write-Host ""
    Write-Host "=== Sheet: $name (Rows: $rows, Cols: $cols) ==="
    
    for($r = 1; $r -le [Math]::Min($rows, 8); $r++) {
        Write-Host "--- Row $r ---"
        for($c = 1; $c -le [Math]::Min($cols, 25); $c++) {
            $val = $sheet.Cells.Item($r, $c).Text
            if($val -ne "") {
                Write-Host "  Col ${c}: $val"
            }
        }
    }
    
    # Also show a few rows from the middle
    if($rows -gt 20) {
        $midRow = [Math]::Floor($rows / 2)
        Write-Host "--- Row $midRow (middle) ---"
        for($c = 1; $c -le [Math]::Min($cols, 25); $c++) {
            $val = $sheet.Cells.Item($midRow, $c).Text
            if($val -ne "") {
                Write-Host "  Col ${c}: $val"
            }
        }
        Write-Host "--- Row $rows (last) ---"
        for($c = 1; $c -le [Math]::Min($cols, 25); $c++) {
            $val = $sheet.Cells.Item($rows, $c).Text
            if($val -ne "") {
                Write-Host "  Col ${c}: $val"
            }
        }
    }
}

$workbook.Close($false)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
