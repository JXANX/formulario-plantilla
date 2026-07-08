$filePath = "C:\Users\JXANX\Desktop\cruce maestro\Centro_Mando_Electoral_Quindio_2026 .xlsx"

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

$workbook = $excel.Workbooks.Open($filePath)
Write-Host "Sheet Count: $($workbook.Sheets.Count)"
Write-Host ""

# List all sheets first
Write-Host "=== ALL SHEET NAMES ==="
foreach($sheet in $workbook.Sheets) {
    $usedRange = $sheet.UsedRange
    Write-Host "  $($sheet.Name) - Rows: $($usedRange.Rows.Count), Cols: $($usedRange.Columns.Count)"
}

Write-Host ""
Write-Host "============================================"

# Now look for sheets that have municipality/puesto/mesa structure
foreach($sheet in $workbook.Sheets) {
    $name = $sheet.Name
    $usedRange = $sheet.UsedRange
    $rows = $usedRange.Rows.Count
    $cols = $usedRange.Columns.Count
    
    # Skip the dashboard
    if($name -like "*DASHBOARD*") { continue }
    
    Write-Host ""
    Write-Host "=== Sheet: $name (Rows: $rows, Cols: $cols) ==="
    
    # Print first 3 rows
    for($r = 1; $r -le [Math]::Min($rows, 5); $r++) {
        Write-Host "--- Row $r ---"
        for($c = 1; $c -le [Math]::Min($cols, 25); $c++) {
            $val = $sheet.Cells.Item($r, $c).Text
            if($val -ne "") {
                Write-Host "  Col ${c}: $val"
            }
        }
    }
    
    # Only show first 3 sheets beyond dashboard to save time
}

$workbook.Close($false)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
