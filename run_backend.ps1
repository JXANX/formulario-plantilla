$mavenVersion = "3.9.6"
$mavenZip = "apache-maven-$mavenVersion-bin.zip"
$mavenUrl = "https://archive.apache.org/dist/maven/maven-3/$mavenVersion/binaries/$mavenZip"
$mavenDir = "C:\Users\shinm\OneDrive\Escritorio\formulario-plantilla\maven"

if (-Not (Test-Path $mavenDir)) {
    Write-Host "Descargando Maven..."
    Invoke-WebRequest -Uri $mavenUrl -OutFile $mavenZip
    Write-Host "Extrayendo Maven..."
    Expand-Archive -Path $mavenZip -DestinationPath $mavenDir
    Remove-Item $mavenZip
}

$env:DB_URL = "jdbc:postgresql://aws-1-us-east-2.pooler.supabase.com:5432/postgres"
$env:DB_USERNAME = "postgres.htciguvegyvevuamferh"
$env:DB_PASSWORD = "CAMILO.BASE123"

$mvnCmd = "$mavenDir\apache-maven-$mavenVersion\bin\mvn.cmd"
Write-Host "Iniciando backend local conectado a Supabase..."
& $mvnCmd -f "C:\Users\shinm\OneDrive\Escritorio\formulario-plantilla\backend\pom.xml" spring-boot:run
