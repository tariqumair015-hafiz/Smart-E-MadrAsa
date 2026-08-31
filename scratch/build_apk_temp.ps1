$source = "G:\My Drive\Smart E Madarsa"
$dest = "C:\Users\IQRA TRADERS\AppData\Local\Temp\madarsa-build"

# Set environment variables for Java and Android Studio JBR
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "C:\Program Files\Android\Android Studio\jbr\bin;" + $env:PATH

Write-Host "Copying configuration and modified source files to C: drive temp directory..."
Copy-Item -Path "$source\capacitor.config.json" -Destination "$dest\capacitor.config.json" -Force
Copy-Item -Path "$source\src\supabaseClient.js" -Destination "$dest\src\supabaseClient.js" -Force
Copy-Item -Path "$source\src\components\BottomNav.jsx" -Destination "$dest\src\components\BottomNav.jsx" -Force
Copy-Item -Path "$source\src\App.css" -Destination "$dest\src\App.css" -Force
Copy-Item -Path "$source\android\app\src\main\res\values\styles.xml" -Destination "$dest\android\app\src\main\res\values\styles.xml" -Force

cd $dest

Write-Host "Building Web Assets..."
cmd /c "npm run build"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Web build failed. Aborting."
    exit 1
}

Write-Host "Syncing Capacitor Android..."
cmd /c "npx cap sync android"

Write-Host "Building Android APK..."
cd android

# Ensure previous build artifacts are removed to avoid lock issues
$androidBuildPath = "$dest\android\app\build"
if (Test-Path $androidBuildPath) {
    Write-Host "Removing android/app/build directory..."
    Remove-Item -Path $androidBuildPath -Recurse -Force -ErrorAction SilentlyContinue
}

# Clean Gradle build
.\gradlew.bat clean

# Compile debug APK
.\gradlew.bat assembleDebug

if ($LASTEXITCODE -eq 0) {
    Write-Host "Copying built APK to G: drive workspace..."
    cd $source
    Copy-Item "$dest\android\app\outputs\apk\debug\app-debug.apk" -Destination "$source\Smart_e_Madarsa_v2.16.43.apk" -Force
    Write-Host "Build complete and successful!"
} else {
    Write-Host "Gradle build failed."
    exit 1
}
