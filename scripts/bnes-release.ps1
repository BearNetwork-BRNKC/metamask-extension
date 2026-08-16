# ============================================================
# BNES Wallet 發布腳本
# 用法：
#   .\scripts\bnes-release.ps1              → 自動從 package.json 讀取版本
#   .\scripts\bnes-release.ps1 -BnesVersion "1.2.0"  → 指定 BNES 版號
# ============================================================

param(
    [string]$BnesVersion = ""
)

$ErrorActionPreference = "Stop"

# 路徑計算
$ScriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Definition
if (-not $ScriptDir) { $ScriptDir = $PSScriptRoot }
$Root        = Split-Path $ScriptDir -Parent

$PackageJson   = Join-Path $Root "package.json"
$DistDir       = Join-Path $Root "dist\chrome"
$ReleasesDir   = Join-Path $Root "releases"
$BuildsDir     = Join-Path $Root "builds"
$UpdateXmlPath = Join-Path $Root "update.xml"

# ── Step 1：自動讀取 MetaMask 上游版本號 ──────────────────────
$pkg = Get-Content $PackageJson -Raw | ConvertFrom-Json
$MmVersion = $pkg.version
Write-Host "✅ 偵測到 MetaMask 上游版本：$MmVersion" -ForegroundColor Cyan

# ── Step 2：決定 BNES 版號 ────────────────────────────────────
if ($BnesVersion -eq "") {
    $BnesVersion = $MmVersion
    Write-Host "ℹ️  未指定 BNES 版號，使用上游版本號：$BnesVersion" -ForegroundColor Yellow
} else {
    Write-Host "✅ BNES 版號：$BnesVersion" -ForegroundColor Cyan
}

$ZipName = "bnes-metamask-extension-v$BnesVersion.zip"
$ZipPath = Join-Path $ReleasesDir $ZipName
$TagName = "v$BnesVersion"

# ── Step 3：檢查 dist/chrome 是否存在 ────────────────────────
if (-not (Test-Path $DistDir)) {
    Write-Host "❌ 找不到 dist/chrome，請先執行 yarn.cmd dist" -ForegroundColor Red
    exit 1
}

$ManifestPath = Join-Path $DistDir "manifest.json"
$distManifest = Get-Content $ManifestPath -Raw | ConvertFrom-Json
$DistVersion  = $distManifest.version
Write-Host "✅ dist/chrome/manifest.json 版本確認：$DistVersion" -ForegroundColor Cyan

# ── Step 4：建立 releases 目錄並取得/打包 ZIP ────────────────
if (-not (Test-Path $ReleasesDir)) {
    New-Item -ItemType Directory -Path $ReleasesDir | Out-Null
}

if (Test-Path $ZipPath) {
    Remove-Item $ZipPath -Force
}

# 優先檢查 yarn.cmd dist 產出的 builds/ 目錄
$BuiltZip = Get-ChildItem -Path $BuildsDir -Filter "*.zip" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if ($BuiltZip) {
    Write-Host "📦 發現 builds/ 中由 yarn.cmd dist 產出的包：$($BuiltZip.Name)" -ForegroundColor Cyan
    Copy-Item $BuiltZip.FullName -Destination $ZipPath -Force
    Write-Host "✅ 已複製至 releases 目錄：$ZipName" -ForegroundColor Green
} else {
    Write-Host "⚠️  未在 builds/ 找到 ZIP 檔，改由 dist/chrome/ 直接壓縮..." -ForegroundColor Yellow
    Write-Host "📦 正在打包：$ZipName ..." -ForegroundColor White
    Compress-Archive -Path "$DistDir\*" -DestinationPath $ZipPath -Force
    Write-Host "✅ 打包完成：$ZipName" -ForegroundColor Green
}

$ZipSize = [math]::Round((Get-Item $ZipPath).Length / 1MB, 2)
Write-Host "ℹ️  最終 ZIP 大小：$ZipSize MB" -ForegroundColor Gray

# ── Step 5：產生 Release 說明文字 ────────────────────────────
$Today = Get-Date -Format "yyyy-MM-dd"
$ReleaseNotesText = @"
## BNC Wallet $TagName

> **代碼基準**：MetaMask 上游 main 分支（package.json version: $MmVersion）
> **官方最新 Release**：v13.44.0
> **發布日期**：$Today

