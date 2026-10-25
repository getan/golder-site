#!/usr/bin/env python3
"""真实会话截图：在 PTY 里跑一次 golder，用 pyte 仿真终端，再渲染成 PNG。

为什么不用 vhs：本机 vhs 的浏览器渲染出的是空白帧（连 `echo` 都画不出来，见
scripts/README.md），而截图这条路不依赖浏览器，golder 同样在真实 PTY 里跑真会话。

用法：
  python3 snapshot.py capture --cols 140 --rows 40 \
      --prompt "修复失败的测试用例，让 go test 全部通过" --inject 7 --total 175 \
      --out /tmp/shot/timeline.pkl
  python3 snapshot.py render --timeline /tmp/shot/timeline.pkl \
      --shots "8=/tmp/welcome.png,30=/tmp/mid.png,172=/tmp/final.png"
"""
import argparse
import codecs
import fcntl
import os
import pickle
import pty
import select
import signal
import struct
import sys
import termios
import time
import unicodedata

MONO = "/System/Library/Fonts/Menlo.ttc"
CJK = "/System/Library/Fonts/Hiragino Sans GB.ttc"
SIZE, SCALE, PAD = 15, 2, 10
DEFAULT_FG, DEFAULT_BG = "#d7dae0", "#0f1114"
NAMED = {
    "black": "#3b4048", "red": "#e06c75", "green": "#98c379", "brown": "#d19a66",
    "yellow": "#e5c07b", "blue": "#61afef", "magenta": "#c678dd", "cyan": "#56b6c2",
    "white": "#dcdfe4", "brightblack": "#5c6370", "brightred": "#e06c75",
    "brightgreen": "#98c379", "brightbrown": "#d19a66", "brightyellow": "#e5c07b",
    "brightblue": "#61afef", "brightmagenta": "#c678dd", "brightcyan": "#56b6c2",
    "brightwhite": "#ffffff",
}
# 状态栏用 powerline 三角（Nerd Font 字形，Menlo 没有）把各段接起来：手工画三角，
# 否则 PIL 会画成豆腐块。
POWERLINE = {"\ue0b0": "right", "\ue0b2": "left"}
# 演示环境里模型可能跑 `ls -la`，输出带上录制机的用户名；公开素材换成占位名。
# 这是唯一一处改写画面内容的处理，其余一律照实渲染。录制机自己的名字不写进仓库：
# 用 DEMO_REDACT="<用户名>=dev" 传入（逗号分隔可写多条）。
REDACT = dict(
    part.split("=", 1)
    for part in os.environ.get("DEMO_REDACT", "").split(",")
    if "=" in part
)


def color(v, default):
    if v in (None, "default"):
        return default
    return NAMED.get(v, "#" + v.lstrip("#"))


def is_wide(ch):
    return unicodedata.east_asian_width(ch) in ("W", "F")


def row_text(line, cols):
    return "".join(line[i].data or " " for i in range(cols))


def capture(bin_path, cwd, home, cols, rows, prompt, inject_at, total, shell_cmd=None):
    env = {k: v for k, v in os.environ.items() if not k.startswith(("TUIOS_", "HERDR_"))}
    env.update({"GOLDER_HOME": home, "TERM": "xterm-256color",
                "LANG": "en_US.UTF-8", "LC_ALL": "en_US.UTF-8",
                "PATH": os.path.dirname(bin_path) + ":" + env["PATH"]})
    pid, fd = pty.fork()
    if pid == 0:
        fcntl.ioctl(1, termios.TIOCSWINSZ, struct.pack("HHHH", rows, cols, 0, 0))
        os.chdir(cwd)
        if shell_cmd:
            os.execve("/bin/bash", ["/bin/bash", "-c", shell_cmd], env)
        os.execve(bin_path, [os.path.basename(bin_path)], env)

    fcntl.ioctl(fd, termios.TIOCSWINSZ, struct.pack("HHHH", rows, cols, 0, 0))
    os.set_blocking(fd, False)

    t0, timeline, sent = time.monotonic(), [], False
    while time.monotonic() - t0 < total:
        el = time.monotonic() - t0
        if not sent and el >= inject_at:
            for i in range(0, len(prompt), 3):   # 小步输入，整段一次写入会被折叠成粘贴
                os.write(fd, prompt[i:i + 3].encode())
                time.sleep(0.03)
            os.write(fd, b"\r")
            sent = True
            print(f"[snapshot] {el:5.1f}s 注入任务", file=sys.stderr, flush=True)
        r, _, _ = select.select([fd], [], [], 0.2)
        if r:
            try:
                d = os.read(fd, 1 << 16)
            except OSError:
                continue
            if not d:
                break
            timeline.append((round(time.monotonic() - t0, 3), d))

    for sig in (signal.SIGTERM, signal.SIGKILL):
        try:
            os.kill(pid, sig)
            time.sleep(0.2)
        except ProcessLookupError:
            break
    print(f"[snapshot] {len(timeline)} 块 / {sum(len(b) for _, b in timeline)} 字节",
          file=sys.stderr, flush=True)
    return timeline


