# BearNetworkChain 客製版 — 上游同步與發布指南（AI Agent 專用）

本文件是給 AI agent 執行的**標準作業程序（SOP）**，用於在保護 BNES 原創內容的前提下，同步上游 MetaMask 更新、建置、發布。

---

## 1. 上游同步原則

### 1.1 核心原則

- **BNES 內容優先**：所有位於 `shared/bns/`、`app/manifest/v2/brave.json`、`app/manifest/v3/brave.json`、`update.xml`、`docs/bearnetworkchain-packaging.md`、`development/bump-dist-version.js`、`scripts/bnes-release.ps1` 的內容，皆視為 BNES 原創，**絕不因上游合併而被覆蓋或刪除**。
- **上游僅合併，不推送**：上游 MetaMask 官方（`https://github.com/MetaMask/metamask-extension.git`）的內容只合併到本地 `main` 分支，**絕不推送**到 `origin`（`BearNetwork-BRNKC/metamask-extension`）。
- **衝突解決策略**：遇到 merge conflict 時，**以 BNES 內容為準**。僅在不相關的區域接受上游變更。必要時調整行數位置，避免被上游同行數覆蓋。

### 1.2 上游遠端設定

```bash
# 確認遠端設定
git remote -v

# 應顯示：
# origin    https://github.com/BearNetwork-BRNKC/metamask-extension.git (fetch/push)
# upstream  https://github.com/MetaMask/metamask-extension.git (fetch)
```

若無 `upstream` 遠端，請新增：
```bash
git remote add upstream https://github.com/MetaMask/metamask-extension.git
```

---

## 2. 完整同步流程

### 2.1 前置檢查

```bash
cd S:\Ai_Agent\BNES\metamask-extension

# 確認當前分支為 main
git branch --show-current

# 確認工作目錄 clean
git status --short

# 確認無未提交的 BNES 內容遺失
git diff --name-only --diff-filter=U
```

若有未提交的 BNES 內容，**先提交**再繼續：
```bash
git add <受影響的 BNES 檔案>
git commit -m "feat(bnes): <描述>"
```

### 2.2 拉取上游更新

```bash
# 1. 獲取上游最新內容
git fetch upstream main

# 2. 確認分歧狀態
git rev-list --left-right --count main...upstream/main
# 格式：<本地領先> <落後>
# 例如：0	87 表示落後 87 個 commit

# 3. 合併上游到本地 main（不自動 commit，保留手動衝突處理）
git merge upstream/main --no-commit --no-ff
```

### 2.3 衝突處理（BNES 優先）

合併後檢查衝突檔案：
```bash
git diff --name-only --diff-filter=U
```

#### 2.3.1 常見衝突類型與處理

**類型 A：BNES import 與 upstream import 衝突**

範例：`app/scripts/messenger-client-init/assets/token-rates-controller-init.ts`

上游新增了 `getIsDeprecatedController` import，BNES 新增了 `createBrnkcAwareTokenPricesService` import。

**處理原則**：兩者都保留。
```typescript
// 保留 BNES import（優先）
import { createBrnkcAwareTokenPricesService } from '../../../../shared/bns/brnkc-token-prices-service';
// 同時合併 upstream import
import { getIsDeprecatedController } from '../../../../shared/lib/assets-unify-state/remote-feature-flag';
```

**類型 B：BNES 實作與 upstream 實作衝突**

範例：`tokenPricesService` 初始化

上游使用 `new CodefiTokenPricesServiceV2()`，BNES 使用 `createBrnkcAwareTokenPricesService({ inner: new CodefiTokenPricesServiceV2() })`。

**處理原則**：保留 BNES 版本，並合併 upstream 新增的 `isDeprecated` 欄位。
```typescript
tokenPricesService: createBrnkcAwareTokenPricesService({
  inner: new CodefiTokenPricesServiceV2() as never,
}) as never,
isDeprecated: () => {
  const { remoteFeatureFlags } = initMessenger.call(
    'RemoteFeatureFlagController:getState',
  );
  return getIsDeprecatedController(
    remoteFeatureFlags,
    'TokenRatesController',
  );
},
```

**類型 C：LavaMoat policy-override.json 衝突**

上游新增了 `PushManager` 權限，BNES 新增了 `fetch` 權限。

**處理原則**：兩者都保留。
```json
"@metamask/assets-controller": {
  "globals": {
    "fetch": true
  }
},
"@metamask/snaps-controllers": {
  "globals": {
    "fetch": true
  }
},
"@metamask/notification-services-controller>firebase>@firebase/messaging": {
  "globals": {
    "PushManager": true
  }
}
```

#### 2.3.2 批次解決 LavaMoat 衝突

