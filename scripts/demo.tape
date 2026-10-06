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

# 2) 启动 golder 全屏 TUI（splash 会打出 golder 字样）
Type "golder" Enter
Sleep 8s

# 3) 把任务交给 agent，留 180s 真实工作时间
Type "修复失败的测试用例，让 go test 全部通过" Enter
Sleep 180s

# 4) 干净退出（成片不含这一段）
Type "/exit" Enter
Sleep 1500ms
