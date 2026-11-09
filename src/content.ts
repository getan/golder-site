// 站点全部文案集中在这里：改文案只改本文件。
// 结构上 zh / en 必须保持同样的键，页面组件按 lang 取用。

export type Lang = 'zh' | 'en';

export const SITE = {
  url: 'https://golder-cli.pages.dev',
  repo: 'https://github.com/getan/golder',
  releases: 'https://github.com/getan/golder/releases',
  issues: 'https://github.com/getan/golder/issues',
  changelog: 'https://github.com/getan/golder/blob/master/CHANGELOG.md',
  siteRepo: 'https://github.com/getan/golder-site',
  // install.sh 由 CI 从主仓库镜像到本站（同一份源码，脚本自带 sha256 校验）；
  // 站点域名对大陆网络更友好，raw.githubusercontent.com 时常不可达。
  installCmd: 'curl -fsSL https://golder-cli.pages.dev/install.sh | sh',
};

export interface Feature {
  icon: string;
  title: string;
  body: string;
}

export interface Step {
  title: string;
  body: string;
  codes: string[];
}

export interface FaqItem {
  q: string;
  a: string; // 允许内联 HTML（链接）
}

const zh = {
  meta: {
    title: 'golder — 桌面与终端的 AI 编码助手',
    description:
      '用 Go 编写的开源 AI 编码助手：原生桌面应用、终端工作区和 CLI 共享 Agent 核心，连接模型、文件、命令和浏览器，支持审批与沙箱。',
  },
  nav: {
    demo: '演示',
    features: '特性',
    highlights: '亮点',
    architecture: '架构',
    quickstart: '上手',
    faq: 'FAQ',
    github: 'GitHub',
    switch: 'English',
  },
  hero: {
    eyebrow: 'golder-cli.pages.dev · Go · MIT',
    title: '桌面与终端的 AI 编码助手',
    lead:
      'Golder 是用 Go 编写的开源 AI 编码助手。用原生 GUI 管理项目、对话、工具和审批；用终端工作区并排运行 agent、shell 和浏览器；也可以用 CLI、REPL 或无头模式接入已有工作流。',
    ctaPrimary: '三步上手',
    ctaSecondary: '在 GitHub 上看源码',
    ctaDesktop: '下载桌面版',
    installHint: '这是 CLI 安装命令；桌面版请点击上方按钮选择。浏览器功能可使用本机安装的 Chrome 或 Chromium。',
    guiAlt: 'Golder GUI 实际界面：项目与会话导航、Agent 对话和应用内架构图预览',
    guiCaption: '桌面版实际界面：项目、会话、Agent 对话与 SVG 预览。',
    videoTitle: '终端工作区 — 真实会话（空闲段已掐掉）',
    videoCaption:
      '真实录制：左边 agent 自己读码、打补丁，右边 shell 里 go test 从红到绿；中间的等待已剪掉（37 秒）',
  },
  highlights: {
    title: '为什么是 golder',
    sub: '同一套 Agent 核心，适合桌面、终端与自动化。',
    items: [
      {
        icon: 'box',
        title: '原生桌面工作台',
        body:
          'Golder GUI 用 MyGo 原生界面呈现项目、会话、流式对话、diff 卡片和审批，配有文件与变更视图、浏览器界面和可选终端。它直接复用 Agent 核心，不是把 TUI 包在窗口里。',
      },
      {
        icon: 'box',
        title: '自带终端工作区',
        body:
          'golder workspace 一个面板里跑 agent、shell 和浏览器（macOS / Linux 不必另装 tuios 或 kitty-browse）：左边 agent 改代码，右边 shell 跑测试，焦点即输入；浏览器由 agent 自己通过 browser 工具的 open 动作起在同一工作区（profile 与 socket 都在 .golder/browser/），再通过 snapshot/click/fill/wait/console/network 操作页面；预设（debug-fullstack、data-analysis、review）一次起好后端、前端和浏览器，snapshot 把所有 pane 的上下文一次交给模型。',
      },
      {
        icon: 'globe',
        title: '多 Provider 热切换，会话不绑定厂商',
        body:
          '/provider 随时换网关，/resume 在当前 provider 上继续同一份上下文；内置 19 个会话网关，覆盖 OpenAI Chat / Responses、Anthropic Messages、Gemini 四种线上协议，也可指向任意兼容端点。',
      },
      {
        icon: 'shield',
        title: '轻量 agent + 真正的安全边界',
        body:
          '适用的工具调用受到权限模式、审批、路径授权和 OS 沙箱（sandbox-exec / bubblewrap）约束。默认读限工作区、写限项目与临时目录，工具网络按次授权；实际边界取决于平台和配置。',
      },
      {
        icon: 'terminal',
        title: '比 codex-cli 更容易定制',
        body:
          '纯 Go，单语言、单二进制，没有 Node/Python 运行时；加一个工具、一个 provider 或一条审批规则，都在同一个 go build 里完成。',
      },
      {
        icon: 'gauge',
        title: '轻量 CLI，桌面版独立安装',
        body: 'CLI 为 Go 编译的独立程序；GUI 单独发布，按需提供图形界面、终端和浏览器。',
      },
      {
        icon: 'branch',
        title: '扩展不必改核心：CLI / MCP / Skills',
        body:
          '/extensions 一处管理声明式 CLI 工具、标准 MCP 服务（stdio/http，tools/prompts/resources）、旧 RPC 插件和 Skills；来源要显式信任，首次连接先看清执行程序、manifest/URL 与网络上限。外部工具的每次调用仍走同一审批门，扩展不必改核心。',
      },
    ] as Feature[],
  },
  features: {
    title: '更多特性',
    sub: '安全边界、长任务、会话管理都是内建的——这些才是每天用得到的部分。',
    items: [
      {
        icon: 'terminal',
        title: '桌面、终端与无头模式',
        body:
          '原生 GUI 与 CLI 分别构建，共享 Agent 核心能力。终端可选分屏 workspace、全屏 TUI 或行式 REPL；无头 -p 和 stream-json 适合脚本与 CI。',
      },
      {
        icon: 'terminal',
        title: '桌面窗口与浏览器',
        body:
          '浏览器界面使用本机安装的 Chrome 或 Chromium；其他 Chromium 内核浏览器的兼容性因产品和平台而异。Computer Use 仍在开发，可在用户选定窗口后尝试观察和操作；不同系统有权限与能力限制，Linux / Windows 后端仍需真实桌面验收。',
      },
      {
        icon: 'shield',
        title: '可配置权限与风险评审',
        body:
          '四档权限：只读 / 每次询问 / 自动 / 完全放行。需要评审的调用会结合权限模式、风险规则和模型判断处理；审批、沙箱及路径授权的具体行为以当前模式和环境为准。',
      },
      {
        icon: 'box',
        title: '操作系统级沙箱',
        body:
          'macOS 用 sandbox-exec、Linux 用 bubblewrap：受沙箱约束的调用默认按白名单读取、写限项目与临时目录，工具网络默认关闭且按次授权。批准的越界或沙箱外执行依权限模式单独处理；Windows 等平台的支持范围不同。',
      },
      {
        icon: 'key',
        title: '凭据在发给模型前脱敏',
        body:
          '工具输出、prompt、压缩摘要、记忆与 session 落盘前统一扫描；覆盖 AWS/GCP/Azure/GitHub/GitLab/Slack/Stripe/OpenAI/Anthropic/JWT/PEM/DB URL，支持 off / observe / redact / block 四档，审计只记规则名与 hash。写文件时才还原占位符。',
      },
      {
        icon: 'gauge',
        title: '长任务不掉线',
        body:
          '/compact 压缩、上下文预算工具、/goal 自主目标循环、持久记忆与 /dream 整理——跑几小时的大活有配套的兜底；子 Agent 只在你明确要求时派发，fresh 独立上下文或 fork 继承父对话，连接中途断掉时从断点续写，不丢整轮。',
      },
      {
        icon: 'branch',
        title: '会话是资产',
        body:
          '/resume 历史会话、/fork 从任意消息分叉、/tree 浏览分支树、/rewind 把文件与对话一起回滚、/export 往返存档。会话不绑厂商：换网关后用 /resume 在当前 provider 上继续同一份上下文。',
      },
      {
        icon: 'box',
        title: '工作区会话按名字管理',
        body:
          'golder workspace 打开全局 default，-s coding 从任何目录进入另一套；new / attach / list / status / stop / rm 都按名字。每个名字一个独立 daemon，带着自己的配置、状态和日志；连接、查询、停止不要求原项目目录还在，旧的项目级会话仍可用 legacy 选择器连接。',
      },
      {
        icon: 'shield',
        title: '读取越界要先问过你',
        body:
          '读取类工具默认只读工作区；越界会先弹窗问——只读这一次、本会话允许该目录，或记住（写进授权表，/boundary 可查）。没人可问时（无头、子 Agent）失败关闭。完全放行关掉的是审查与沙箱，不是知情同意。',
      },
      {
        icon: 'terminal',
        title: '跑在 tuios / herdr 里就是一个 agent',
        body:
          '在 tuios 窗口或 herdr pane 里启动，golder 自己上报状态：rail 上出现工作 / 等你 / 完成，审批与提问进 Inbox，daemon 重启后带着 golder --resume 回到原会话。两个宿主都不用改；tuios 用 golder host-compat install 写一份 harness manifest，herdr 不需要。',
      },
      {
        icon: 'globe',
        title: '网络按次授权，代理可选择',
        body:
          '20 个内置网关，覆盖 OpenAI Chat / OpenAI Responses / Anthropic Messages / Gemini 四种线上协议，也可指向任意 OpenAI 兼容端点；网络默认关闭且按次授权——需要联网的调用在参数里声明，auto 下随评审通过的调用一起放行，ask 下与外部路径、沙箱外运行合并进同一个弹窗；没有持久化网络白名单，也没有单独的 /network 命令。/proxy 可分别选择 provider，也能用 browser on 让 Chromium pane 走同一个代理；未选中的直连、不继承 shell 的 HTTP_PROXY。',
      },
    ] as Feature[],
  },
  architecture: {
    title: '从界面到 Agent：Golder 如何工作',
    sub: '一张图看清桌面、终端、模型、工具和权限边界之间的关系。',
    alt: 'Golder 系统架构图：GUI、终端与 CLI 连接 Agent 运行时、模型、工具、会话和安全边界',
    caption: '架构概览为简化示意；具体权限和平台支持以实际工具及配置为准。',
    items: [
      { title: '01 / 选择入口', body: '原生 GUI 直接使用共享 Agent 核心；终端 TUI / REPL、CLI 和 workspace 面向命令行与自动化。Workspace 的 daemon 与 agent pane 是独立进程。' },
      { title: '02 / Agent 循环', body: '运行时组装上下文、调用所选模型、执行工具并继续对话；会话、压缩与记忆帮助任务延续。' },
      { title: '03 / 能力与边界', body: '文件、Shell、Web、MCP 和 Skills 连接本地与外部环境；适用调用经权限、审批、路径授权和沙箱处理，再访问项目、浏览器或用户选定的窗口。' },
    ],
    link: '查看主仓库文档',
  },
  quickstart: {
    title: '三步上手',
    sub: '桌面版和 CLI 分开安装；下面是两种入口。',
    desktopTitle: '先试试 Golder GUI',
    desktopBody: '选择你的电脑版本下载安装。启动后选择项目，在设置中配置模型与凭证，即可通过桌面界面开始对话。',
    desktopAction: '下载桌面版',
    macNoticeTitle: 'macOS 首次打开提示',
    macNotice: '新版 macOS GUI 已使用 Developer ID 签名并经过 Apple 公证。首次打开时可能要求确认打开从互联网下载的应用；辅助功能和屏幕录制等系统权限仍需按需授权。',
    macNoticeLink: '查看 macOS 安装说明',
    steps: [
      {
        title: '安装 CLI',
        body: 'CLI 在 macOS 可用 Homebrew、Linux 可用一键脚本；Windows 从 Releases 下载 CLI 的 .zip。桌面版需单独下载。',
        codes: ['brew install getan/tap/golder', SITE.installCmd],
      },
      {
        title: '配置凭证',
        body: '默认网关 OpenCode 只需一个 API Key；也可指向任意 OpenAI 兼容端点，或用本地 Ollama。',
        codes: ['export OPENCODE_API_KEY=...'],
      },
      {
        title: '在终端打开工作区',
        body: 'golder workspace 打开全局 default：第一格是 agent，Ctrl+b c 开 shell，浏览器由 agent 按需自己打开。Ctrl+b d 只断开客户端，daemon 和 pane 继续跑；golder workspace -s coding 从任何目录进入另一套命名会话，list / attach / stop 都按名字。已经习惯 tuios / herdr / tmux / zellij / screen 的话，直接在它的 pane 里跑 golder 单 agent 模式。',
        codes: [
          'golder workspace',
          'golder workspace -s coding   # 另一套命名会话',
          'golder   # 已有复用器时：单个 agent',
        ],
      },
    ] as Step[],
  },
  faq: {
    title: '常见问题',
    sub: '还有别的问题？到 GitHub 提 issue。',
    items: [
      {
        q: 'macOS GUI 经过签名和公证了吗？',
        a: '新版 macOS GUI 已使用 Developer ID 签名并经过 Apple 公证；旧版可能尚未公证。首次打开时，系统仍可能要求确认打开从互联网下载的应用；辅助功能、屏幕录制等系统授权也可能出现。请只从官方 Releases 下载，遇到其他安全告警时先确认具体原因。',
      },
      {
        q: '需要 Node 或别的运行时吗？',
        a: '运行 Golder 不需要 Node 或 Python；GUI 和 CLI 是分别发布的程序。从源码构建需要 Go，浏览器功能可使用本机 Chrome 或 Chromium，Linux GUI 还需要相应的系统图形库。',
      },
      {
        q: '我的代码会被上传到哪里？',
        a: '对话和用于完成任务的上下文会发送给你配置的模型服务；使用浏览器、网络工具或 MCP 扩展时，这些服务也可能接收相应请求。会话、记忆和凭据保存在本地，具体发送内容取决于你选择的模型、工具和授权。',
      },
      {
        q: '支持哪些模型？',
        a: '内置 20 个网关（19 个会话网关 + 审批用的决策模型 typesafe，它不接会话）。会话不绑厂商：/provider 换网关后用 /resume 继续同一份上下文，/provider default <名称> 把常用网关设为新会话默认；推理档位 off 到 max，也可以指向本地 Ollama。',
      },
      {
        q: '安全吗？它会乱改我的文件吗？',
        a: '三道门：静态硬拒（sudo、rm -rf /、写 ~/.ssh 与凭据路径直接拒绝，凭据永远不可授权）→ 逐调用审查（auto 档每次改动型调用都过决策模型，拿不准升级给会话模型：低风险放行、需隔离的进沙箱、高危拒绝，各给一行理由）→ OS 沙箱（读白名单、写限项目与临时目录；网络默认关闭且按次授权，随同一次能力评审放行——没有持久化网络白名单，也没有 /network 命令）。想先观察可以切到 read-only。',
      },
      {
        q: '国内网络能用吗？',
        a: 'golder 支持按 provider 配代理，国内模型直连；内置 Chromium pane 也能用 /proxy browser on 走同一个代理（下次打开 browser pane 生效）。注意本站是 Cloudflare 免费子域，少数网络下可能打不开，仓库和 Releases 始终是备选入口。',
      },
      {
        q: '和 pi 是什么关系？',
        a: 'golder 是 pi 的 Go 重实现，此后独立演进，MIT 许可。',
      },
      {
        q: '怎么更新？',
        a: '跑 golder update 即自更新；重跑安装脚本也可以。',
      },
    ] as FaqItem[],
  },
  footer: {
    license: 'MIT License',
    siteSource: '本站源码',
    mainRepo: '主仓库',
    issues: '问题反馈',
    releases: '版本发布',
  },
  notFound: {
    title: '404 — 页面不存在',
    body: '这个地址没有内容。回首页，或者去 GitHub 看源码。',
    home: '回首页',
  },
};

