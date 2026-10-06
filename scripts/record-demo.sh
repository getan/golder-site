#!/bin/sh
# 重录首屏演示视频（https://golder-cli.pages.dev 首屏那段）。
#
# 用法：
#   scripts/record-demo.sh [/path/to/golder-repo] [原始秒数]
#
# 前置：vhs（brew install vhs）、ffmpeg、go、Chromium 系浏览器。
# 产物：public/demo/{demo.mp4,demo.webm,poster.jpg}
#
# 隐私约定（重要）：全程只在 /tmp/demo* 临时目录里操作，
# GOLDER_HOME 指向临时目录，不读也不写真实 ~/.golder；
# 录完请人工抽查成片，确认没有密钥/真实路径入镜。
set -eu

GOLDER_REPO="${1:-../golder}"
RAW_SECONDS="${2:-55}"      # 原始录制里"真正有动作"的部分（超出部分裁掉）
DEMO_ROOT=/tmp/demo
DEMO_HOME=/tmp/demo-home
DEMO_BIN=/tmp/demo-bin

say() { printf '[record-demo] %s\n' "$*" >&2; }

need() { command -v "$1" >/dev/null 2>&1 || { say "缺少依赖: $1"; exit 1; }; }
need vhs; need ffmpeg; need go

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)

# 1) 用当前分支源码构建演示二进制（带版本号，splash 里会显示）
say "构建 golder（$GOLDER_REPO）..."
mkdir -p "$DEMO_BIN"
version=$(cd "$GOLDER_REPO" && git describe --tags --abbrev=0 2>/dev/null | sed 's/^v//')
[ -n "$version" ] || version=dev
commit=$(cd "$GOLDER_REPO" && git rev-parse --short HEAD)
( cd "$GOLDER_REPO" && go build \
    -ldflags "-X main.version=v$version -X main.commit=$commit" \
    -o "$DEMO_BIN/golder" ./cmd/golder )

# 2) 准备演示项目（带 bug 的副本）与隔离的 GOLDER_HOME
say "准备演示项目 $DEMO_ROOT/slugkit ..."
rm -rf "$DEMO_ROOT" "$DEMO_HOME"
mkdir -p "$DEMO_ROOT" "$DEMO_HOME"
cp -R "$SCRIPT_DIR/fixture/slugkit" "$DEMO_ROOT/slugkit"
# 预置信任，免得录到询问弹窗
printf '{"/tmp/demo/slugkit": true}' > "$DEMO_HOME/trust.json"

# 3) 录制（tape 直接输出到 /tmp/demo/raw.mp4）
say "开始录制（约 3.5 分钟）..."
PATH="$DEMO_BIN:$PATH" GOLDER_HOME="$DEMO_HOME" vhs "$SCRIPT_DIR/demo.tape"

# 4) 后期：裁到有动作的部分 → 2x 快放 → mp4/webm + 海报帧
OUT="$SCRIPT_DIR/../public/demo"
mkdir -p "$OUT"
say "后期：裁剪 0-${RAW_SECONDS}s、2x 快放..."
ffmpeg -y -loglevel error -t "$RAW_SECONDS" -i "$DEMO_ROOT/raw.mp4" \
  -filter:v "setpts=0.5*PTS" -r 30 -c:v libx264 -crf 18 -preset medium \
  -pix_fmt yuv420p -movflags +faststart "$OUT/demo.mp4"
ffmpeg -y -loglevel error -i "$OUT/demo.mp4" \
  -c:v libvpx-vp9 -crf 34 -b:v 0 -row-mt 1 -cpu-used 3 -an "$OUT/demo.webm"
# 海报：取原始录制约 48s 处（diff 上屏、信息量最大的一帧）
ffmpeg -y -loglevel error -ss 48 -i "$DEMO_ROOT/raw.mp4" -vframes 1 -q:v 3 "$OUT/poster.jpg"

say "完成："
ls -la "$OUT"
say "请人工过一遍成片与海报，确认无敏感信息后再提交。"
