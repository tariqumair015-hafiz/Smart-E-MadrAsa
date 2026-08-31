$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"

# Prefer system-installed node/npm/npx; fall back to portable bundled node if present
$portableNodeDir = "C:\node_portable\node-v20.12.2-win-x64"
$nodeExe = (Get-Command node -ErrorAction SilentlyContinue | Select-Object -First 1).Source
if (-not $nodeExe -and (Test-Path (Join-Path $portableNodeDir 'node.exe'))) {
    $nodeExe = Join-Path $portableNodeDir 'node.exe'
    $env:PATH = "$portableNodeDir;" + $env:PATH
}
if ($nodeExe) {
    $nodeVersion = & $nodeExe -v
    Write-Host "Node version: $nodeVersion"
} else {
    Write-Host "Node not found on PATH and portable node not present. Install Node or update script.";
}

$npmCmd = (Get-Command npm -ErrorAction SilentlyContinue | Select-Object -First 1).Source
if (-not $npmCmd -and (Test-Path (Join-Path $portableNodeDir 'npm.cmd'))) {
    $npmCmd = Join-Path $portableNodeDir 'npm.cmd'
}
if ($npmCmd) {
    $npmVersion = & $npmCmd -v
    Write-Host "NPM version: $npmVersion"
} else {
    Write-Host "npm not found on PATH and portable npm not present."
}

Write-Host "Java version:"
& "C:\Program Files\Android\Android Studio\jbr\bin\java.exe" -version

# Clean residual capacitor Android build artifacts that may lock files
$capBuildPath = Join-Path -Path $PSScriptRoot -ChildPath "node_modules\@capacitor\android\capacitor\build"
if (Test-Path $capBuildPath) {
    Write-Host "Removing leftover Capacitor Android build directory..."
    Remove-Item -Path $capBuildPath -Recurse -Force -ErrorAction SilentlyContinue
}

if (-not $npmCmd) {
    Write-Host "Cannot run web build because npm is not available. Aborting."
    exit 1
}
Write-Host "Building Web Assets..."
& npx vite build

$npxCmd = (Get-Command npx -ErrorAction SilentlyContinue | Select-Object -First 1).Source
if (-not $npxCmd -and (Test-Path (Join-Path $portableNodeDir 'npx.cmd'))) {
    $npxCmd = Join-Path $portableNodeDir 'npx.cmd'
}
if (-not $npxCmd) {
    Write-Host "npx not found on PATH and portable npx not present. Install npm (which includes npx).";
    exit 1
}
Write-Host "Syncing Android..."
& node node_modules/@capacitor/cli/bin/capacitor sync android

Write-Host "Cleaning Android build..."
cd android
# Ensure previous build artifacts are removed to avoid lock issues
$androidBuildPath = Join-Path -Path $PSScriptRoot -ChildPath "android\app\build"
if (Test-Path $androidBuildPath) {
    Write-Host "Removing android/app/build directory..."
    Remove-Item -Path $androidBuildPath -Recurse -Force -ErrorAction SilentlyContinue
}
.\gradlew.bat clean

Write-Host "Building APK..."
.\gradlew.bat assembleDebug

if ($LASTEXITCODE -eq 0) {
    Write-Host "Copying APK to workspace..."
    cd ..
    Copy-Item "C:\AndroidBuilds\android\app\outputs\apk\debug\app-debug.apk" -Destination "Smart_e_Madarsa_v2.16.43.apk" -Force
    Write-Host "Build complete!"
} else {
    Write-Host "Build failed."
}
