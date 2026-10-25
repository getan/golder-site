# scripts

首屏视频和 README 截图都是**真实会话**：在真实 PTY 里跑 golder，用 pyte 仿真终端、
PIL 逐格绘制成 PNG；同一份时间线也能直接出视频。不是合成画面，也没有后期摆拍。

| 产物 | 命令 | 写到哪里 |
|---|---|---|
| 站点首屏视频 | `snapshot.py video` + ffmpeg | `public/demo/demo.{mp4,webm}`、`poster.jpg` |
| README 截图 / GIF | `snapshot.py render`（GIF 再由视频转） | `../../golder/docs/assets/demo-*` |
| 会话时间线（上面两者的输入） | `snapshot.py capture`（普通 TUI）或 `workspace-drive.py`（workspace 分屏） | `/tmp/golder-demo/shots/*.pkl` |

VHS 那套（`record-demo.sh` / `demo.tape` / `demo-drive.py`）已退役：录制机上 ttyd +
无头浏览器渲染出的是空白帧，注入非 ASCII 还会卡死。文件保留只为历史参考。

## 0) 准备（每次都从干净环境开始）

```bash
D=/tmp/golder-demo
mkdir -p $D/{bin,home,shots,out,userhome}
python3 -m venv $D/venv && $D/venv/bin/pip install pyte pillow

# 演示二进制：版本号写成当前 release，splash 才不会出现「有新版本」提示
(cd ../golder && GOWORK=off go build \
  -ldflags "-X main.version=v1.5.5 -X main.commit=$(git rev-parse --short HEAD)" \
  -o $D/bin/golder ./cmd/golder)

# 演示项目（故意带 3 个失败用例）+ 预置信任，免得录到询问弹窗
rm -rf $D/slugkit && cp -R scripts/fixture/slugkit $D/slugkit
# macOS 上 /tmp 是 /private/tmp 的符号链接：两种拼法都写上
printf '{"/private/tmp/golder-demo/slugkit": true, "/tmp/golder-demo/slugkit": true}' \
  > $D/home/trust.json
(cd $D/slugkit && go test ./...)   # 必须先看到红：agent 改过的目录不能复用
```

## 1) 录 workspace 时间线

```bash
DEMO_BIN=$D/bin/golder DEMO_CWD=$D/slugkit DEMO_HOME=$D/userhome \
DEMO_GOLDER_HOME=$D/home DEMO_OUT=$D/shots/ws.pkl DEMO_TOTAL=130 SHELL=/bin/sh \
DEMO_ARGV='["workspace","-s","demo","-C","/tmp/golder-demo/slugkit"]' \
DEMO_STEPS='[
  {"t":9,"send":"\u0002c"},
  {"t":12,"type":"go test ./..."},
  {"t":19,"send":"\u0002\u001b[D"},
  {"t":21,"type":"修复失败的测试，让 go test 全部通过；先列计划，改完自己验证"},
  {"t":100,"send":"\u0002\u001b[C"},
  {"t":103,"type":"go test ./..."}]' \
PATH="$D/bin:$PATH" $D/venv/bin/python3 scripts/workspace-drive.py

# 录完停掉 daemon，下一次 attach 不会接上旧 pane
GOLDER_HOME=$D/home HOME=$D/userhome $D/bin/golder workspace stop demo
```

按键写法：`\u0002` 是 ctrl+b 前缀，`\u001b[D` / `\u001b[C` 是左右方向键。最后那次
`go test` 要等 agent 改完，所以按实测时长调 `t`（这条主线约 100 秒）。

## 2) 出片

```bash
# 站点视频：三段拼接，中间的等待直接剪掉；speed 0.4 ≈ 2.5 倍速
$D/venv/bin/python3 scripts/snapshot.py video --timeline $D/shots/ws.pkl \
  --out $D/out/demo.mp4 --cuts 6-38,44-72,96-118 --speed 0.4 --cap-idle 1.0
ffmpeg -y -i $D/out/demo.mp4 -c:v libvpx-vp9 -crf 34 -b:v 0 -row-mt 1 -cpu-used 3 \
  -an public/demo/demo.webm
cp $D/out/demo.mp4 public/demo/demo.mp4

# 截图 / 海报：同一份时间线，任意时刻都能重画
$D/venv/bin/python3 scripts/snapshot.py render --timeline $D/shots/ws.pkl \
  --shots "50=$D/out/tools.png,120=$D/out/done.png"
ffmpeg -y -i $D/out/tools.png -q:v 3 public/demo/poster.jpg

# README 的 GIF：12 秒、900px、64 色（再大 GitHub 打开会慢）
$D/venv/bin/python3 scripts/snapshot.py video --timeline $D/shots/ws.pkl \
  --out $D/out/gif.mp4 --cuts 6-16,46-60,102-114 --speed 0.4 --cap-idle 1.0
ffmpeg -y -i $D/out/gif.mp4 -t 12 \
  -vf "fps=10,scale=900:-1:flags=lanczos,palettegen=max_colors=64:stats_mode=diff" \
  $D/out/palette.png
ffmpeg -y -i $D/out/gif.mp4 -i $D/out/palette.png \
  -lavfi "trim=0:12,fps=10,scale=900:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=none" \
  ../../golder/docs/assets/demo.gif
```

## 隐私红线（出片后必查）

- 只在 `/tmp/golder-demo` 里操作；`GOLDER_HOME` 和 `HOME` 都指向临时目录，
  **不读不写真实 `~/.golder`**
- 每次录制前重置 fixture：agent 改过的项目不能复用，否则「红测试」其实是绿的
- 画面里的绝对路径只应有 `/private/tmp/golder-demo/slugkit`；别用带用户名或随机
  UUID 的目录（splash 会把工作目录原样打出来）
- `ls -la` 会带出录制机用户名：用 `DEMO_REDACT="<用户名>=dev"` 让渲染时替换掉
  （默认不替换任何内容，这是唯一一处改写画面内容的处理）
- 出片后扫一遍时间线文本（比扫视频文件可靠）：

```bash
$D/venv/bin/python3 -c "
import pickle, re
cols, rows, tl = pickle.load(open('$D/shots/ws.pkl', 'rb'))
text = re.sub(r'\x1b\[[0-9;?]*[A-Za-z]', '', b''.join(b for _, b in tl).decode('utf-8', 'replace'))
open('/tmp/golder-demo/scan.txt', 'w').write(text)"
grep -n -i -E 'api[_-]?key|sk-[a-z0-9]{10,}|token=|bearer|/users/' /tmp/golder-demo/scan.txt
```

## 文件说明

| 文件 | 用途 |
|---|---|
| `snapshot.py` | 截图 / 视频产线：PTY 时间线 → pyte 仿真 → PNG；`video` 直接合成 mp4 |
| `workspace-drive.py` | workspace 录制：按时间点把按键 / 中文任务写进 PTY |
| `fixture/slugkit/` | 演示项目（故意带 3 个失败用例的 Go 小模块） |
| `record-demo.sh`、`demo.tape`、`demo-drive.py` | 已退役的 VHS 产线，保留作历史参考 |