若多個 `policy-override.json` 同時衝突，可用批次處理：
```powershell
$files = @(
  'lavamoat/webpack/mv2/beta/policy-override.json',
  'lavamoat/webpack/mv2/experimental/policy-override.json',
  'lavamoat/webpack/mv2/flask/policy-override.json',
  'lavamoat/webpack/mv2/main/policy-override.json',
  'lavamoat/webpack/mv3/beta/policy-override.json',
  'lavamoat/webpack/mv3/experimental/policy-override.json',
  'lavamoat/webpack/mv3/flask/policy-override.json',
  'lavamoat/webpack/mv3/main/policy-override.json'
)
foreach ($f in $files) {
  $c = Get-Content $f -Raw
  # 移除 conflict markers，保留 BNES 內容 + upstream 內容
  $c = $c -replace '[\r\n]+<<<<<<< HEAD', '' -replace '[\r\n]+=======', '' -replace '[\r\n]+>>>>>>> upstream/main', ''
  Set-Content $f $c -NoNewline
}
```

#### 2.3.3 確認無殘留衝突

```bash
git diff --name-only --diff-filter=U
# 應無輸出
```

### 2.4 提交與推送

```bash
# 1. 加入所有已解決的衝突檔案
git add .

# 2. 提交合併結果
git commit -m "merge: integrate upstream/main (<N> commits) while preserving BNES customizations

- Keep BNES bridge, PQC, CRX pipeline, and release automation intact
- Resolve controller init conflicts by combining BNES oracle decorator with upstream deprecation checks
- Preserve LavaMoat policy overrides for BNES fetch requirements alongside upstream PushManager"

# 3. 推送到 BearNetwork-BRNKC 遠端
git push origin main
```

### 2.5 驗證同步狀態

```bash
# 確認與上游的差距
git rev-list --left-right --count main...upstream/main
# 應顯示：52	0（或類似，領先上游、落後 0）

# 確認 origin/main 與本地一致
git log --oneline origin/main -1
git log --oneline main -1
# 兩者應相同
```

---

## 3. BNES 正式封裝

### 3.1 執行 Build

```powershell
# Windows PowerShell
yarn.cmd dist
```

此指令會：
1. 執行 `development/bump-dist-version.js` 自動將 `package.json` 的 patch version +1
2. 執行 `lavamoat:check-fetch-endowments` 檢查 fetch 權限
3. 執行 `webpack:lavamoat:build --zip` 進行 production + LavaMoat 建置

產物：
- `dist/chrome/` — 未壓縮擴充功能
- `builds/metamask-chrome-<version>.zip` — 壓縮包

### 3.2 驗證 Build 產物

```bash
# 確認版本已 bump
node -e "const p = require('./package.json'); console.log('version:', p.version);"

# 確認 dist/chrome 存在
Test-Path dist\chrome\manifest.json
```

---

## 4. 發布流程

### 4.1 執行發布腳本

```powershell
# 使用 package.json 的 version 作為發布版本
.\scripts\bnes-release.ps1

# 或指定版本
.\scripts\bnes-release.ps1 -BnesVersion 13.46.3

# 若已確定 dist/chrome 存在，可跳過檢查
.\scripts\bnes-release.ps1 -SkipBuild
```

前置條件：
- `dist/chrome/` 存在
- `bnes-metamask.pem` 存在於專案根目錄
- `node` 與 `npx` 可用

產物：
- `releases/bnes-metamask-extension-v<version>.zip`
- `releases/bnes-metamask-extension-v<version>.crx`
- `releases/RELEASE_NOTES_<version>.md`
- `update.xml`

### 4.2 更新 Release Notes

`bnes-release.ps1` 會自動產生 `releases/RELEASE_NOTES_<version>.md`，但內容為英文。

**若需手動更新為繁體中文 + 英文雙語格式**，請編輯該檔案，包含：
- 跨鏈橋功能說明
- CRX 雙軌發布管線
- PQC 量子抗性隧道
- 其他 BNES 客製功能

### 4.3 更新 update.xml

腳本會自動更新 `update.xml` 為最新 CRX 位址與版本號。

驗證：
```bash
cat update.xml
# 應顯示最新版本的 CRX URL 與 version
```

### 4.4 Git 提交發布相關檔案

```bash
git add releases/ update.xml
git commit -m "chore(release): v<version> - <描述>"
git push origin main
```

---

## 5. 發布後步驟

### 5.1 建立 GitHub Release

1. 到 GitHub Releases 建立 tag `v<version>`
2. 上傳 `.crx` 與 `.zip` 為 release assets

### 5.2 部署 update.xml 到 GitHub Pages