const en = {
  meta: {
    title: 'golder — an AI coding agent for desktop and terminal',
    description:
      'An open-source AI coding agent in Go: a native desktop app, terminal workspace and CLI share an Agent core for models, files, commands and the browser, with configurable approvals and sandboxing.',
  },
  nav: {
    demo: 'Demo',
    features: 'Features',
    highlights: 'Highlights',
    architecture: 'Architecture',
    quickstart: 'Quickstart',
    faq: 'FAQ',
    github: 'GitHub',
    switch: '简体中文',
  },
  hero: {
    eyebrow: 'golder-cli.pages.dev · Go · MIT',
    title: 'An AI coding agent for desktop and terminal',
    lead:
      'Golder is an open-source AI coding agent written in Go. Manage projects, conversations, tools and approvals in a native GUI; run the agent, a shell and a browser side by side in a terminal workspace; or use the CLI, REPL and headless mode in your existing workflow.',
    ctaPrimary: 'Get started',
    ctaSecondary: 'Source on GitHub',
    ctaDesktop: 'Download desktop app',
    installHint: 'This command installs the CLI; use the button above to choose the desktop app. Browser features can use an installed Chrome or Chromium.',
    guiAlt: 'Golder GUI showing project and chat navigation, an Agent conversation and an architecture diagram preview',
    guiCaption: 'Golder GUI: projects, sessions, an Agent conversation and an in-app SVG preview.',
    videoTitle: 'Terminal workspace — a real session (idle time trimmed)',
    videoCaption:
      'Recorded for real: the agent reads and patches on the left while go test goes red to green in a shell pane on the right; the waits are trimmed (37s)',
  },
  highlights: {
    title: 'Why golder',
    sub: 'A shared Agent core for desktop, terminal and automation.',
    items: [
      {
        icon: 'box',
        title: 'A native desktop workspace',
        body:
          'Golder GUI uses MyGo native UI for projects, sessions, streamed conversations, diff cards and approvals, with file and change views, a browser surface and an optional terminal. It reuses the Agent core rather than wrapping a TUI.',
      },
      {
        icon: 'box',
        title: 'A built-in terminal workspace',
        body:
          'golder workspace runs the agent, a shell and the browser in one panel (no separate tuios or kitty-browse install on macOS / Linux): the agent patches on the left while the shell runs tests on the right, and focus is input. The agent opens the browser itself through the browser tool’s open action (profile and socket under .golder/browser/), then drives pages with snapshot/click/fill/wait/console/network; presets (debug-fullstack, data-analysis, review) start backend, frontend and browser together, and snapshot hands the model every pane’s context at once.',
      },
      {
        icon: 'globe',
        title: 'Hot-switch providers; the session outlives them',
        body:
          '/provider switches gateways at any time and /resume continues the same context on the new provider; 19 built-in conversation gateways cover OpenAI Chat / Responses, Anthropic Messages and Gemini, plus any compatible endpoint.',
      },
      {
        icon: 'shield',
        title: 'Lightweight like pi, with a real security boundary',
        body:
          'Applicable tool calls are governed by permission modes, approvals, path grants and OS sandboxing (sandbox-exec / bubblewrap). Default sandboxed reads and writes are scoped, and tool network access is granted per call; actual boundaries depend on platform and configuration.',
      },
      {
        icon: 'terminal',
        title: 'Easier to customize than codex-cli',
        body:
          'Pure Go: one language, one binary, no Node/Python runtime. A new tool, provider or approval rule is one go build away.',
      },
      {
        icon: 'gauge',
        title: 'A lightweight CLI; a separate desktop app',
        body: 'The CLI is a Go-compiled program. The separately distributed GUI adds a graphical workspace, terminal and browser surface as needed.',
      },
      {
        icon: 'branch',
        title: 'Extend without touching the core: CLI / MCP / Skills',
        body:
          '/extensions manages declarative CLI tools, standard MCP services (stdio/http with tools/prompts/resources), legacy RPC plugins and Skills in one place. A source must be explicitly trusted, and the first connection shows its executable, manifest/URL and network ceiling. Every external tool call still goes through the same approval gate, so extensions never require changing the core.',
      },
    ] as Feature[],
  },
  features: {
    title: 'More features',
    sub: 'Safety boundaries, long tasks, and session management are built in — the parts you actually use every day.',
    items: [
      {
        icon: 'terminal',
        title: 'Desktop, terminal and headless',
        body:
          'The native GUI and CLI are separate builds sharing Agent capabilities. Choose a split-pane workspace, full-screen TUI or line REPL in the terminal; headless -p and stream-json support scripts and CI.',
      },
      {
        icon: 'terminal',
        title: 'Desktop windows and browser',
        body:
          'The browser surface uses a locally installed Chrome or Chromium; compatibility with other Chromium-based browsers varies by product and platform. Computer Use is under development and can attempt to observe and operate a user-selected window; permissions and capabilities vary by platform, and Linux / Windows backends still need real-desktop validation.',
      },
      {
        icon: 'shield',
        title: 'Configurable permissions and risk review',
        body:
          'Four permission modes: read-only / ask / auto / full-access. Calls that need review are handled using the selected mode, risk rules and model judgment; approvals, sandboxing and path grants depend on the mode and environment.',
      },
      {
        icon: 'box',
        title: 'OS-level sandboxing',
        body:
          'Sandboxed calls use sandbox-exec on macOS or bubblewrap on Linux: reads follow an allow-list, writes are scoped to the project and temp directories, and tool network access is off by default and granted per call. Outside paths and execution outside the sandbox are handled separately according to the permission mode; support varies on other platforms.',
      },
      {
        icon: 'key',
        title: 'Secrets are redacted before the model sees them',
        body:
          'Tool output, prompts, compaction summaries, memory and session files are scanned first; AWS/GCP/Azure/GitHub/GitLab/Slack/Stripe/OpenAI/Anthropic/JWT/PEM/DB URL rules, off / observe / redact / block modes, and an audit log with rule names and hashes only. Placeholders are restored only for file writes.',
      },
      {
        icon: 'gauge',
        title: 'Built for long tasks',
        body:
          '/compact summarization, context-budget tools, autonomous /goal loops, persistent memory and /dream consolidation. Sub-agents are dispatched only when you explicitly ask for them — fresh for an independent context or fork to inherit the conversation — and a stream cut mid-answer continues from where it stopped instead of losing the turn.',
      },
      {
        icon: 'branch',
        title: 'Sessions are assets',
        body:
          '/resume past sessions, /fork from any message, /tree to browse branches, /rewind to roll back files and conversation together, /export for round-trip archives. Sessions are not tied to a vendor: switch gateways and /resume continues the same context on the current provider.',
      },
      {
        icon: 'box',
        title: 'Workspace sessions have names and independent daemons',
        body:
          'golder workspace opens the global default, and -s coding enters another set from any directory; new / attach / list / status / stop / rm all address a name. Each name is an independent daemon with its own config, state and logs; attaching, inspecting or stopping never requires the original project directory, and legacy project-scoped sessions remain reachable through their qualified selector.',
      },
      {
        icon: 'shield',
        title: 'Reads outside the workspace ask first',
        body:
          'The read tools stay inside the workspace until you say otherwise — the dialog offers just this read, this session for that directory, or remembered (written to the authorization table, shown by /boundary). With nobody to ask (headless, a sub-agent) it fails closed. Full-access turns off review, not consent.',
      },
      {
        icon: 'terminal',
        title: 'A first-class agent in tuios / herdr',
        body:
          'Start it in a tuios window or a herdr pane and golder reports its own state: it shows up on the rail (working / waiting on you / done), approvals land in the Inbox, and a daemon restart brings the conversation back with golder --resume. Neither host changes; tuios gets one harness manifest from golder host-compat install, and herdr needs nothing.',
      },
      {
        icon: 'globe',
        title: 'Network is per call; proxies are selective',
        body:
          '20 built-in gateways across four wire formats — OpenAI Chat, OpenAI Responses, Anthropic Messages, Gemini — plus any OpenAI-compatible endpoint. The network is off by default and granted per call: a call declares what it needs, auto grants it with the reviewer’s approval, and ask folds it into the same dialog as outside paths and sandbox escapes. There is no persistent network allow-list and no separate /network command. /proxy selects providers independently and can route Chromium panes with browser on; unselected routes go direct and ignore the shell’s HTTP_PROXY.',
      },
    ] as Feature[],
  },
  architecture: {
    title: 'From interface to Agent: how Golder works',
    sub: 'A map of the desktop, terminal, models, tools and permission boundaries.',
    alt: 'Golder architecture diagram: GUI, terminal and CLI connect to the Agent runtime, models, tools, session state and security boundaries',
    caption: 'Diagram labels are in Chinese. This overview is simplified; actual permissions and platform support depend on the tool and configuration.',
    items: [
      { title: '01 / Choose an interface', body: 'The native GUI uses the shared Agent core; the TUI / REPL, CLI and workspace serve terminal and automation workflows. A workspace daemon and its agent panes are separate processes.' },
      { title: '02 / The Agent loop', body: 'The runtime assembles context, calls the selected model, executes tools and continues the conversation. Sessions, compaction and memory help work continue.' },
      { title: '03 / Capabilities and boundaries', body: 'Files, shell, web, MCP and Skills connect local and external resources. Applicable calls pass through permissions, approvals, path grants and sandboxing before reaching a project, browser or user-selected window.' },
    ],
    link: 'Read the project documentation',
  },
  quickstart: {
    title: 'Get started in three steps',
    sub: 'The desktop app and CLI are installed separately. Choose the entry point that fits your work.',
    desktopTitle: 'Try Golder GUI',
    desktopBody: 'Choose the download for your computer. Open a project and configure a model and credential in Settings to start a conversation.',
    desktopAction: 'Download desktop app',
    macNoticeTitle: 'Opening the app on macOS',
    macNotice: 'Recent macOS GUI packages are Developer ID signed and Apple-notarized. The first launch may ask you to confirm an internet download; Accessibility and Screen Recording permissions may still be requested.',
    macNoticeLink: 'Read macOS installation details',
    steps: [
      {
        title: 'Install the CLI',
        body: 'Use Homebrew on macOS or the one-line script on Linux; Windows users can download the CLI .zip from Releases. The desktop app is a separate download.',
        codes: ['brew install getan/tap/golder', SITE.installCmd],
      },
      {
        title: 'Configure a credential',
        body: 'The default gateway (OpenCode) needs a single API key; any OpenAI-compatible endpoint or a local Ollama works too.',
        codes: ['export OPENCODE_API_KEY=...'],
      },
      {
        title: 'Open a terminal workspace',
        body: 'golder workspace opens the global default: the agent in the first pane, Ctrl+b c for a shell, and the agent opens the browser itself when needed. Ctrl+b d detaches; the daemon and its panes keep running. golder workspace -s coding enters another named session from any directory, and list / attach / stop all address a name. Already used to tuios / herdr / tmux / zellij / screen? Run the single-agent golder in its pane instead.',
        codes: [
          'golder workspace',
          'golder workspace -s coding   # another named session',
          'golder   # already in a multiplexer: single agent',
        ],
      },
    ] as Step[],
  },
  faq: {
    title: 'FAQ',
    sub: 'Something else on your mind? Open an issue on GitHub.',
    items: [
      {
        q: 'Is the macOS GUI signed and notarized?',
        a: 'Recent macOS GUI releases are Developer ID signed and Apple-notarized; older versions may not be. On first launch, macOS may ask to confirm opening an app downloaded from the internet. Accessibility and Screen Recording prompts may also appear. Download only from official Releases and check other security alerts on their own merits.',
      },
      {
        q: 'Does it need Node or any runtime?',
        a: 'Running Golder does not require Node or Python. The GUI and CLI are separate downloads; building from source requires Go, browser features can use a locally installed Chrome or Chromium, and the Linux GUI requires system graphics libraries.',
      },
      {
        q: 'Where does my code go?',
        a: 'Conversations and task context are sent to your configured model service. Browser, web and MCP tools may also send requests to the services you use. Sessions, memory and credentials are stored locally; what leaves your machine depends on your chosen models, tools and approvals.',
      },
      {
        q: 'Which models are supported?',
        a: '20 built-in gateways (19 conversation gateways plus the typesafe decision model, which does not serve conversations). Sessions are not tied to a vendor: switch with /provider and keep going with /resume on the new one, and /provider default <name> makes a gateway the default for new sessions. Reasoning levels run from off to max — or point it at a local Ollama.',
      },
      {
        q: 'Is it safe? Will it edit my files behind my back?',
        a: 'Three gates: a static hard-deny (sudo, rm -rf /, writes to ~/.ssh or credential material are refused outright — credentials are never grantable) → a per-call review (in auto every mutating call goes to the decision model, escalating to the session model when unsure: low risk runs, isolatable calls are contained, dangerous ones are denied, each with a one-line rationale) → the OS sandbox (read allow-list, writes limited to the project and temp dirs; the network is off by default and granted per call with the same capability review — there is no persistent network allow-list and no /network command). Switch to read-only to just watch.',
      },
      {
        q: 'Does the site work from mainland China?',
        a: 'golder itself supports per-provider proxies and connects directly to domestic models; its Chromium panes can share the same proxy with /proxy browser on (applied on the next browser launch). This site, however, is a free Cloudflare subdomain and may be unreachable on some networks — the GitHub repo and Releases are always the fallback.',
      },
      {
        q: 'Relation to pi?',
        a: 'golder is a Go re-implementation of pi, evolving independently under MIT.',
      },
      {
        q: 'How do I update?',
        a: 'Run golder update (self-update), or re-run the install script.',
      },
    ] as FaqItem[],
  },
  footer: {
    license: 'MIT License',
    siteSource: 'Site source',
    mainRepo: 'Main repo',
    issues: 'Issues',
    releases: 'Releases',
  },
  notFound: {
    title: '404 — Page not found',
    body: 'Nothing lives at this address. Head back home, or read the source on GitHub.',
    home: 'Back home',
  },
};

export const content = { zh, en };

export function langPath(lang: Lang, path = '/'): string {
  return lang === 'en' ? `/en${path === '/' ? '/' : path}` : path;
}

export function otherLang(lang: Lang): Lang {
  return lang === 'en' ? 'zh' : 'en';
}

/** 从 FAQ 答案里剥掉标签，供 JSON-LD 使用。 */
export function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, '');
}
