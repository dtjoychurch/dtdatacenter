# CMS 內容管理後台設定 (Sveltia CMS)

同工可以透過 `/admin` 這個網頁後台編輯網站內容，不需要碰 Git 或程式碼。每次儲存，後台會自動在 GitHub repo 建立一個 commit（或依設定建立 PR）。

用的是 [Sveltia CMS](https://github.com/sveltia/sveltia-cms)，一個開源、免費的 Git-based CMS，相容 Decap CMS 的設定格式。它透過 GitHub API 直接讀寫這個 repo 的檔案，本身不需要另外的資料庫或帳號系統。

## 還沒完成的部署設定

以下步驟需要有這個 GitHub repo 管理權限的人（例如你）手動完成一次，之後同工就不需要再碰這些：

### 1. 建立 GitHub OAuth App

到 GitHub → Settings → Developer settings → [OAuth Apps](https://github.com/settings/developers) → New OAuth App，填：

- **Application name**：隨意，例如「dtdatacenter CMS」
- **Homepage URL**：網站正式網址，例如 `https://dtdatacenter.pages.dev`（或你們的自訂網域）
- **Authorization callback URL**：`<網站正式網址>/callback`

建立後會拿到一組 **Client ID** 和 **Client Secret**。

### 2. 把 Client ID / Secret 設成 Cloudflare 的密鑰

在專案目錄下執行（會提示輸入密鑰值，不會顯示在畫面上）：

```bash
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
```

這兩個值會被 [src/pages/auth.ts](../src/pages/auth.ts) 和 [src/pages/callback.ts](../src/pages/callback.ts) 用來完成 GitHub OAuth 登入流程（這兩個檔案就是幫 Sveltia CMS 做「登入驗證」的小型 OAuth provider，跑在同一個 Cloudflare Worker 裡，不用另外部署）。

### 3. 把正式網域填進 CMS 設定

打開 [public/admin/config.yml](../public/admin/config.yml)，把 `backend.base_url` 換成網站的正式網址（跟上面 OAuth App 的 Homepage URL 一致），例如：

```yaml
backend:
  name: github
  repo: dtjoychurch/dtdatacenter
  branch: main
  base_url: https://dtdatacenter.pages.dev
  auth_endpoint: auth
```

### 4. 讓同工有 repo 寫入權限

Sveltia CMS 用同工自己的 GitHub 帳號登入、透過 GitHub API 寫入這個 repo，所以每位要編輯內容的同工都需要：

1. 有自己的 GitHub 帳號
2. 被加進這個 repo 的 Collaborators（Settings → Collaborators），或所在的 GitHub organization/team 有這個 repo 的寫入權限

### 5.（可選）本機測試登入流程

複製 `.dev.vars.example` 成 `.dev.vars`，填入同一組 Client ID/Secret（這個檔案已加進 `.gitignore`，不會被 commit），然後 `npm run dev` 並開啟 `http://localhost:4321/admin`。GitHub OAuth callback 網址需要能連到你本機測試的網址，通常本機測試建議直接用 GitHub OAuth App 的 callback 設成 `http://localhost:4321/callback`，或另外建一個測試用的 OAuth App。

## 日常使用（同工視角）

1. 打開 `https://<正式網址>/admin`
2. 用 GitHub 帳號登入（第一次會跳出 GitHub 授權畫面）
3. 左側選單選內容類型（例如「門徒概要」「部落格」），選一篇或按「New」新增
4. 編輯完按「Save」，內容就會變成一個 commit 推上 GitHub，網站會自動重新部署

## 內容遷移現況與頁面結構

`門徒概要` 15 個特質的文章／查經全文（約 177 篇）已經從原網站 zh.d-a-n.net 搬過來，用程式批次抓取＋轉成 Markdown，所以格式可能有些小地方需要同工看過潤飾（例如原網站本身內容就有的錯字/重複段落，是照搬過來的，不是搬移過程壞掉）。之後同工可以直接在 `/admin` 後台編輯內文微調。

**信息工具（講道錄音）沒有搬**——原本有 18 篇帶 MP3 音檔連結的信息稿，已依需求整批拿掉，不在網站上顯示。

**PDF 下載檔都已經下載下來，放在本站，不連回原網站**：172 個 PDF（共約 61MB）存在 [public/downloads/disciple-profile/](../public/downloads/disciple-profile/)，依特質分資料夾，每篇文章的 `pdfs` 欄位存的是本站網址（例如 `/downloads/disciple-profile/01-jesus-the-centre/01_xxx.pdf`），不會再連到 zh.d-a-n.net。

頁面結構照原網站的方式拆開，不是全部塞在一頁：

```
src/content/disciple-profile/
  -index.md                 → /disciple-profile（15 點總覽）
  01-jesus-the-centre/
    -index.md                → /disciple-profile/01-jesus-the-centre（該點頁面，手風琴列出兩類資源）
    article-24-xxx.md        → /disciple-profile/01-jesus-the-centre/article-24-xxx（單篇文章全文＋PDF 下載）
    bible-study-22-xxx.md    → ...（單篇查經全文＋PDF 下載）
  02-regular-intake/
    ...（同上，每個特質一個資料夾）

public/downloads/disciple-profile/
  01-jesus-the-centre/
    01_七分鐘與神獨處.pdf
    ...
```

每個特質頁面（例如 `/disciple-profile/01-jesus-the-centre`）用手風琴摺疊「文章工具／查經工具」兩個區塊，點開才看到該類別底下的文章標題清單，點標題才進到該篇文章的獨立頁面——跟原網站的瀏覽方式一致。原網站文章內的分頁（第1頁/第2頁/下載…）沒有照原樣做分頁 UI，直接把內容接續呈現成一頁，這是刻意簡化的部分。

書籍工具（生命成長旅程指引）因為是掃描書頁圖庫，沒有搬圖片，只搬了簡介文字＋連回原網站的連結，放在 `/disciple-profile` 總覽頁下方。

CMS 後台的「門徒概要」是一個巢狀 collection（`nested: {depth: 100}`），同一張表單同時給「特質總覽頁」跟「單篇文章」用，欄位都設非必填，編輯時忽略跟該頁面無關的欄位即可（詳見 `public/admin/config.yml` 裡的註解）。

## 已隱藏的示範內容

範本原本內建的 Blog、Docs、Poetry、Recipes、Index Cards、Authors、Portfolio 是展示用的假資料（哲學部落格文章、奇幻世界觀文件、詩詞、食譜、作者簡介、作品集），跟教會網站無關，已經從導覽選單和搜尋結果中拿掉。**沒有刪除**，程式碼和內容檔案都還在（`src/content/blog`、`src/content/docs`、`src/content/poetry`、`src/content/recipes`、`src/content/authors`、`src/pages/index-cards.astro`、`src/pages/portfolio.astro` 等），CMS 後台的編輯區塊也先拿掉了。之後如果要重新啟用、或想把某個 collection 改造成教會實際會用的東西（例如把 Blog 改成「教會消息」），跟我說一聲即可。

新增/修改內容集合結構時記得同步更新：

- [src/content.config.ts](../src/content.config.ts)（schema 定義）
- [src/types/index.d.ts](../src/types/index.d.ts)（TypeScript 型別）
- [public/admin/config.yml](../public/admin/config.yml)（CMS 表單欄位）
