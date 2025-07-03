# MingLog 桌面客户端代码签名指南

## 概述

代码签名是确保应用程序可信度和完整性的重要安全措施。本指南详细说明了 MingLog 桌面客户端的代码签名配置和流程。

## 代码签名的重要性

### 安全性保障
- **身份验证**: 验证软件发布者身份
- **完整性检查**: 确保软件未被篡改
- **恶意软件防护**: 减少被误报为恶意软件的风险

### 用户体验
- **系统信任**: Windows SmartScreen 不会阻止已签名的应用
- **UAC 提示**: 减少用户账户控制警告
- **专业形象**: 提升软件的专业可信度

## 证书要求

### 证书类型
推荐使用以下类型的代码签名证书：

1. **EV 代码签名证书** (推荐)
   - 扩展验证证书
   - 最高信任级别
   - 立即获得 SmartScreen 信任

2. **标准代码签名证书**
   - 组织验证证书
   - 需要建立信誉才能获得完全信任

### 证书提供商
推荐的证书颁发机构：
- DigiCert
- Sectigo (原 Comodo)
- GlobalSign
- Entrust

### 证书格式
支持的证书格式：
- `.pfx` / `.p12` (PKCS#12)
- Windows 证书存储

## 环境配置

### 开发环境

#### 1. 安装 Windows SDK
```powershell
# 下载并安装 Windows 10/11 SDK
# 包含 signtool.exe 工具
```

#### 2. 证书安装
```powershell
# 安装 PFX 证书到个人证书存储
certlm.msc  # 本地计算机证书管理器
certmgr.msc # 当前用户证书管理器
```

#### 3. 环境变量配置
```powershell
# 设置证书相关环境变量
$env:MINGLOG_CERT_PATH = "C:\path\to\certificate.pfx"
$env:MINGLOG_CERT_PASSWORD = "certificate_password"
$env:MINGLOG_TIMESTAMP_URL = "http://timestamp.digicert.com"
```

### 生产环境

#### 1. 证书安全存储
- 使用 Azure Key Vault 或 AWS Certificate Manager
- 避免在代码库中存储证书文件
- 使用环境变量或安全配置管理

#### 2. 自动化签名
- 集成到 CI/CD 流水线
- 使用安全的构建环境
- 实现签名日志和审计

## 签名流程

### 手动签名

#### 1. 使用 PowerShell 脚本
```powershell
# 基本签名
.\scripts\code-signing.ps1 -FilePath "target\release\minglog-desktop.exe"

# 使用指定证书
.\scripts\code-signing.ps1 `
    -FilePath "target\release\minglog-desktop.exe" `
    -CertificatePath "C:\certs\minglog.pfx" `
    -CertificatePassword "password123"

# 自定义时间戳服务器
.\scripts\code-signing.ps1 `
    -FilePath "target\release\minglog-desktop.exe" `
    -TimestampUrl "http://timestamp.sectigo.com"
```

#### 2. 使用 SignTool 直接签名
```cmd
signtool sign ^
    /fd SHA256 ^
    /td SHA256 ^
    /tr http://timestamp.digicert.com ^
    /d "明志桌面版" ^
    /du "https://minglog.com" ^
    /f "certificate.pfx" ^
    /p "password" ^
    "minglog-desktop.exe"
```

### 自动化签名

#### 1. Tauri 配置集成
```json
{
  "tauri": {
    "bundle": {
      "windows": {
        "certificateThumbprint": "CERTIFICATE_THUMBPRINT",
        "digestAlgorithm": "sha256",
        "timestampUrl": "http://timestamp.digicert.com"
      }
    }
  }
}
```

#### 2. 构建后钩子
```javascript
// tauri.conf.json
{
  "build": {
    "beforeBuildCommand": "npm run build",
    "beforeDevCommand": "npm run dev",
    "afterBuildCommand": "powershell -ExecutionPolicy Bypass -File scripts/code-signing.ps1 -FilePath $TAURI_BUNDLE_PATH"
  }
}
```

## 验证签名

### 1. 使用 PowerShell
```powershell
# 验证签名状态
Get-AuthenticodeSignature -FilePath "minglog-desktop.exe"

# 详细信息
$sig = Get-AuthenticodeSignature -FilePath "minglog-desktop.exe"
$sig.SignerCertificate | Format-List *
```

### 2. 使用 SignTool
```cmd
# 验证签名
signtool verify /pa "minglog-desktop.exe"

# 详细验证
signtool verify /pa /v "minglog-desktop.exe"
```

### 3. 图形界面验证
- 右键点击可执行文件
- 选择"属性"
- 查看"数字签名"选项卡

## 故障排除

### 常见问题

#### 1. 证书未找到
**错误**: `SignTool Error: No certificates were found that met all the given criteria`

**解决方案**:
- 检查证书是否正确安装
- 验证证书主题名称
- 确认证书未过期

#### 2. 时间戳失败
**错误**: `SignTool Error: The specified timestamp server either could not be reached`

**解决方案**:
- 检查网络连接
- 尝试不同的时间戳服务器
- 使用 RFC 3161 时间戳服务器

#### 3. 私钥访问被拒绝
**错误**: `SignTool Error: An error occurred while attempting to load the signing certificate`

**解决方案**:
- 以管理员身份运行
- 检查证书私钥权限
- 重新导入证书

### 时间戳服务器列表

#### 免费时间戳服务器
```
http://timestamp.digicert.com
http://timestamp.sectigo.com
http://timestamp.globalsign.com
http://tsa.starfieldtech.com
http://timestamp.comodoca.com
```

#### RFC 3161 时间戳服务器
```
http://timestamp.digicert.com
http://rfc3161timestamp.globalsign.com/advanced
http://tsa.starfieldtech.com
```

## 最佳实践

### 证书管理
1. **定期更新**: 在证书过期前及时更新
2. **备份证书**: 安全备份证书和私钥
3. **权限控制**: 限制证书访问权限
4. **审计日志**: 记录证书使用情况

### 签名策略
1. **所有可执行文件**: 签名所有 .exe、.dll、.msi 文件
2. **时间戳**: 始终使用时间戳服务器
3. **算法选择**: 使用 SHA-256 算法
4. **验证流程**: 构建后自动验证签名

### 安全考虑
1. **证书保护**: 使用硬件安全模块 (HSM)
2. **访问控制**: 限制签名环境访问
3. **监控告警**: 监控异常签名活动
4. **应急响应**: 制定证书泄露应急预案

## CI/CD 集成

### GitHub Actions 示例
```yaml
name: Build and Sign
on:
  push:
    tags: ['v*']

jobs:
  build-and-sign:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup signing certificate
        run: |
          echo "${{ secrets.SIGNING_CERTIFICATE }}" | base64 -d > cert.pfx
        
      - name: Build application
        run: cargo tauri build
        
      - name: Sign executable
        run: |
          .\scripts\code-signing.ps1 `
            -FilePath "src-tauri\target\release\minglog-desktop.exe" `
            -CertificatePath "cert.pfx" `
            -CertificatePassword "${{ secrets.CERT_PASSWORD }}"
        
      - name: Verify signature
        run: |
          Get-AuthenticodeSignature "src-tauri\target\release\minglog-desktop.exe"
```

### Azure DevOps 示例
```yaml
trigger:
  tags:
    include:
      - v*

pool:
  vmImage: 'windows-latest'

steps:
- task: DownloadSecureFile@1
  name: signingCert
  inputs:
    secureFile: 'minglog-signing-cert.pfx'

- script: |
    .\scripts\code-signing.ps1 -FilePath "$(Build.ArtifactStagingDirectory)\minglog-desktop.exe" -CertificatePath "$(signingCert.secureFilePath)" -CertificatePassword "$(CERT_PASSWORD)"
  displayName: 'Sign executable'
```

## 监控和维护

### 证书监控
- 证书过期时间监控
- 证书撤销列表检查
- 签名验证状态监控

### 性能监控
- 签名时间统计
- 时间戳服务器响应时间
- 构建流程影响分析

### 合规性
- 签名日志记录
- 审计跟踪
- 合规性报告

通过遵循本指南，可以确保 MingLog 桌面客户端的代码签名流程安全、可靠且符合最佳实践。