def render(screen, path, quantize=True):
    from PIL import Image, ImageDraw, ImageFont

    font = ImageFont.truetype(MONO, SIZE * SCALE)
    try:
        bold = ImageFont.truetype(MONO, SIZE * SCALE, index=1)
    except OSError:
        bold = font
    cjk = ImageFont.truetype(CJK, SIZE * SCALE)

    cw = font.getlength("M")
    ch = round(SIZE * 1.20 * SCALE)
    cols, rows = screen.columns, screen.lines
    im = Image.new("RGB", (round(cols * cw) + 2 * PAD * SCALE, rows * ch + 2 * PAD * SCALE),
                   DEFAULT_BG)
    d = ImageDraw.Draw(im)

    for y in range(rows):
        line = screen.buffer[y]
        text_row = row_text(line, cols)
        for needle, repl in REDACT.items():
            start = 0
            while (idx := text_row.find(needle, start)) != -1:
                text_row = text_row[:idx] + repl + " " * (len(needle) - len(repl)) + text_row[idx + len(needle):]
                start = idx + len(repl)
        y0 = PAD * SCALE + y * ch
        x, xi, seg_bg = 0.0, 0, DEFAULT_BG
        while xi < cols:
            cell = line[xi]
            text = text_row[xi]
            x0 = PAD * SCALE + x
            fg, bg = color(cell.fg, DEFAULT_FG), color(cell.bg, DEFAULT_BG)
            if cell.reverse:
                fg, bg = bg, fg
            wide = is_wide(text)
            cells = 2 if (wide and xi + 1 < cols) else 1
            arrow = POWERLINE.get(text)
            if arrow:
                if seg_bg != DEFAULT_BG:
                    d.rectangle([x0, y0, x0 + cw - 0.5, y0 + ch - 0.5], fill=seg_bg)
                mid = y0 + ch / 2
                pts = ([(x0, y0), (x0, y0 + ch - 1), (x0 + cw - 1, mid)] if arrow == "right"
                       else [(x0 + cw - 1, y0), (x0 + cw - 1, y0 + ch - 1), (x0, mid)])
                d.polygon(pts, fill=fg)
            else:
                if bg != DEFAULT_BG:
                    d.rectangle([x0, y0, x0 + cells * cw - 0.5, y0 + ch - 0.5], fill=bg)
                if text != " ":
                    d.text((x0, y0), text, font=(cjk if wide else (bold if cell.bold else font)), fill=fg)
                if text.strip():
                    seg_bg = bg
            x += cells * cw
            xi += cells

    im = im.resize((im.width // SCALE, im.height // SCALE), Image.LANCZOS)
    if quantize:                       # 终端画面颜色很少，调色板化能显著压小文件
        im = im.quantize(colors=64, method=Image.MEDIANCUT).convert("RGB")
    im.save(path)
    return path


def replay(timeline, cols, rows, cutoff):
    import pyte

    screen = pyte.Screen(cols, rows)
    stream = pyte.Stream(screen)
    dec = codecs.getincrementaldecoder("utf-8")("replace")
    for t, blob in timeline:
        if t > cutoff:
            break
        stream.feed(dec.decode(blob))
    return screen


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="mode", required=True)

    c = sub.add_parser("capture")
    c.add_argument("--bin", default="/tmp/demo-bin/golder")
    c.add_argument("--cwd", default="/tmp/demo/slugkit")
    c.add_argument("--home", default="/tmp/demo-home")
    c.add_argument("--cols", type=int, default=140)
    c.add_argument("--rows", type=int, default=40)
    c.add_argument("--prompt", default="修复失败的测试用例，让 go test 全部通过")
    c.add_argument("--inject", type=float, default=7)
    c.add_argument("--total", type=float, default=175)
    c.add_argument("--shell", default=None, help="先在这个 shell 里跑命令，再 exec golder")
    c.add_argument("--out", default="/tmp/shot/timeline.pkl")

    v = sub.add_parser("video")
    v.add_argument("--timeline", default="/tmp/shot/timeline.pkl")
    v.add_argument("--out", required=True, help="输出 mp4")
    v.add_argument("--fps", type=int, default=30)
    v.add_argument("--cap-idle", type=float, default=1.2, help="单帧最长停留秒数")
    v.add_argument("--speed", type=float, default=1.0, help="整体倍速（<1 更快）")
    v.add_argument("--from", dest="start", type=float, default=0.0,
                   help="从时间线的第几秒开始出片（默认 0）")
    v.add_argument("--to", dest="end", type=float, default=None,
                   help="到第几秒结束（默认到结尾）")
    v.add_argument("--cuts", default=None,
                   help="多段剪辑窗口，如 6-40,55-70,96-116（给了就忽略 --from/--to）")
    v.add_argument("--tmpdir", default="/tmp/shot/frames")
    v.add_argument("--keep-frames", action="store_true")

    r = sub.add_parser("render")
    r.add_argument("--timeline", default="/tmp/shot/timeline.pkl")
    r.add_argument("--shots", required=True, help="t=path[,t=path...]")
    r.add_argument("--no-quantize", action="store_true")
    args = ap.parse_args()

    if args.mode == "video":
        import hashlib
        import shutil
        import subprocess
        import pyte

        cols, rows, timeline = pickle.load(open(args.timeline, "rb"))
        if os.path.isdir(args.tmpdir):
            shutil.rmtree(args.tmpdir)
        os.makedirs(args.tmpdir)

        # 单次遍历：把每个数据块喂给仿真器，画面真的变了才出一帧。这样一屏
        # 只解析一遍（不是每帧从头重放），出 400 帧也就几秒。
        screen = pyte.Screen(cols, rows)
        stream = pyte.Stream(screen)
        dec = codecs.getincrementaldecoder("utf-8")("replace")

        def signature():
            return hashlib.sha1("".join(
                f"{screen.buffer[y][x].data}|{screen.buffer[y][x].fg}|{screen.buffer[y][x].bg}"
                f"|{screen.buffer[y][x].bold}|{screen.buffer[y][x].reverse}"
                for y in range(rows) for x in range(cols)).encode()).hexdigest()

        # 先把整条时间线喂完，只把落在窗口内的画面留成帧：窗口起点的那一屏
        # 依赖起点之前的输出，跳过它们会从空白屏开始。
        start = max(0.0, args.start)
        end = args.end if args.end is not None else float("inf")
        cuts = None
        if args.cuts:
            cuts = []
            for part in args.cuts.split(","):
                a, b = part.split("-", 1)
                cuts.append((float(a), float(b)))

        def window_of(t):
            if cuts is None:
                return 0 if start <= t <= end else -1
            for idx, (a, b) in enumerate(cuts):
                if a <= t <= b:
                    return idx
            return -1

        shots, last_sig, last_t, last_win = [], None, start, -1
        for t, blob in timeline:
            stream.feed(dec.decode(blob))
            win = window_of(t)
            if win < 0:
                continue
            sig = signature()
            if sig == last_sig:
                continue
            path = os.path.join(args.tmpdir, f"f{len(shots):05d}.png")
            render(screen, path)
            if shots:
                # 停留时长 = 这一帧在屏幕上挂了多久（空闲段按 cap_idle 截断再整体
                # 提速）。跨剪辑窗口时只留一个短拍，不把被剪掉的等待算进来。
                if win == last_win:
                    shots[-1][1] = min(t - last_t, args.cap_idle) * args.speed
                else:
                    shots[-1][1] = 0.35 * args.speed
            shots.append([path, None])
            last_sig, last_t, last_win = sig, t, win
        if not shots:
            sys.exit("时间线里没有画面变化")
        shots[-1][1] = 1.5                      # 收尾停一下，让人看清结论

        frames = [(p_, max(d or 0, 1 / args.fps)) for p_, d in shots]
        listing = [f"file '{os.path.abspath(p_)}'\nduration {d:.3f}" for p_, d in frames]
        listing.append(f"file '{os.path.abspath(frames[-1][0])}'")   # 末帧重列一次
        concat = os.path.join(args.tmpdir, "list.txt")
        open(concat, "w").write("\n".join(listing) + "\n")

        # -fps_mode 是 ffmpeg 7+ 的写法，老的 -vsync 在 ffmpeg 9 已被移除；都试一次，
        # 免得脚本绑死在某一个 ffmpeg 版本上。
        head = ["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", concat]
        tail = ["-pix_fmt", "yuv420p", "-movflags", "+faststart",
                "-c:v", "libx264", "-crf", "20", "-preset", "medium", args.out]
        for flag in ("-fps_mode", "-vsync"):
            r = subprocess.run(head + [flag, "vfr"] + tail, capture_output=True, text=True)
            if r.returncode == 0:
                break
        else:
            sys.exit(f"ffmpeg 失败：{r.stderr.strip()[:400]}")

        total = sum(d for _, d in frames)
        print(f"[snapshot] {len(frames)} 帧 / {total:.1f}s -> {args.out}")
        if not args.keep_frames:
            shutil.rmtree(args.tmpdir)
        return

    if args.mode == "capture":
        tl = capture(args.bin, args.cwd, args.home, args.cols, args.rows,
                     args.prompt, args.inject, args.total, args.shell)
        pickle.dump((args.cols, args.rows, tl), open(args.out, "wb"))
        print(f"[snapshot] 已写 {args.out}", file=sys.stderr)
    else:
        cols, rows, timeline = pickle.load(open(args.timeline, "rb"))
        for spec in args.shots.split(","):
            cutoff, path = spec.split("=", 1)
            render(replay(timeline, cols, rows, float(cutoff)), path,
                   quantize=not args.no_quantize)
            print(f"[snapshot] t={cutoff}s -> {path}")


if __name__ == "__main__":
    main()
