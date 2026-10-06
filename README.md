# golder-site

[golder](https://github.com/getan/golder) 的官网 —— **独立项目**，部署在 Cloudflare Pages：
**<https://golder-cli.pages.dev>**（中文默认，`/en/` 英文）。

## 与主仓库的边界

本站只读取 GitHub Releases / 仓库链接，不回改 golder 代码；深度文档永远留在
[getan/golder](https://github.com/getan/golder)，这里只做「门面 + 上手」。
详见 [DESIGN.md](./DESIGN.md)。

## 技术栈

- [Astro](https://astro.build) 静态站，零第三方运行时依赖、无 webfont（大陆访问不依赖海外字体服务）
- 部署：GitHub Actions + `wrangler pages deploy`（Direct Upload，不用 Cloudflare 的 git 集成）

## 开发

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # 产物在 dist/
npm run preview   # 本地预览构建产物
```

## 部署

推送到 `main` 自动发布生产；开 PR 自动发布预览（`<branch>.golder-cli.pages.dev`）。
手动发布（需要本机 `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID`）：

```bash
npm run deploy
```

### 首次配置（一次性）

在 GitHub 仓库 Secrets 里配置两个值（Settings → Secrets and variables → Actions）：

| Secret | 说明 |
|---|---|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token，权限仅需 **Account → Cloudflare Pages → Edit** |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 账号 ID（Dashboard 的 Workers & Pages 总览页右栏） |

## 文案与域名

- 全部文案（中英）集中在 [`src/content.ts`](./src/content.ts)，改文案只改这一个文件。
- 域名出现在两处：`astro.config.mjs` 的 `site` 和 `src/content.ts` 的 `SITE.url`；
  将来绑定自有域名时改这两处 + Cloudflare 后台加自定义域即可，页面代码不用动。

## 里程碑（见 DESIGN.md）

- [x] M1：真实 TUI 演示视频（VHS 录制）替换示意终端；海报兼作 OG 分享图
- [x] M2：`/install.sh` 镜像（CI 从主仓库同步）、`/api/latest` 版本接口 + 页头版本角标
- [ ] M2：主仓库 README 加官网链接

## 演示视频

首屏那段 28 秒的视频是**真实录制**的 golder 会话（go test 红 → 模型自主修复 → 全绿）。
源码更新后想刷新它：

```bash
brew install vhs
scripts/record-demo.sh ../golder
```

详见 [scripts/README.md](./scripts/README.md)（含隐私红线检查清单）。

## License

[MIT](./LICENSE)
