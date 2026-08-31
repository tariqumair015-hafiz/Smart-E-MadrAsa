$source = "G:\My Drive\Smart E Madarsa"
$dest = "C:\Users\IQRA TRADERS\AppData\Local\Temp\madarsa-build"

if (Test-Path $dest) {
    Remove-Item -Path $dest -Recurse -Force -ErrorAction SilentlyContinue
}
New-Item -ItemType Directory -Force -Path $dest

Write-Host "Copying files to C: drive temp directory..."
Copy-Item -Path "$source\package.json" -Destination $dest
Copy-Item -Path "$source\package-lock.json" -Destination $dest
Copy-Item -Path "$source\vite.config.js" -Destination $dest
Copy-Item -Path "$source\index.html" -Destination $dest
Copy-Item -Path "$source\src" -Destination $dest -Recurse
Copy-Item -Path "$source\public" -Destination $dest -Recurse
Copy-Item -Path "$source\android" -Destination $dest -Recurse

Write-Host "Running npm install..."
Set-Location $dest
cmd /c "npm install"

Write-Host "Running build..."
cmd /c "npm run build"
