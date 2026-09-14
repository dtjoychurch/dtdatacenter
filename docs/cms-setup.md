# CMS 內容管理後台設定 (Sveltia CMS)

同工可以透過 `/admin` 這個網頁後台編輯網站內容，不需要碰 Git 或程式碼。每次儲存，後台會自動在 GitHub repo 建立一個 commit（或依設定建立 PR）。

用的是 [Sveltia CMS](https://github.com/sveltia/sveltia-cms)，一個開源、免費的 Git-based CMS，相容 Decap CMS 的設定格式。它透過 GitHub API 直接讀寫這個 repo 的檔案，本身不需要另外的資料庫或帳號系統。

## 登入方式：個人存取權杖（Personal Access Token）

一開始想用 GitHub OAuth App 串登入，結果卡在 Cloudflare Workers 的部署設定跟邊緣快取問題上排查了很久。後來發現 Sveltia CMS 原生支援更簡單的登入方式，特別適合「一小群同工在用」的情況（見 [官方文件](https://sveltiacms.app/en/docs/backends/github)），改用這個之後完全不需要 OAuth App、不需要 Cloudflare secrets、也不需要任何伺服器端程式碼。

[public/admin/config.yml](../public/admin/config.yml) 裡設定：

```yaml
backend:
  name: github
  repo: dtjoychurch/dtdatacenter
  branch: main
  auth_methods: [token]
```

### 讓同工有 repo 寫入權限

Sveltia CMS 用同工自己的 GitHub 帳號存取這個 repo，所以每位要編輯內容的同工都需要：

1. 有自己的 GitHub 帳號
2. 被加進這個 repo 的 Collaborators（GitHub → 這個 repo → Settings → Collaborators），或所在的 GitHub organization/team 有這個 repo 的寫入權限

### 同工登入步驟

1. 打開 `https://<正式網址>/admin`
2. 按「**Sign In with Token**」
3. 畫面會給一個連到 GitHub 的連結，點下去會直接到「產生新 token」的頁面，需要的權限範圍（scope）已經幫你勾好了
4. 在 GitHub 那邊按「Generate token」，把產生的 token 複製起來
5. 貼回 Sveltia CMS 的登入畫面，完成登入

這組 token 存在同工自己瀏覽器的 local storage，不會外流到我們的伺服器。GitHub token 有效期限依產生時選的設定而定，過期後同工只要重新產生一次貼上即可。

登入後，左側選單選內容類型（例如「門徒概要」），選一篇或按「New」新增，編輯完按「Save」，內容就會變成一個 commit 推上 GitHub，網站會自動重新部署。

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