brave 擴充的自動更新依賴 `update.xml` 可從 `update_url` 訪問。必須將 `update.xml` 部署到 `gh-pages` 分支根目錄。

**方法：使用臨時目錄部署（避免污染 main 工作目錄）**

```powershell
# 1. 建立臨時部署目錄
$temp = "S:\Ai_Agent\BNES\gh-pages-deploy"
New-Item -ItemType Directory -Path $temp -Force | Out-Null
Set-Location $temp

# 2. 初始化 orphan 分支
git init
git remote add origin https://github.com/BearNetwork-BRNKC/metamask-extension.git
git checkout --orphan gh-pages
git reset --hard

# 3. 複製 update.xml
Copy-Item "S:\Ai_Agent\BNES\metamask-extension\update.xml" .

# 4. 提交並強制推送
git add update.xml
git commit -m "deploy: update.xml for v<version>"
git push origin gh-pages --force

# 5. 清理臨時目錄
Set-Location S:\Ai_Agent\BNES
Remove-Item $temp -Recurse -Force
```

部署後，`update.xml` 將可通過以下 URL 訪問：

```text
https://bearnetwork-brnkc.github.io/metamask-extension/update.xml
```

**注意：** GitHub Pages 部署約需 1-2 分鐘才會生效。若推送後立即測試仍 404，請稍後再試。

### 5.3 驗證更新

在 `chrome://extensions/` 頁面點擊「更新」按鈕，確認版本號已更新。

---

## 6. 完整流程檢查清單

```
□ 1. 確認工作目錄 clean（git status）
□ 2. 確認 BNES 內容已提交（無未提交修改）
□ 3. git fetch upstream main
□ 4. git merge upstream/main --no-commit --no-ff
□ 5. 解決所有衝突（BNES 優先）
□ 6. git add .
□ 7. git commit -m "merge: integrate upstream/main ..."
□ 8. git push origin main
□ 9. yarn.cmd dist
□ 10. 驗證 dist/chrome/ 與版本號
□ 11. .\scripts\bnes-release.ps1
□ 12. 更新 RELEASE_NOTES_<version>.md（雙語）
□ 13. git add releases/ update.xml
□ 14. git commit -m "chore(release): v<version>"
□ 15. git push origin main
□ 16. 建立 GitHub Release + 上傳 CRX/ZIP
□ 17. 部署 update.xml 到 gh-pages 分支（使用臨時目錄避免污染 main）
□ 18. 等待 1-2 分鐘讓 GitHub Pages 生效
□ 19. 在 chrome://extensions/ 點擊更新驗證版本
```

---

## 7. 重要注意事項

### 7.1 不可做的事情

- **絕不**推送任何內容到 `upstream`（MetaMask 官方）
- **絕不**在衝突解決中刪除 BNES 原創內容以配合上游
- **絕不**使用 `--theirs` 或 `--ours` 全盤接受某一側（必須手動檢查每個衝突）
- **絕不**在未確認 `update.xml` 正確性的情況下發布

### 7.2 版本號規則

- `package.json` 的 `version` 為 MetaMask upstream 版本號
- 發布時使用相同的版本號（如 `13.46.2`）
- `yarn.cmd dist` 會自動 bump patch version

### 7.3 LavaMoat 政策

每次上游合併後，若上游變動了 LavaMoat policy，請執行：
```bash
yarn.cmd lavamoat:auto
```

但**必須手動檢查** `policy-override.json` 是否仍包含 BNES 所需的 `fetch` 權限。

---

## 8. 故障排除

### 8.1 合併衝突過多

若上游變動極大，可考慮：
1. 先將 BNES 相關檔案 stash：
   ```bash
   git stash push -m "BNES customizations" -- shared/bns/ app/manifest/v2/brave.json app/manifest/v3/brave.json update.xml docs/bearnetworkchain-packaging.md development/bump-dist-version.js scripts/bnes-release.ps1
   ```
2. 合併上游
3. 恢復 stash：
   ```bash
   git stash pop
   ```
4. 手動解決残留衝突

### 8.2 Build 失敗

若 `yarn.cmd dist` 失敗：
1. 確認 `INFURA_PROJECT_ID` 已設定在 `.metamaskrc`
2. 確認 `dist/chrome/` 不存在舊殘留
3. 嘗試清除快取：
   ```bash
   yarn.cmd webpack:clearcache
   yarn.cmd dist
   ```

### 8.3 CRX 打包失敗

若 `npx crx3` 失敗：
1. 確認 `bnes-metamask.pem` 存在
2. 確認 `dist/chrome/manifest.json` 存在且有效
3. 手動執行：
   ```bash
   npx --yes crx3 -p .\bnes-metamask.pem .\dist\chrome
   ```
