param([string]$BnesVersion = "",[switch]$SkipBuild)
$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
if (-not $ScriptDir) { $ScriptDir = $PSScriptRoot }
$Root = Split-Path $ScriptDir -Parent
$PackageJson = Join-Path $Root "package.json"
$DistDir = Join-Path $Root "dist\chrome"
$ReleasesDir = Join-Path $Root "releases"
$BuildsDir = Join-Path $Root "builds"
$UpdateXmlPath = Join-Path $Root "update.xml"
$PemPath = Join-Path $Root "bnes-metamask.pem"
$pkg = Get-Content $PackageJson -Raw | ConvertFrom-Json
$MmVersion = $pkg.version
Write-Host "[OK] MetaMask version: $MmVersion" -ForegroundColor Cyan
if ($BnesVersion -eq "") { $BnesVersion = $MmVersion; Write-Host "[INFO] Using upstream version: $BnesVersion" -ForegroundColor Yellow } else { Write-Host "[OK] BNES version: $BnesVersion" -ForegroundColor Cyan }
$ZipName = "bnes-metamask-extension-v$BnesVersion.zip"
$CrxName = "bnes-metamask-extension-v$BnesVersion.crx"
$ZipPath = Join-Path $ReleasesDir $ZipName
$CrxPath = Join-Path $ReleasesDir $CrxName
$TagName = "v$BnesVersion"
if (-not (Test-Path $PemPath)) { Write-Host "[ERROR] bnes-metamask.pem not found" -ForegroundColor Red; exit 1 }
Write-Host "[OK] Private key found" -ForegroundColor Cyan
$TmpJs = Join-Path $env:TEMP "bnes-ext-id.js"
$pemEsc = $PemPath.Replace('\','\\')
$js = "const crypto=require('crypto'),fs=require('fs'),pem=fs.readFileSync('$pemEsc'),pub=crypto.createPublicKey(pem),der=pub.export({type:'spki',format:'der'}),hash=crypto.createHash('sha256').update(der).digest(),id=Array.from(hash.slice(0,16)).map(b=>String.fromCharCode(97+(b>>4))+String.fromCharCode(97+(b&15))).join('');process.stdout.write(id);"
[System.IO.File]::WriteAllText($TmpJs, $js, [System.Text.Encoding]::UTF8)
$ExtensionId = node $TmpJs
Remove-Item $TmpJs -Force
Write-Host "[OK] Extension ID: $ExtensionId" -ForegroundColor Green
if (-not (Test-Path $DistDir)) { Write-Host "[ERROR] dist/chrome not found. Run: yarn.cmd dist" -ForegroundColor Red; exit 1 }
$distManifest = Get-Content (Join-Path $DistDir 'manifest.json') -Raw | ConvertFrom-Json
$DistVersion = $distManifest.version; $DistVersionShort = $distManifest.version_name
Write-Host "[OK] dist manifest version: $DistVersion ($DistVersionShort)" -ForegroundColor Cyan
if ($BnesVersion -and $DistVersionShort -and ($DistVersionShort -ne $BnesVersion)) { Write-Host "[WARN] Version mismatch: package.json=$BnesVersion, dist=$DistVersionShort" -ForegroundColor Red }
if (-not (Test-Path $ReleasesDir)) { New-Item -ItemType Directory -Path $ReleasesDir | Out-Null }
Write-Host "" ; Write-Host "[Track 1/2] Producing ZIP..." -ForegroundColor White
if (Test-Path $ZipPath) { Remove-Item $ZipPath -Force }
$BuiltZip = Get-ChildItem -Path $BuildsDir -Filter '*.zip' -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending | Select-Object -First 1
if ($BuiltZip) { Copy-Item $BuiltZip.FullName -Destination $ZipPath -Force; Write-Host "[OK] Copied from builds/: $($BuiltZip.Name)" -ForegroundColor Cyan } else { Compress-Archive -Path "$DistDir\*" -DestinationPath $ZipPath -Force }
$ZipSize = [math]::Round((Get-Item $ZipPath).Length / 1MB, 2)
Write-Host "[OK] ZIP ready: $ZipName ($ZipSize MB)" -ForegroundColor Green
Write-Host "" ; Write-Host "[Track 2/2] Producing CRX..." -ForegroundColor White
if (Test-Path $CrxPath) { Remove-Item $CrxPath -Force }
npx --yes crx3 -p $PemPath $DistDir
$TempCrxPath = Join-Path $Root 'chrome.crx'
if (Test-Path $TempCrxPath) { Move-Item $TempCrxPath $CrxPath -Force; $CrxSize = [math]::Round((Get-Item $CrxPath).Length / 1MB, 2); Write-Host "[OK] CRX ready: $CrxName ($CrxSize MB)" -ForegroundColor Green } else { Write-Host "[ERROR] CRX packaging failed" -ForegroundColor Red; exit 1 }
$Today = Get-Date -Format 'yyyy-MM-dd'
$nl = [Environment]::NewLine
$ck = [char]0x2705
$notes = ("## BNC Wallet $TagName","","> Code base: MetaMask upstream main (package.json: $MmVersion)","> Release date: $Today","","### v$BnesVersion - PQC Wallet Upgrade","- $ck PQC protocol layer (shared/bnes-pqc/): 0x04 RLP Quantum Envelope","- $ck Anti-quantum signing via bnes-pqc-snap (ML-DSA-87)","- $ck Upstream sync guard: bnes-upstream-check","","### BNES Features","- $ck BearNetworkChain Mainnet pre-configured","- $ck BRNKC native token logo","- $ck BNES Oracle price integration","- $ck Regular MetaMask upstream sync","","### Installation","","#### Option A: CRX auto-update (recommended)","1. Download $CrxName","2. Drag to brave://extensions/","3. Future updates: click Update button","","#### Option B: ZIP manual install","1. Download $ZipName","2. Extract and open Brave","3. Go to brave://extensions/ > Developer mode","4. Click Load unpacked","","> Note: Not published to Chrome Web Store.") -join $nl
$NotesPath = Join-Path $ReleasesDir "RELEASE_NOTES_$BnesVersion.md"
[System.IO.File]::WriteAllText($NotesPath, $notes, [System.Text.Encoding]::UTF8)
Write-Host "[OK] Release notes: $NotesPath" -ForegroundColor Green
$CrxUrl = "https://github.com/BearNetwork-BRNKC/metamask-extension/releases/download/$TagName/$CrxName"
$xml = "<?xml version='1.0' encoding='UTF-8'?>$nl<gupdate xmlns='http://www.google.com/update2/response' protocol='2.0'>$nl  <app appid='$ExtensionId'>$nl    <updatecheck$nl      codebase='$CrxUrl'$nl      version='$MmVersion' />$nl  </app>$nl</gupdate>$nl"
[System.IO.File]::WriteAllText($UpdateXmlPath, $xml, [System.Text.Encoding]::UTF8)
Write-Host "[OK] update.xml updated (CRX, version=$MmVersion)" -ForegroundColor Green
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " BNES Wallet Release Ready!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host " MetaMask version : $MmVersion"
Write-Host " BNES Tag         : $TagName"
Write-Host " Extension ID     : $ExtensionId"
Write-Host " CRX (auto-update): $CrxPath"
Write-Host " ZIP (manual)     : $ZipPath"
Write-Host " CRX size         : $CrxSize MB"
Write-Host " ZIP size         : $ZipSize MB"
Write-Host " Release notes    : $NotesPath"
Write-Host " update.xml       : $UpdateXmlPath"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. https://github.com/BearNetwork-BRNKC/metamask-extension/releases/new"
Write-Host "  2. Tag: $TagName"
Write-Host "  3. Upload $CrxName and $ZipName as release assets"
Write-Host "  4. Deploy update.xml to GitHub Pages (gh-pages branch root)"
Write-Host "     URL: https://bearnetwork-brnkc.github.io/metamask-extension/update.xml"
Write-Host ""
