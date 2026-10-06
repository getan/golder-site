# golder 官网（golder-site）设计

> 状态：Accepted · 2026-10-05 · 讨论入口：[getan/golder](https://github.com/getan/golder)

## Abstract / 摘要

给 [golder](https://github.com/getan/golder) 建一个独立的中英双语官网，
部署在 Cloudflare 免费子域 **golder-cli.pages.dev**，边际成本 $0。
**最重要的承诺：这是一个只读主仓库的独立项目——站点任何改动都不需要动 golder 代码，
换域名（自有域名）也不需要改页面。**

## Background / 背景与动机

golder 的传播入口目前只有 GitHub README：没有独立的"门面"，安装命令指向
`raw.githubusercontent.com`（大陆网络时常拉不动），也没有地方放一段真实演示。
对外推广时缺少一个"发一条链接就能让人看懂"的地址。

## Design / 设计

### 边界（与主仓库的关系）

| 事项 | 归属 |
|---|---|
| 深度文档、CHANGELOG | 主仓库，站点只放 6 行快速上手 + 外链 |
| 文案/组件/部署 | 本站，独立仓库 `getan/golder-site` |
| 反向依赖 | 唯一：给主仓库 README 加一行官网链接（一个 PR） |

### 架构

```
访问者 → Cloudflare Edge (golder-cli.pages.dev)
          ├── 静态资产：Astro 构建产物（双语首页、404、favicon、_headers）
          └── [M2 计划] Pages Functions：/install.sh 镜像、/api/latest 版本接口

构建：GitHub Actions（npm ci → astro build → wrangler pages deploy）
```

### 技术选择

- **Astro 静态站**：内容以文案为主，构建期渲染足够；零客户端框架。
- **零第三方运行时依赖**：系统字体栈（CJK 不加载 webfont）、内联 SVG 图标、
  不引统计脚本——首屏不依赖任何海外 CDN，对大陆访客更友好。
- **GitHub Actions + `wrangler pages deploy`（Direct Upload）**，不用 Cloudflare
  git 集成：构建与发布完全在 GitHub 侧，换仓库/换账号零影响；
  CI 里有一条断言：部署结果必须恰好落在 `golder-cli.pages.dev` 上（防撞名静默加前缀）。
- **i18n 用目录路由**（`/` 中文、`/en/` 英文），不引框架级 i18n：两页 + 一个
  `content.ts` 文案表，改文案只改一个文件。

## Rationale / 理由与取舍

- **选 Pages 而不是官方推荐的 Workers Static Assets**：免费 Workers 的地址形态是
  `<worker>.<账号>.workers.dev`，大陆全量被墙且名字冗长；pages.dev 相对可达、可读。
  代价诚实说：Pages 已冻结新功能（官方推荐新项目走 Workers），但我们只需要静态 +
  将来两个小接口（Pages Functions 就是 Workers 运行时），且迁移路径畅通
  （同一份 dist + 十几行配置即可搬走）。**被放弃的方案**：Workers Static Assets
  （地址不可用）、Cloudflare git 集成（构建被平台锁定）、Next.js（为静态站引入 SSR 是杀鸡用牛刀）。
- **中文默认**：与主仓库 README 的语言权重一致；英文站 `/en/` 用 hreflang 互指。
- **不做对比攻击表**（vs 同类工具）：事实易过时且引战，改用"适合谁"的中性表述。
- **演示先放"示意终端"而非录制视频**：先把骨架与文案跑通；真机录制（VHS）放进 M1，
  避免 M0 被录屏工具链拖住。

## Compatibility / 兼容性

站点与主仓库没有编译期耦合，属纯增量；主仓库唯一的改动是 README 加链接（可回退）。

## Implementation / 实现与过渡

| 里程碑 | 内容 | 状态 |
|---|---|---|
| M0 | 独立仓库、Astro 双语骨架、Actions 部署管线、占名 | 本次完成 |
| M1 | VHS 录制真实 TUI 演示（28s，2× 快放）替换示意终端；海报兼作 OG 分享图；`scripts/record-demo.sh` 一键重录 | 已完成 |
| M2 | `/install.sh` 镜像（缓解 raw.githubusercontent 不稳）；`/api/latest` 版本角标；主仓库 README 加链接 | 待办 |
| P2 | `/dl/*` Release 二进制中转（需盯 100k 请求/天额度） | 未排期 |

### M1 落地细节（2026-10-06）

- 演示视频是**真实录制**：VHS 驱动终端跑完整会话（红测试 → 模型自主修复 → 全绿），
  非合成动画；`fixture/slugkit` 的 bug 同时覆盖 read / bash / apply_patch 三类工具调用。
- 首页 `<video>`：WebM（VP9，658 KB）优先、MP4（H.264，924 KB）兜底，
  `autoplay muted loop playsinline` + `poster.jpg`；OG/Twitter 卡直接复用海报帧。
- 录制脚本进仓库（`scripts/record-demo.sh` + `demo.tape` + fixture），TUI 改版后可一键重录；
  脚本内置隔离纪律：`GOLDER_HOME` 指向临时目录，录后需人工过帧 + 敏感词扫描。

## Risks / 风险

- **大陆裸连不稳**：免费子域在部分运营商被墙/超时。缓解：受众是开发者（多有代理）、
  页面零海外依赖、仓库/Releases 始终是备选入口；根治 = 绑自有域名（改两处配置）。
- **撞名**：pages.dev 名字全局唯一且建后不可改；已占名成功，且 CI 有断言防回归。
- **文案 drift**：站点不复刻文档，只放快速上手 + 外链，深度内容唯一来源是主仓库。
