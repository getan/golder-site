#!/usr/bin/env python3
"""在真实 PTY 里驱动 `golder workspace`，录一条可渲染的时间线。

首屏视频的主线是 workspace 分屏：左边 agent 改代码，右边 shell 里跑测试。
按键（ctrl+b 前缀、方向键）和中文任务由本脚本按时间点写进 PTY；产出的
pickle 与 snapshot.py 的 capture 同格式，交给它的 render / video 出片。

环境：
  DEMO_BIN           演示用的 golder 二进制
  DEMO_CWD           演示项目目录（新 pane 跟随它）
  DEMO_HOME          演示进程的 HOME（隔离，不读真实家目录）
  DEMO_GOLDER_HOME   隔离的 GOLDER_HOME（trust.json、会话记录都写在这里）
  DEMO_OUT           时间线 pkl 输出路径（snapshot.py 的 --timeline 读它）
  DEMO_ARGV          workspace 参数，JSON 数组；默认 --shell 会话
  DEMO_STEPS         时间点脚本，JSON 数组：
                       {"t":9,"send":"\\u0002c"}          原样写入按键（\\u0002 = ctrl+b）
                       {"t":12,"type":"go test ./..."}     逐块慢速输入并回车
  DEMO_TOTAL         总录制秒数
  DEMO_SESSION       会话名（默认 demo）
  DEMO_COLS/ROWS     终端尺寸（默认 140x40）
  SHELL              pane 里跑的 shell（演示用 /bin/sh：没有 macOS 的 bash 提示语）

退出前不会替你停 daemon：录完用同一套 HOME/GOLDER_HOME 跑
`golder workspace stop <会话名>`，否则下一次 attach 会接上旧 pane。
"""

import fcntl
import json
import os
import pickle
import pty
import select
import signal
import struct
import sys
import termios
import time


def main() -> int:
    bin_path = os.environ["DEMO_BIN"]
    cwd = os.environ["DEMO_CWD"]
    home = os.environ["DEMO_HOME"]
    golder_home = os.environ["DEMO_GOLDER_HOME"]
    out = os.environ["DEMO_OUT"]
    session = os.environ.get("DEMO_SESSION", "demo")
    cols = int(os.environ.get("DEMO_COLS", "140"))
    rows = int(os.environ.get("DEMO_ROWS", "40"))
    total = float(os.environ.get("DEMO_TOTAL", "60"))
    steps = json.loads(os.environ.get("DEMO_STEPS", "[]"))
    argv = json.loads(os.environ.get("DEMO_ARGV", "null")) or [
        "workspace", "--shell", "-s", session, "-C", cwd,
    ]

    env = {
        "HOME": home,
        "PATH": os.environ["PATH"],
        "GOLDER_HOME": golder_home,
        "TERM": "xterm-256color",
        "LANG": "en_US.UTF-8",
        "LC_ALL": "en_US.UTF-8",
        "SHELL": os.environ.get("SHELL", "/bin/bash"),
    }
    for name in ("OPENCODE_API_KEY", "OPENAI_API_KEY"):
        if os.environ.get(name):
            env[name] = os.environ[name]

    size = struct.pack("HHHH", rows, cols, 0, 0)
    pid, fd = pty.fork()
    if pid == 0:
        fcntl.ioctl(1, termios.TIOCSWINSZ, size)
        os.chdir(cwd)
        os.execve(bin_path, [bin_path] + argv, env)

    fcntl.ioctl(fd, termios.TIOCSWINSZ, size)
    os.set_blocking(fd, False)

    t0 = time.monotonic()
    timeline = []
    next_step = 0
    while time.monotonic() - t0 < total:
        elapsed = time.monotonic() - t0
        while next_step < len(steps) and elapsed >= steps[next_step]["t"]:
            typed = steps[next_step].get("type", "")
            for i in range(0, len(typed), 3):
                os.write(fd, typed[i:i + 3].encode())
                time.sleep(0.03)
            if typed:
                os.write(fd, b"\r")
            payload = steps[next_step].get("send", "").encode()
            if payload:
                os.write(fd, payload)
            print(f"[workspace-drive] {elapsed:5.1f}s send {payload!r} type {typed!r}",
                  file=sys.stderr, flush=True)
            next_step += 1
        ready, _, _ = select.select([fd], [], [], 0.1)
        if ready:
            try:
                data = os.read(fd, 1 << 16)
            except OSError:
                continue
            if not data:
                break
            timeline.append((round(time.monotonic() - t0, 3), data))

    for sig in (signal.SIGTERM, signal.SIGKILL):
        try:
            os.kill(pid, sig)
            time.sleep(0.2)
        except ProcessLookupError:
            break
    pickle.dump((cols, rows, timeline), open(out, "wb"))
    print(f"[workspace-drive] {len(timeline)} blocks -> {out}", file=sys.stderr, flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
