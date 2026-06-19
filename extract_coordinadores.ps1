$backupPath = "c:\Users\JXANX\Desktop\BACKUP ELECTORAL\backup_nuevo.sql"
$outPath = "c:\Users\JXANX\Desktop\Formulario Plantilla\coordinadores_backup.csv"

$content = Get-Content -Path $backupPath

$municipios = @{}
$testigos = @{}
$puestosConCoordinador = @()

$state = ""

foreach ($line in $content) {
    if ($line -match "^COPY public\.municipios ") { $state = "m"; continue }
    if ($line -match "^COPY public\.testigos ") { $state = "t"; continue }
    if ($line -match "^COPY public\.puestos ") { $state = "p"; continue }
    if ($line -eq "\.") { $state = ""; continue }

    if ($state -eq "m") {
        $parts = $line -split "`t"
        $municipios[$parts[0]] = $parts[1] # id -> codigo_municipio
    }
    elseif ($state -eq "t") {
        $parts = $line -split "`t"
        $testigos[$parts[0]] = $parts[3] # id -> documento
    }
    elseif ($state -eq "p") {
        $parts = $line -split "`t"
        $coordinadorId = $parts[5]
        if ($coordinadorId -ne "\N") {
            $puestosConCoordinador += [PSCustomObject]@{
                PuestoId = $parts[0]
                CodigoPuesto = $parts[1]
                Zona = $parts[3]
                MunicipioId = $parts[4]
                CoordinadorId = $coordinadorId
            }
        }
    }
}

$results = @()
foreach ($p in $puestosConCoordinador) {
    $codigoMunicipio = $municipios[$p.MunicipioId]
    $documentoTestigo = $testigos[$p.CoordinadorId]
    
    if ($codigoMunicipio -and $documentoTestigo) {
        $results += "$codigoMunicipio,$($p.CodigoPuesto),$($p.Zona),$documentoTestigo"
    }
}

$results | Out-File -FilePath $outPath -Encoding utf8
Write-Host "Extraidos $($results.Count) coordinadores. Guardado en $outPath"
