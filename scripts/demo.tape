# golder 官网演示 —— VHS 录制脚本
#
# 不直接运行本文件，用 scripts/record-demo.sh 包装执行（它会准备隔离环境）。
# 相关约定：
#   - GOLDER_HOME 指向临时目录，绝不读写真实 ~/.golder
#   - 演示项目在 /tmp/demo/slugkit，任务：修复失败的 slug 测试
Output "/tmp/demo/raw.mp4"

Set Shell "bash"
Set FontSize 16
Set Width 1400
Set Height 800
Set Theme "GitHub Dark"
Set Padding 12
Set Framerate 30
Set TypingSpeed 70ms
Set BorderRadius 6
Set FontFamily "Menlo, PingFang SC, monospace"

# 1) 先亮出一张红着的测试
Type "cd /tmp/demo/slugkit" Enter
Sleep 600ms
Type "go test ./..." Enter
Sleep 2800ms

# 2) 启动 golder 全屏 TUI（splash 会打出 golder 字样），并把任务交给 agent。
#
# 中文任务不在 tape 里：vhs 的 Type / Paste 注入非 ASCII 字符会卡死（scripts/README.md
# 有最小复现），所以下面每一行都必须保持 ASCII；任务由 scripts/demo-drive.py 直接
# 写进 golder 的 PTY，它 8 秒后开始输入，之后把 ttyd 的按键原样转发给 golder。
Type "python3 /tmp/demo/drive.py" Enter
Sleep 188s

# 3) 干净退出（成片不含这一段；这一行由 drive.py 转发给 golder）
Type "/exit" Enter
Sleep 1500ms
