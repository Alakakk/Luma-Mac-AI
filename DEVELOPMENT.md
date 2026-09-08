# 开发与验证

Node.js >=22.12，npm；当前 Mac 构建面向 arm64。先执行 npm ci。

- npm start：正常本地数据。
- npm run start:demo：独立演示数据，不要用真实数据测试删除。
- npm run check：语法、18 项单元测试及项目不变量。
- npm run dist:mac：生成 dist-ai/mac-arm64/Luma Mac AI.app，不自动发布。

## 代码入口

main.cjs 为 Electron 主进程，preload.cjs 提供受限桥接；src/app.js 维护原有日历/待办。
main/ai.cjs 管理加密 API 设置与网络请求；src/ai.js 为对话与设置 UI；src/ai-actions.js 负责动作校验和撤销；src/ai.css 控制同高布局。

## 实际界面测试

在 Mac 图形会话运行：

```sh
LUMA_SCREENSHOT_DIR=/tmp/luma-ui-check LUMA_BEHAVIOR_SMOKE=1 LUMA_AI_SMOKE=1 npm run start:demo
```

仅开发演示模式启用这些检查。API 请求单元测试使用模拟响应；真实 API 连接、系统听写和账号同步须另外验证。截图只能使用演示数据。

## 打包

electron-builder.mac.cjs 为 Mac 配置。应用 id 和用户数据目录沿用旧试用版，避免丢失已有数据。应用名改为 Luma Mac AI。
不打包 credentials.json；如开发者自行启用 Google OAuth，请配置桌面客户端，并将文件通过 extraResources 放入 Contents/Resources/credentials.json。不要提交个人令牌或密码。

本次维护不支持发布 Windows 包。保留的上游 Windows 配置仅作参考，不应作为已测试的发行目标。

发布前按 docs/RELEASING.md 执行。
