$files = @(
    "C:\Users\JXANX\Desktop\plantilla_QUINDIO CAMPA`u{00d1}A SIN CLAVE.xlsx",
    "C:\Users\JXANX\Desktop\cruce maestro\Centro_Mando_Electoral_Quindio_2026 .xlsx"
)

foreach($filePath in $files) {
    Write-Host "============================================"
    Write-Host "FILE: $filePath"
    Write-Host "============================================"
    
    if(-not (Test-Path $filePath)) {
        Write-Host "FILE NOT FOUND - skipping"
        continue
    }
    
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    
    try {
        $workbook = $excel.Workbooks.Open($filePath)
        Write-Host "Sheet Count: $($workbook.Sheets.Count)"
        
        foreach($sheet in $workbook.Sheets) {
            Write-Host ""
            Write-Host "=== Sheet: $($sheet.Name) ==="
            $usedRange = $sheet.UsedRange
            Write-Host "Rows: $($usedRange.Rows.Count)"
            Write-Host "Cols: $($usedRange.Columns.Count)"
            
            Write-Host "--- HEADERS (Row 1) ---"
            for($c = 1; $c -le [Math]::Min($usedRange.Columns.Count, 30); $c++) {
                $val = $sheet.Cells.Item(1, $c).Text
                if($val -ne "") {
                    Write-Host "  Col ${c}: $val"
                }
            }
            
            Write-Host "--- HEADERS (Row 2) ---"
            for($c = 1; $c -le [Math]::Min($usedRange.Columns.Count, 30); $c++) {
                $val = $sheet.Cells.Item(2, $c).Text
                if($val -ne "") {
                    Write-Host "  Col ${c}: $val"
                }
            }
            
            for($r = 3; $r -le [Math]::Min($usedRange.Rows.Count, 8); $r++) {
                Write-Host "--- Row $r ---"
                for($c = 1; $c -le [Math]::Min($usedRange.Columns.Count, 30); $c++) {
                    $val = $sheet.Cells.Item($r, $c).Text
                    if($val -ne "") {
                        Write-Host "  Col ${c}: $val"
                    }
                }
            }
        }
        
        $workbook.Close($false)
    } catch {
        Write-Host "ERROR: $_"
    }
    
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
}