### BNES 主要特色
- ✅ 預設加入 BearNetworkChain Mainnet 作為 Featured Network
- ✅ 正確顯示 BRNKC 原生幣 Logo
- ✅ BNES Oracle 價格整合
- ✅ 保持與官方 MetaMask 定期同步

### 安裝方式
1. 下載下方 $ZipName
2. 解壓縮後，開啟 Chrome（或 Brave）
3. 進入 chrome://extensions/
4. 開啟右上角「開發人員模式」
5. 點擊「載入已解壓縮的擴充功能」
6. 選擇解壓縮後的資料夾

> **注意**：此版本不上架 Chrome Web Store，僅提供開源下載安裝。
"@

$NotesPath = Join-Path $ReleasesDir "RELEASE_NOTES_$BnesVersion.md"
[System.IO.File]::WriteAllText($NotesPath, $ReleaseNotesText, [System.Text.Encoding]::UTF8)
Write-Host "✅ Release 說明已產生：$NotesPath" -ForegroundColor Green

# ── Step 6：更新 update.xml（供自動更新用）────────────────────
# 若 manifest.json 沒附 key，使用專案預設的客製 key
$DefaultKey = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAqZDxqBR1jHc1TygPHRO+GEyjMENrt3GLn2zXZg0VJ+S8EDuPSQR3sh14qDGWqbqpVk6+6ZF5QI5Ofx9lqAbNV7KjZT4W4RcXJ0VnTqPKUvhWm5+PfUbWMmnuQPebLjuVAkjiZUtY6OfVDowJdYmz4OLp6s64g+lH/Skz3lPKgVQKkWqrDDOy+wPsMBhiYWVGJvRkWA1f73mzhu6yTex/VivXg5PCck/xFN2/UiWTOYK4a/f8/XdVvN6yJd6XHH2lC7BJ+e8Trx0YeIC+3GNgv85rnlb4h31TzF4tmGV2cXB6d1Xw2KT0K+eS4KbTct5tCHOnnDZXvGhJDBrCH786jQIDAQAB'

$keyB64 = $distManifest.key
if (-not $keyB64) {
    $keyB64 = $DefaultKey
}

$keyBytes  = [Convert]::FromBase64String($keyB64)
$sha256    = [System.Security.Cryptography.SHA256]::Create()
$hashBytes = $sha256.ComputeHash($keyBytes)
$idChars   = @()
foreach ($b in $hashBytes[0..15]) {
    $idChars += [char]([int][char]'a' + ($b -band 0x0F))
    $idChars += [char]([int][char]'a' + (($b -shr 4) -band 0x0F))
}
$ExtensionId = -join $idChars
Write-Host "✅ Extension ID（已計算確認）：$ExtensionId" -ForegroundColor Green

$ZipUrl = "https://github.com/BearNetwork-BRNKC/metamask-extension/releases/download/$TagName/$ZipName"

$UpdateXmlText = @"
<?xml version='1.0' encoding='UTF-8'?>
<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>
  <app appid='$ExtensionId'>
    <updatecheck
      codebase='$ZipUrl'
      version='$MmVersion' />
  </app>
</gupdate>
"@

[System.IO.File]::WriteAllText($UpdateXmlPath, $UpdateXmlText, [System.Text.Encoding]::UTF8)
Write-Host "✅ update.xml 已更新（version=$MmVersion）" -ForegroundColor Green

# ── 完成摘要 ────────────────────────────────────────────────
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " 🎉 BNES Wallet 發布準備完成！" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " MetaMask 上游版本  : $MmVersion"
Write-Host " BNES Release Tag   : $TagName"
Write-Host " Extension ID       : $ExtensionId"
Write-Host " ZIP 檔案           : $ZipPath"
Write-Host " ZIP 大小           : $ZipSize MB"
Write-Host " Release 說明       : $NotesPath"
Write-Host " update.xml         : $UpdateXmlPath"
Write-Host ""
Write-Host "📋 接下來請手動執行：" -ForegroundColor Yellow
Write-Host "  1. 前往 https://github.com/BearNetwork-BRNKC/metamask-extension/releases/new"
Write-Host "  2. Tag：$TagName"
Write-Host "  3. 貼上 $NotesPath 的內容作為說明"
Write-Host "  4. 上傳 $ZipName 作為 Asset"
Write-Host "  5. （若已設定 update.xml）推送 update.xml 到 GitHub Pages"
Write-Host ""
