
# Path to MongoDB Executable
$mongodPath = "C:\Program Files\MongoDB\Server\8.2\bin\mongod.exe"

# Path to local data directory (relative to this script)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$dbPath = Join-Path $scriptDir "data"

# Ensure data directory exists
if (-not (Test-Path $dbPath)) {
    New-Item -ItemType Directory -Path $dbPath | Out-Null
    Write-Host "Created data directory at $dbPath"
}

# Start MongoDB on port 27018 (custom port)
Write-Host "Starting MongoDB on port 27018..."
Write-Host "Data Path: $dbPath"
Write-Host "Press Ctrl+C to stop."

& $mongodPath --port 27018 --dbpath "$dbPath" --bind_ip 127.0.0.1
