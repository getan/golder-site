# scripts

## record-demo.sh —— 重录首屏演示视频

首屏那段 28 秒的演示视频是**真实录制**的 golder 会话（不是合成的示意画面）。
它由 VHS 驱动一个真实终端跑出来：

```
go test 红 → 启动 golder → 中文任务「修复失败用例」→ 模型自主修复 → 全绿
```

源码更新后想刷新视频（例如 TUI 改版），一条命令：

```bash
brew install vhs                    # 一次性：vhs + ttyd；ffmpeg 需已安装
scripts/record-demo.sh ../golder    # 默认裁到 55s 原始时长，2x 快放
scripts/record-demo.sh ../golder 70 # 若这次 agent 花得更久，把窗口放大
```

产物写入 `public/demo/`：`demo.mp4`（H.264）、`demo.webm`（VP9，体积更小，优先）、
`poster.jpg`（首屏静态封面）。

### 隐私红线（录制后务必确认）

- 脚本只在 `/tmp/demo*` 临时目录操作，`GOLDER_HOME` 指向临时目录，**不读不写真实 `~/.golder`**
- 录制后**人工过一遍成片**：抽查关键帧 + `strings` 扫描 `sk-`、`api_key`、真实家目录路径
- 画面里不应出现：API Key、代理地址、历史会话、个人目录结构

### 文件说明

| 文件 | 用途 |
|---|---|
| `demo.tape` | VHS 录制脚本（终端操作序列），由 record-demo.sh 调用 |
| `fixture/slugkit/` | 演示项目（故意带 3 个失败用例的 Go 小模块） |
| `record-demo.sh` | 一键重录：构建二进制 → 隔离环境 → 录制 → 裁剪/转码 |

`fixture/slugkit` 的 bug 是精心选的：它能同时展示读文件、跑测试、打补丁、验证
四类工具调用，且修复逻辑（单遍扫描 + 折叠分隔符）有足够"含金量"，看起来像真活
而不是玩具题。
