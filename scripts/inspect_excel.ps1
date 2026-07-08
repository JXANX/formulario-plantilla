$filePath = "C:\Users\JXANX\Desktop\Formulario Plantilla\PLANTILLA_DEFINITIVA_QUINDIO_CONSOLIDADA.xlsx"

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
    Write-Host "=========================================="
    Write-Host "=== Sheet: $name (Rows: $rows, Cols: $cols) ==="
    Write-Host "=========================================="
    
    # Print ALL headers (rows 1-3)
    for($r = 1; $r -le [Math]::Min($rows, 3); $r++) {
        Write-Host "--- Row $r ---"
        for($c = 1; $c -le [Math]::Min($cols, 30); $c++) {
            $val = $sheet.Cells.Item($r, $c).Text
            if($val -ne "") {
                Write-Host "  Col ${c}: [$val]"
            }
        }
    }
    
    # Print first 3 data rows
    for($r = 4; $r -le [Math]::Min($rows, 6); $r++) {
        Write-Host "--- Data Row $r ---"
        for($c = 1; $c -le [Math]::Min($cols, 30); $c++) {
            $val = $sheet.Cells.Item($r, $c).Text
            if($val -ne "") {
                Write-Host "  Col ${c}: [$val]"
            }
        }
    }
    
    # Count how many rows have data in the "testigo" columns (check multiple candidate columns)
    $testigoCount = 0
    for($r = 4; $r -le $rows; $r++) {
        # Check cols 8-20 for any non-empty data that could be testigo info
        for($c = 8; $c -le [Math]::Min($cols, 25); $c++) {
            $val = $sheet.Cells.Item($r, $c).Text
            if($val -ne "") {
                $testigoCount++
                break
            }
        }
    }
    Write-Host "--- Rows with data beyond col 7: $testigoCount ---"
    
    # Show a sample row with testigo data if exists
    if($testigoCount -gt 0) {
        for($r = 4; $r -le $rows; $r++) {
            $hasData = $false
            for($c = 8; $c -le [Math]::Min($cols, 25); $c++) {
                $val = $sheet.Cells.Item($r, $c).Text
                if($val -ne "") { $hasData = $true; break }
            }
            if($hasData) {
                Write-Host "--- SAMPLE ROW WITH TESTIGO DATA (Row $r) ---"
                for($c = 1; $c -le [Math]::Min($cols, 30); $c++) {
                    $val = $sheet.Cells.Item($r, $c).Text
                    if($val -ne "") {
                        Write-Host "  Col ${c}: [$val]"
                    }
                }
                break
            }
        }
    }
}

$workbook.Close($false)
$excel.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
