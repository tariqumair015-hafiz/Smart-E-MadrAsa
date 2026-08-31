@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo Staging project to local C: drive to bypass G: locks
echo ===================================================
set "SRC_DIR=G:\My Drive\Smart E Madarsa"
set "STAGE_DIR=C:\Users\IQRA TRADERS\AppData\Local\Temp\madarsa-build"

:: Create stage directory if not exists
if not exist "%STAGE_DIR%" mkdir "%STAGE_DIR%"

:: Mirror files excluding heavy/temporary directories
robocopy "%SRC_DIR%" "%STAGE_DIR%" /MIR /XD .git .gradle .idea node_modules dist /XF *.apk *.aab *.log *.txt

echo ===================================================
echo Setting up environment and running NPM Install
echo ===================================================
cd /d "%STAGE_DIR%"
set PATH=C:\node_portable\node-v20.12.2-win-x64;%PATH%

call npm.cmd install
if %ERRORLEVEL% neq 0 (
    echo npm install failed. Exiting.
    exit /b %ERRORLEVEL%
)

echo ===================================================
echo Building Web Assets
echo ===================================================
call npm.cmd run build
if %ERRORLEVEL% neq 0 (
    echo npm run build failed. Exiting.
    exit /b %ERRORLEVEL%
)

echo ===================================================
echo Syncing Capacitor Android
echo ===================================================
call npx.cmd cap sync android
if %ERRORLEVEL% neq 0 (
    echo cap sync android failed. Exiting.
    exit /b %ERRORLEVEL%
)

echo ===================================================
echo Cleaning and Compiling Production Android App Bundle (.aab)
echo ===================================================
cd android
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"

:: Remove old builds in staging and redirected outputs
rmdir /s /q "C:\AndroidBuilds\smart-e-madarsa" 2>nul

call gradlew.bat clean
if %ERRORLEVEL% neq 0 (
    echo gradlew clean failed. Exiting.
    exit /b %ERRORLEVEL%
)

call gradlew.bat bundleRelease -PRELEASE_STORE_FILE="C:\Users\IQRA TRADERS\OneDrive\Desktop\Final_build\Smart_E_Madarsa_FINAL.jks" -PRELEASE_KEY_ALIAS="smart_key_final" -PRELEASE_STORE_PASSWORD="Hafiz786" -PRELEASE_KEY_PASSWORD="Hafiz786"
if %ERRORLEVEL% neq 0 (
    echo gradlew bundleRelease failed. Exiting.
    exit /b %ERRORLEVEL%
)

echo ===================================================
echo Copying production signed App Bundle to G: Drive
echo ===================================================
if exist "C:\AndroidBuilds\android\app\outputs\bundle\release\app-release.aab" (
    copy /y "C:\AndroidBuilds\android\app\outputs\bundle\release\app-release.aab" "%SRC_DIR%\Smart_e_Madarsa_v2.16.43.aab"
    echo App Bundle built and copied successfully to G:\My Drive\Smart E Madarsa\Smart_e_Madarsa_v2.16.43.aab
) else (
    echo Error: Compiled bundle not found at C:\AndroidBuilds\android\app\outputs\bundle\release\app-release.aab
    exit /b 1
)

echo Done!
