# scripts

首屏素材是**真实会话**（不是合成的示意画面）：`go test` 红 → 启动 golder →
中文任务「修复失败用例」→ 模型自主修复 → 全绿。两条产线并存：

| 产线 | 产物 | 状态 |
|---|---|---|
| `record-demo.sh`（VHS 录像） | `public/demo/demo.{mp4,webm}`、`poster.jpg` | 脚本可用，但**本机录制环境已坏**（见下） |
| `snapshot.py`（截图） | `../../golder/docs/assets/demo-*.png` | 当前 README / 首屏在用 |

## 为什么现在用截图

VHS（`brew install vhs`：起 ttyd + 无头浏览器渲染真终端，逐帧交 ffmpeg）在录制机上
有两处硬伤，都不是脚本的问题，改动脚本绕不过去：

1. **注入非 ASCII 会卡死**。`Type "中文…"` 或 `Copy`+`Paste` 中文一律挂住，vhs 停在
   那一行不动、也不报错。最小复现：
   ```sh
   printf 'Output "/tmp/cjk/out.mp4"\nSet Width 600\nSet Height 200\nSet Theme "GitHub Dark"\nType "echo 中文"\nEnter\nSleep 1s\n' > /tmp/cjk.tape
   timeout 60 vhs /tmp/cjk.tape    # 60s 不退出，日志停在 Type 那一行
   ```
   （中文**输出**正常，只有注入有问题。）即便绕开——`demo.tape` 现在用
   `demo-drive.py` 把中文直接写进 golder 的 PTY——第 2 条仍然拦路。
2. **渲染出的是空白帧**。连 `Type "echo HELLO"` 这种纯 ASCII 的最简 tape，成片也是
   全黑（帧大小 ~1.3KB，正常有字 >15KB）。换 `ROD_BROWSER_BIN` 指向 Brave 同样空白，
   本机 Chromium 是 150 dev 构建、没装 Google Chrome。旧片能正常播放，所以是录制机上
   的渲染环境坏了，不是 tape 写错。

所以 `snapshot.py` 接手：不经过浏览器，在真实 PTY 里跑**同样**的会话，用 pyte 仿真
终端、PIL 逐格绘制。代价是没有动效；好处是逐帧可控、可复现、跑一次能出多张图。

## snapshot.py —— 出首屏截图

```bash
pip install pyte pillow                # 一次性；浏览器与字体不再需要
# 1) 跑一次真实会话，把终端输出存成时间线（约 3 分钟）
python3 scripts/snapshot.py capture --cols 140 --rows 40 --inject 7 --total 175 \
    --prompt "修复失败的测试用例，让 go test 全部通过" \
    --shell "cd /tmp/demo/slugkit && go test ./... ; exec golder" \
    --out /tmp/shot/timeline.pkl
# 2) 同一份时间线渲染多个时刻（改文案/换时刻不用重跑会话）
python3 scripts/snapshot.py render --timeline /tmp/shot/timeline.pkl \
    --shots "8=welcome.png,30=tools.png,171=done.png"
```

前置环境与 `record-demo.sh` 相同：`/tmp/demo-bin/golder` 是要展示的二进制，
`/tmp/demo/slugkit` 是带 bug 的演示项目，`/tmp/demo-home` 是隔离的 `GOLDER_HOME`
（三者由 `record-demo.sh` 准备；单跑截图时按同样布局摆好即可）。

渲染过程中的两处**有意为之**，别当成 bug：

- **脱敏**：演示里模型常跑 `ls -la`，输出带文件属主（录制机用户名）。渲染时把用户名
  换成 `dev`，这是唯一一处改写画面内容的处理，其余一律照实渲染。
- **状态栏三角**：golder 状态栏用 powerline 字形（`\ue0b0`/`\ue0b2`）分段，Menlo 没
  这些字形，直接画会是豆腐块，所以手工画三角。

## record-demo.sh —— 修好后再用

脚本侧的真问题都已修掉（环境修好后可直接重跑）：

- `$GOLDER_REPO）` 这类**全角括号紧跟变量**会被 `set -u` 读成变量名的一部分而报错，
  已改成 `${GOLDER_REPO}）`；
- `trust.json` 的键要**同时写物理路径**（macOS 上 `/tmp` 是 `/private/tmp` 的符号链接，
  golder 启动时解析出后者）。只写 `/tmp/...` 的话演示会卡在信任弹窗上，
  末尾的 `/exit` 送不进去、vhs 于是永远等不到退出；
- 录制机上若自己就跑在 tuios / herdr 的窗格里，`TUIOS_*` / `HERDR_*` 会被演示进程继承，
  新版的 golder 会照它上报状态（实测被 tuios 的 nested 守卫挡下，但仍是噪音），
  脚本现在会先把这些变量摘掉。

```bash
scripts/record-demo.sh ../golder    # 默认裁到 55s 原始时长，2x 快放
scripts/record-demo.sh ../golder 70 # 若这次 agent 花得更久，把窗口放大
```

产物写入 `public/demo/`：`demo.mp4`（H.264）、`demo.webm`（VP9，体积更小，优先）、
`poster.jpg`（静态封面）。

### 隐私红线（出片后务必确认）

- 脚本只在 `/tmp/demo*` 临时目录操作，`GOLDER_HOME` 指向临时目录，**不读不写真实 `~/.golder`**
- 出片后**人工过一遍**：抽查关键帧 + `strings` 扫描 `sk-`、用户名、真实家目录路径
- 画面里不应出现：API Key、代理地址、历史会话、个人目录结构

### 文件说明

| 文件 | 用途 |
|---|---|
| `snapshot.py` | 截图产线：PTY 跑真实会话 → pyte 仿真 → 渲染 PNG |
| `demo-drive.py` | 录像产线：把中文任务写进 golder 的 PTY（`demo.tape` 只打 ASCII） |
| `demo.tape` | VHS 录制脚本（终端操作序列），由 record-demo.sh 调用 |
| `fixture/slugkit/` | 演示项目（故意带 3 个失败用例的 Go 小模块） |
| `record-demo.sh` | 一键重录：构建二进制 → 隔离环境 → 录制 → 裁剪/转码 |

`fixture/slugkit` 的 bug 是精心选的：它能同时展示读文件、跑测试、打补丁、验证
四类工具调用，且修复逻辑（单遍扫描 + 折叠分隔符）有足够"含金量"，看起来像真活
而不是玩具题。
