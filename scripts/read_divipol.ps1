$filePath = "C:\Users\JXANX\Desktop\cruce maestro\DIVIPOLE PRESIDENTE 31 DE MAYO 2026 (1).xlsx"

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

$workbook = $excel.Workbooks.Open($filePath)
Write-Host "Sheet Count: $($workbook.Sheets.Count)"

foreach($sheet in $workbook.Sheets) {
    $name = $sheet.Name
    $usedRange = $sheet.UsedRange
    $rows = $usedRange.Rows.Count
    $cols = $usedRange.Columns.Count
    
    Write-Host ""
    Write-Host "=== Sheet: $name (Rows: $rows, Cols: $cols) ==="
    
    for($r = 1; $r -le [Math]::Min($rows, 6); $r++) {
        Write-Host "--- Row $r ---"
        for($c = 1; $c -le [Math]::Min($cols, 20); $c++) {
            $val = $sheet.Cells.Item($r, $c).Text
            if($val -ne "") {
                Write-Host "  Col ${c}: $val"
            }
        }
    }
}

$workbook.Close($false)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
