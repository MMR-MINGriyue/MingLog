# MingLog 桌面客户端代码签名脚本
# 用于自动化代码签名流程

param(
    [Parameter(Mandatory=$true)]
    [string]$FilePath,
    
    [Parameter(Mandatory=$false)]
    [string]$CertificatePath = "",
    
    [Parameter(Mandatory=$false)]
    [string]$CertificatePassword = "",
    
    [Parameter(Mandatory=$false)]
    [string]$TimestampUrl = "http://timestamp.digicert.com",
    
    [Parameter(Mandatory=$false)]
    [string]$Description = "明志桌面版",
    
    [Parameter(Mandatory=$false)]
    [string]$ProductUrl = "https://minglog.com"
)

# 错误处理
$ErrorActionPreference = "Stop"

# 日志函数
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] [$Level] $Message"
}

# 检查文件是否存在
function Test-FileExists {
    param([string]$Path)
    if (-not (Test-Path $Path)) {
        throw "文件不存在: $Path"
    }
}

# 获取证书信息
function Get-CertificateInfo {
    param([string]$CertPath)
    
    try {
        if ($CertPath.EndsWith(".pfx") -or $CertPath.EndsWith(".p12")) {
            # PFX/P12 证书
            $cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2
            $cert.Import($CertPath, $CertificatePassword, [System.Security.Cryptography.X509Certificates.X509KeyStorageFlags]::DefaultKeySet)
            return $cert
        } else {
            # 从证书存储获取
            $cert = Get-ChildItem -Path "Cert:\CurrentUser\My" | Where-Object { $_.Subject -like "*MingLog*" } | Select-Object -First 1
            if (-not $cert) {
                $cert = Get-ChildItem -Path "Cert:\LocalMachine\My" | Where-Object { $_.Subject -like "*MingLog*" } | Select-Object -First 1
            }
            return $cert
        }
    } catch {
        throw "无法加载证书: $_"
    }
}

# 验证证书有效性
function Test-CertificateValidity {
    param([System.Security.Cryptography.X509Certificates.X509Certificate2]$Certificate)
    
    $now = Get-Date
    if ($Certificate.NotBefore -gt $now) {
        throw "证书尚未生效: $($Certificate.NotBefore)"
    }
    
    if ($Certificate.NotAfter -lt $now) {
        throw "证书已过期: $($Certificate.NotAfter)"
    }
    
    if (-not $Certificate.HasPrivateKey) {
        throw "证书没有私钥"
    }
    
    Write-Log "证书有效期: $($Certificate.NotBefore) 到 $($Certificate.NotAfter)"
    Write-Log "证书主题: $($Certificate.Subject)"
    Write-Log "证书颁发者: $($Certificate.Issuer)"
}

# 执行代码签名
function Invoke-CodeSigning {
    param(
        [string]$File,
        [string]$CertPath,
        [string]$CertPassword,
        [string]$Timestamp,
        [string]$Desc,
        [string]$Url
    )
    
    Write-Log "开始对文件进行代码签名: $File"
    
    # 检查 signtool.exe
    $signTool = Get-Command "signtool.exe" -ErrorAction SilentlyContinue
    if (-not $signTool) {
        # 尝试从 Windows SDK 路径查找
        $sdkPaths = @(
            "${env:ProgramFiles(x86)}\Windows Kits\10\bin\*\x64\signtool.exe",
            "${env:ProgramFiles}\Windows Kits\10\bin\*\x64\signtool.exe",
            "${env:ProgramFiles(x86)}\Microsoft SDKs\Windows\*\bin\signtool.exe"
        )
        
        foreach ($path in $sdkPaths) {
            $found = Get-ChildItem $path -ErrorAction SilentlyContinue | Sort-Object Name -Descending | Select-Object -First 1
            if ($found) {
                $signTool = $found.FullName
                break
            }
        }
        
        if (-not $signTool) {
            throw "未找到 signtool.exe，请安装 Windows SDK"
        }
    } else {
        $signTool = $signTool.Source
    }
    
    Write-Log "使用 SignTool: $signTool"
    
    # 构建签名命令
    $signArgs = @(
        "sign"
        "/fd", "SHA256"
        "/td", "SHA256"
        "/tr", $Timestamp
        "/d", $Desc
        "/du", $Url
    )
    
    if ($CertPath -and (Test-Path $CertPath)) {
        # 使用证书文件
        $signArgs += "/f", $CertPath
        if ($CertPassword) {
            $signArgs += "/p", $CertPassword
        }
    } else {
        # 使用证书存储
        $signArgs += "/s", "My"
        $signArgs += "/n", "MingLog Team"
    }
    
    $signArgs += $File
    
    Write-Log "执行签名命令..."
    try {
        & $signTool @signArgs
        if ($LASTEXITCODE -ne 0) {
            throw "SignTool 执行失败，退出代码: $LASTEXITCODE"
        }
        Write-Log "代码签名成功" "SUCCESS"
    } catch {
        throw "代码签名失败: $_"
    }
}

# 验证签名
function Test-CodeSignature {
    param([string]$File)
    
    Write-Log "验证代码签名..."
    
    try {
        $signature = Get-AuthenticodeSignature -FilePath $File
        
        if ($signature.Status -eq "Valid") {
            Write-Log "签名验证成功" "SUCCESS"
            Write-Log "签名者: $($signature.SignerCertificate.Subject)"
            Write-Log "时间戳: $($signature.TimeStamperCertificate.Subject)"
            return $true
        } else {
            Write-Log "签名验证失败: $($signature.Status)" "ERROR"
            Write-Log "状态消息: $($signature.StatusMessage)" "ERROR"
            return $false
        }
    } catch {
        Write-Log "签名验证异常: $_" "ERROR"
        return $false
    }
}

# 主执行流程
try {
    Write-Log "=== MingLog 代码签名流程开始 ==="
    
    # 1. 验证输入文件
    Write-Log "验证输入文件: $FilePath"
    Test-FileExists -Path $FilePath
    
    # 2. 获取并验证证书
    if ($CertificatePath) {
        Write-Log "使用指定证书文件: $CertificatePath"
        Test-FileExists -Path $CertificatePath
        $cert = Get-CertificateInfo -CertPath $CertificatePath
    } else {
        Write-Log "从证书存储获取证书"
        $cert = Get-CertificateInfo -CertPath ""
    }
    
    if ($cert) {
        Test-CertificateValidity -Certificate $cert
    } else {
        throw "未找到有效的代码签名证书"
    }
    
    # 3. 执行代码签名
    Invoke-CodeSigning -File $FilePath -CertPath $CertificatePath -CertPassword $CertificatePassword -Timestamp $TimestampUrl -Desc $Description -Url $ProductUrl
    
    # 4. 验证签名结果
    $isValid = Test-CodeSignature -File $FilePath
    
    if ($isValid) {
        Write-Log "=== 代码签名流程完成 ===" "SUCCESS"
        exit 0
    } else {
        Write-Log "=== 代码签名流程失败 ===" "ERROR"
        exit 1
    }
    
} catch {
    Write-Log "代码签名流程异常: $_" "ERROR"
    Write-Log "=== 代码签名流程失败 ===" "ERROR"
    exit 1
}

# 使用示例:
# .\code-signing.ps1 -FilePath "C:\path\to\minglog-desktop.exe"
# .\code-signing.ps1 -FilePath "C:\path\to\minglog-desktop.exe" -CertificatePath "C:\path\to\cert.pfx" -CertificatePassword "password"
