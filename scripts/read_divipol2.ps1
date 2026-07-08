$filePath = "C:\Users\JXANX\Desktop\cruce maestro\DIVIPOLE PRESIDENTE 31 DE MAYO 2026 (1).xlsx"

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

$workbook = $excel.Workbooks.Open($filePath)
$sheet = $workbook.Sheets.Item(1)
$usedRange = $sheet.UsedRange
$rows = $usedRange.Rows.Count
$cols = $usedRange.Columns.Count

Write-Host "Total Rows: $rows, Cols: $cols"

# Print rows 1-15 to find the real headers
for($r = 1; $r -le 15; $r++) {
    Write-Host "--- Row $r ---"
    for($c = 1; $c -le [Math]::Min($cols, 20); $c++) {
        $val = $sheet.Cells.Item($r, $c).Text
        if($val -ne "") {
            Write-Host "  Col ${c}: $val"
        }
    }
}

# Now print some data rows (likely after row 8 or so)
Write-Host ""
Write-Host "=== SAMPLE DATA ROWS ==="
# Find QUINDIO rows
$foundCount = 0
for($r = 8; $r -le $rows; $r++) {
    $col1 = $sheet.Cells.Item($r, 1).Text
    if($col1 -eq "QUINDIO" -or $col1 -eq "Quindio" -or $col1 -eq "QUINDÍO") {
        Write-Host "--- Row $r ---"
        for($c = 1; $c -le [Math]::Min($cols, 15); $c++) {
            $val = $sheet.Cells.Item($r, $c).Text
            if($val -ne "") {
                Write-Host "  Col ${c}: $val"
            }
        }
        $foundCount++
        if($foundCount -ge 20) { break }
    }
}

if($foundCount -eq 0) {
    Write-Host "No QUINDIO found in Col 1, trying to find first non-empty data..."
    for($r = 7; $r -le 25; $r++) {
        Write-Host "--- Row $r ---"
        for($c = 1; $c -le [Math]::Min($cols, 15); $c++) {
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
