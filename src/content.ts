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
    title: 'golder — 终端里的 AI 编码助手',
    description:
      '用 Go 编写的终端 AI 编码助手：读写文件、执行命令、检索代码、抓取网页，在对话中完成从理解需求到改好代码的闭环。单二进制、不锁定厂商，MIT 开源。',
  },
  nav: {
    demo: '演示',
    features: '特性',
    highlights: '亮点',
    quickstart: '上手',
    faq: 'FAQ',
    github: 'GitHub',
    switch: 'English',
  },
  hero: {
    eyebrow: 'golder-cli.pages.dev · Go · MIT',
    title: '终端里的 AI 编码助手',
    lead:
      'golder 用 Go 写成一个单二进制。普通用户默认用 golder workspace：自带分屏终端，agent、shell 和浏览器在同一个面板里，把「理解需求 → 改好代码」跑成闭环；已经有习惯的终端复用器时，直接在它的 pane 里跑单 agent 的 golder。也能无头跑进脚本和 CI。',
    ctaPrimary: '三步上手',
    ctaSecondary: '在 GitHub 上看源码',
    installHint: 'macOS: brew install getan/tap/golder · Linux: 一键脚本 · Windows 从 Releases 下载 zip · 不需要任何运行时',
    videoTitle: 'golder — 真实会话（空闲段已掐掉）',
    videoCaption:
      '真实录制：左边 agent 自己读码、打补丁，右边 shell 里 go test 从红到绿；中间的等待已剪掉（37 秒）',
  },
  highlights: {
    title: '为什么是 golder',
    sub: '装好就能用；真正的差别在这六件事。',
    items: [
      {
        icon: 'box',
        title: '默认用法：自带终端工作区',
        body:
          'golder workspace 一个面板里跑 agent、shell 和浏览器：左边 agent 改代码，右边 shell 跑测试，焦点即输入；browser 通过 kitty-browse 的控制 socket 操作页面（snapshot/click/fill/wait/console/network），预设（debug-fullstack、data-analysis、review）一次起好后端、前端和浏览器，再用 snapshot 把所有 pane 的上下文一次交给模型。',
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
          '和 pi 同一量级的单二进制，但多了逐调用审批门与 OS 沙箱（sandbox-exec / bubblewrap）：读限工作区、写限项目与临时目录、网络默认关闭；密钥和凭据路径读不到。',
      },
      {
        icon: 'terminal',
        title: '比 codex-cli 更容易定制',
        body:
          '纯 Go，单语言、单二进制，没有 Node/Python 运行时；加一个工具、一个 provider 或一条审批规则，都在同一个 go build 里完成。',
      },
      {
        icon: 'gauge',
        title: '常驻内存约 50–100 MB',
        body: '同类里的第一梯队，长时间挂着跑也不占机器。',
      },
      {
        icon: 'branch',
        title: '规划中：MCP 与插件生态',
        body: '把外部工具和数据源接进来，扩展不必改核心。',
      },
    ] as Feature[],
  },
  features: {
    title: '更多特性',
    sub: '安全边界、长任务、会话管理都是内建的——这些才是每天用得到的部分。',
    items: [
      {
        icon: 'terminal',
        title: '单二进制，三种形态',
        body:
          '全屏 TUI、行式 REPL、无头 -p 一套命令完全对齐；--output-format stream-json 逐行 JSON 事件，方便脚本和 CI 消费。',
      },
      {
        icon: 'shield',
        title: '每个改动型调用都过审查，并给一行理由',
        body:
          '四档权限：只读 / 每次询问 / 自动 / 完全放行。auto 档每次改动型调用都先问决策模型（typesafe），拿不准再升级给会话模型——低风险放行、需隔离的进沙箱、高危拒绝，理由用对话语言写在卡片上；没有决策模型凭据时改走本地规则表。',
      },
      {
        icon: 'box',
        title: '操作系统级沙箱',
        body:
          'macOS 用 sandbox-exec、Linux 用 bubblewrap：读白名单（$HOME 里的密钥、凭据、历史一律读不到）、写限项目与临时目录、网络默认关闭且按次授权。效果能从命令完整读出的调用（git push、go test…）不再多套一层沙箱，卡片上标 ·unconfined；其余标 ·sandbox。',
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
          '/compact 压缩、上下文预算工具、/goal 自主目标循环、子 Agent 派发、持久记忆与 /dream 整理——跑几小时的大活有配套的兜底；连接中途断掉时从断点续写，不丢整轮。',
      },
      {
        icon: 'branch',
        title: '会话是资产',
        body:
          '/resume 历史会话、/fork 从任意消息分叉、/tree 浏览分支树、/rewind 把文件与对话一起回滚、/export 往返存档。会话不绑厂商：换网关后用 /resume 在当前 provider 上继续同一份上下文。',
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
          '在 tuios 窗口或 herdr pane 里启动，golder 自己上报状态：rail 上出现工作 / 等你 / 完成，审批与提问进 Inbox，daemon 重启后带着 golder --resume 回到原会话。两个宿主都不用改，tuios 只需装一份 harness manifest。',
      },
      {
        icon: 'globe',
        title: '网络现实友好',
        body:
          '20 个内置网关，覆盖 OpenAI Chat / OpenAI Responses / Anthropic Messages / Gemini 四种线上协议，也可指向任意 OpenAI 兼容端点；网络默认关闭，auto 档下随评审通过的调用一起授权（/network follow 默认开，off 恢复逐次询问），也可对某个 host / 命令预授权。/proxy 按 provider 单独走代理，未选中的直连、不继承 shell 的 HTTP_PROXY。',
      },
    ] as Feature[],
  },
  quickstart: {
    title: '三步上手',
    sub: '二进制安装不需要 Go；下面三条命令在 macOS / Linux 上可直接复制。',
    steps: [
      {
        title: '安装',
        body: 'macOS 用 Homebrew，Linux 用一键脚本；都会识别系统与架构。Windows 从 Releases 下载 .zip 解压即可。',
        codes: ['brew install getan/tap/golder', SITE.installCmd],
      },
      {
        title: '配置凭证',
        body: '默认网关 OpenCode 只需一个 API Key；也可指向任意 OpenAI 兼容端点，或用本地 Ollama。',
        codes: ['export OPENCODE_API_KEY=...'],
      },
      {
        title: '打开工作区',
        body: 'golder workspace 打开自带的分屏终端：第一格是 agent，Ctrl+b c 开 shell，浏览器按需。Ctrl+b d 只断开客户端，daemon 和 pane 继续跑。已经习惯 tuios / herdr / tmux / zellij / screen 的话，直接在它的 pane 里跑 golder 单 agent 模式。',
        codes: ['golder workspace', 'golder   # 已有复用器时：单个 agent'],
      },
    ] as Step[],
  },
  faq: {
    title: '常见问题',
    sub: '还有别的问题？到 GitHub 提 issue。',
    items: [
      {
        q: '需要 Node 或别的运行时吗？',
        a: '不需要。golder 是 Go 编译的单个二进制，下载即用；只有从源码构建才需要 Go 1.27+。',
      },
      {
        q: '我的代码会被上传到哪里？',
        a: '只会发送给你自己选择的模型网关（OpenAI、Anthropic、DeepSeek 或你指定的任意端点）。会话、记忆、凭据都存在本地 ~/.golder，golder 没有自己的后端。',
      },
      {
        q: '支持哪些模型？',
        a: '内置 20 个网关（19 个会话网关 + 审批用的决策模型 typesafe，它不接会话）。会话不绑厂商：/provider 换网关后用 /resume 继续同一份上下文，/provider default <名称> 把常用网关设为新会话默认；推理档位 off 到 max，也可以指向本地 Ollama。',
      },
      {
        q: '安全吗？它会乱改我的文件吗？',
        a: '三道门：静态硬拒（sudo、rm -rf /、写 ~/.ssh 与凭据路径直接拒绝，凭据永远不可授权）→ 逐调用审查（auto 档每次改动型调用都过决策模型，拿不准升级给会话模型：低风险放行、需隔离的进沙箱、高危拒绝，各给一行理由）→ OS 沙箱（读白名单、写限项目与临时目录；网络默认关闭，随评审通过的调用一起授权，可用 /network follow off 改为逐次询问）。想先观察可以切到 read-only。',
      },
      {
        q: '国内网络能用吗？',
        a: 'golder 支持按 provider 配代理，国内模型直连；注意本站是 Cloudflare 免费子域，少数网络下可能打不开，仓库和 Releases 始终是备选入口。',
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
    title: 'golder — the AI coding agent in your terminal',
    description:
      'A terminal AI coding agent written in Go: read and write files, run commands, search code, fetch the web — closing the loop from understanding a task to shipping the change. Single binary, no vendor lock-in, MIT.',
  },
  nav: {
    demo: 'Demo',
    features: 'Features',
    highlights: 'Highlights',
    quickstart: 'Quickstart',
    faq: 'FAQ',
    github: 'GitHub',
    switch: '简体中文',
  },
  hero: {
    eyebrow: 'golder-cli.pages.dev · Go · MIT',
    title: 'The AI coding agent in your terminal',
    lead:
      'golder is a single Go binary. For most people the entry point is golder workspace: a built-in split-pane terminal with the agent, a shell and the browser in one panel, closing the loop from “understand the task” to “the change is in”. If you already live in a terminal multiplexer, run the single-agent golder in its pane instead. Headless mode covers scripts and CI.',
    ctaPrimary: 'Get started',
    ctaSecondary: 'Source on GitHub',
    installHint: 'macOS: brew install getan/tap/golder · Linux: one-line script · Windows: zip from Releases · no runtime required',
    videoTitle: 'golder — a real session (idle time trimmed)',
    videoCaption:
      'Recorded for real: the agent reads and patches on the left while go test goes red to green in a shell pane on the right; the waits are trimmed (37s)',
  },
  highlights: {
    title: 'Why golder',
    sub: 'One command to install; the differences are these six.',
    items: [
      {
        icon: 'box',
        title: 'The default: a built-in terminal workspace',
        body:
          'golder workspace runs the agent, a shell and the browser in one panel: the agent patches on the left while the shell runs tests on the right, and focus is input. The browser drives pages over kitty-browse’s control socket (snapshot/click/fill/wait/console/network); presets (debug-fullstack, data-analysis, review) start backend, frontend and browser together, and snapshot hands the model every pane’s context at once.',
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
          'The same single-binary class, plus a per-call approval gate and an OS sandbox (sandbox-exec / bubblewrap): reads stay in the workspace, writes in the project and temp dirs, the network is off by default, and credentials are unreadable.',
      },
      {
        icon: 'terminal',
        title: 'Easier to customize than codex-cli',
        body:
          'Pure Go: one language, one binary, no Node/Python runtime. A new tool, provider or approval rule is one go build away.',
      },
      {
        icon: 'gauge',
        title: '~50–100 MB resident',
        body: 'Top tier for this class of agent, so it can stay open all day.',
      },
      {
        icon: 'branch',
        title: 'Planned: MCP and a plugin ecosystem',
        body: 'Bring external tools and data sources in without changing the core.',
      },
    ] as Feature[],
  },
  features: {
    title: 'More features',
    sub: 'Safety boundaries, long tasks, and session management are built in — the parts you actually use every day.',
    items: [
      {
        icon: 'terminal',
        title: 'One binary, three shapes',
        body:
          'Full-screen TUI, line REPL, and headless -p with identical commands; --output-format stream-json emits one JSON event per line for scripts and CI.',
      },
      {
        icon: 'shield',
        title: 'Every mutating call gets reviewed, with a one-line rationale',
        body:
          'Four permission modes: read-only / ask / auto / full-access. In auto every mutating call goes to the decision model first (typesafe), escalating to the session model when it is unsure — low risk runs, isolatable calls are contained, dangerous ones are denied, each with a rationale written in the conversation’s own language. Without a decision-model credential the local rule table takes that slot.',
      },
      {
        icon: 'box',
        title: 'OS-level sandboxing',
        body:
          'sandbox-exec on macOS, bubblewrap on Linux: read allow-list (secrets, credentials and history under $HOME are unreadable), writes limited to the project and temp dirs, network off by default and granted per call. A call whose whole effect is readable from its command (git push, go test, …) skips the extra sandbox and is marked ·unconfined; everything else is marked ·sandbox.',
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
          '/compact summarization, context-budget tools, autonomous /goal loops, sub-agent dispatch, persistent memory and /dream consolidation; a stream cut mid-answer continues from where it stopped instead of losing the turn.',
      },
      {
        icon: 'branch',
        title: 'Sessions are assets',
        body:
          '/resume past sessions, /fork from any message, /tree to browse branches, /rewind to roll back files and conversation together, /export for round-trip archives. Sessions are not tied to a vendor: switch gateways and /resume continues the same context on the current provider.',
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
          'Start it in a tuios window or a herdr pane and golder reports its own state: it shows up on the rail (working / waiting on you / done), approvals land in the Inbox, and a daemon restart brings the conversation back with golder --resume. Neither host changes; tuios needs one harness manifest.',
      },
      {
        icon: 'globe',
        title: 'Real-world networking',
        body:
          '20 built-in gateways across four wire formats — OpenAI Chat, OpenAI Responses, Anthropic Messages, Gemini — plus any OpenAI-compatible endpoint; the network is off by default and granted with the call the reviewer approved under auto (/network follow ships on; turn it off for a per-call question), and a host or command can be pre-authorized. /proxy routes per provider: unselected ones go direct and ignore the shell’s HTTP_PROXY.',
      },
    ] as Feature[],
  },
  quickstart: {
    title: 'Get started in three steps',
    sub: 'No Go toolchain needed for the binary install; the commands below work on macOS / Linux.',
    steps: [
      {
        title: 'Install',
        body: 'Homebrew on macOS, the one-line script on Linux; both detect the architecture. On Windows, download the .zip from Releases.',
        codes: ['brew install getan/tap/golder', SITE.installCmd],
      },
      {
        title: 'Configure a credential',
        body: 'The default gateway (OpenCode) needs a single API key; any OpenAI-compatible endpoint or a local Ollama works too.',
        codes: ['export OPENCODE_API_KEY=...'],
      },
      {
        title: 'Open a workspace',
        body: 'golder workspace opens the built-in split-pane terminal: the agent in the first pane, Ctrl+b c for a shell, and the browser when you need it. Ctrl+b d detaches; the daemon and its panes keep running. Already used to tuios / herdr / tmux / zellij / screen? Run the single-agent golder in its pane instead.',
        codes: ['golder workspace', 'golder   # already in a multiplexer: single agent'],
      },
    ] as Step[],
  },
  faq: {
    title: 'FAQ',
    sub: 'Something else on your mind? Open an issue on GitHub.',
    items: [
      {
        q: 'Does it need Node or any runtime?',
        a: 'No. golder is a single Go binary — download and run. Only building from source needs Go 1.27+.',
      },
      {
        q: 'Where does my code go?',
        a: 'Only to the model gateway you choose (OpenAI, Anthropic, DeepSeek, or any endpoint you point it at). Sessions, memory and credentials live locally in ~/.golder; golder has no backend of its own.',
      },
      {
        q: 'Which models are supported?',
        a: '20 built-in gateways (19 conversation gateways plus the typesafe decision model, which does not serve conversations). Sessions are not tied to a vendor: switch with /provider and keep going with /resume on the new one, and /provider default <name> makes a gateway the default for new sessions. Reasoning levels run from off to max — or point it at a local Ollama.',
      },
      {
        q: 'Is it safe? Will it edit my files behind my back?',
        a: 'Three gates: a static hard-deny (sudo, rm -rf /, writes to ~/.ssh or credential material are refused outright — credentials are never grantable) → a per-call review (in auto every mutating call goes to the decision model, escalating to the session model when unsure: low risk runs, isolatable calls are contained, dangerous ones are denied, each with a one-line rationale) → the OS sandbox (read allow-list, writes limited to the project and temp dirs; the network is off by default and granted with the call the reviewer approved — /network follow off restores a per-call question). Switch to read-only to just watch.',
      },
      {
        q: 'Does the site work from mainland China?',
        a: 'golder itself supports per-provider proxies and connects directly to domestic models. This site, however, is a free Cloudflare subdomain and may be unreachable on some networks — the GitHub repo and Releases are always the fallback.',
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
