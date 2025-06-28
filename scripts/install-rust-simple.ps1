# 简化的Rust安装脚本

Write-Host "Installing Rust..." -ForegroundColor Green

# 下载并安装Rustup
$rustupUrl = "https://win.rustup.rs/x86_64"
$rustupPath = "$env:TEMP\rustup-init.exe"

Write-Host "Downloading Rustup..." -ForegroundColor Blue
Invoke-WebRequest -Uri $rustupUrl -OutFile $rustupPath -UseBasicParsing

Write-Host "Running Rustup installer..." -ForegroundColor Blue
Start-Process -FilePath $rustupPath -ArgumentList "-y" -Wait

Write-Host "Rust installation completed!" -ForegroundColor Green
Write-Host "Please restart your terminal to use Rust commands." -ForegroundColor Yellow
