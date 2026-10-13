#!/usr/bin/env python3
"""golder 演示录制的输入桥：把中文任务送进 golder 的输入框。

为什么需要它：vhs 的 Type / Paste 在注入非 ASCII 字符时会卡死（scripts/README.md
里有最小复现），而演示的任务是中文。所以 demo.tape 里只出现 ASCII —— 由它启动
本脚本，本脚本再在 golder 的 PTY 里把任务「打」进去。除此之外就是纯粹的字节
转发，ttyd 那一侧完全无感。

入口由 demo.tape 调用，一般不手工跑：
    python3 /tmp/demo/drive.py

环境（record-demo.sh 已备好）：
    DEMO_PROMPT        要注入的任务文本
    DEMO_CWD           演示项目目录（默认 /tmp/demo/slugkit）
    DEMO_INJECT_DELAY  等 splash 落定、输入框可用的秒数（默认 8）
"""
import fcntl
import os
import pty
import select
import struct
import sys
import termios
import time

PROMPT = os.environ.get("DEMO_PROMPT", "修复失败的测试用例，让 go test 全部通过")
CWD = os.environ.get("DEMO_CWD", "/tmp/demo/slugkit")
DELAY = float(os.environ.get("DEMO_INJECT_DELAY", "8"))
CHUNK, GAP = 3, 0.04  # 小步输入：整段一次性写入会被 TUI 当成粘贴折叠成 paste token


def winsize() -> bytes:
    try:
        cols, rows = os.get_terminal_size(0)
    except OSError:
        cols, rows = 140, 44
    return struct.pack("HHHH", rows, cols, 0, 0)


def type_prompt(fd: int) -> None:
    for i in range(0, len(PROMPT), CHUNK):
        os.write(fd, PROMPT[i:i + CHUNK].encode())
        time.sleep(GAP)
    os.write(fd, b"\r")


def reap(pid: int) -> int:
    try:
        os.waitpid(pid, 0)
    except ChildProcessError:
        pass
    return 0


def main() -> int:
    size = winsize()
    pid, fd = pty.fork()
    if pid == 0:  # 子进程：golder 本体，终端尺寸与 ttyd 的一致
        fcntl.ioctl(1, termios.TIOCSWINSZ, size)
        os.chdir(CWD)
        os.execvp("golder", ["golder"])

    fcntl.ioctl(fd, termios.TIOCSWINSZ, size)
    for f in (0, fd):
        try:
            os.set_blocking(f, False)
        except OSError:
            pass

    start, sent = time.monotonic(), False
    while True:
        try:
            readable, _, _ = select.select([0, fd], [], [], 0.2)
        except InterruptedError:
            continue
        for src in readable:
            try:
                data = os.read(src, 65536)
            except OSError:
                continue  # EAGAIN，或对端已关闭
            if not data:
                return reap(pid)
            try:
                os.write(1 if src == fd else fd, data)
            except OSError:
                return reap(pid)
        if not sent and time.monotonic() - start >= DELAY:
            type_prompt(fd)
            sent = True


if __name__ == "__main__":
    sys.exit(main())
