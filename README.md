# Luma Mac AI

面向 macOS 的本地待办、日历与 AI 助手，由 [Alakakk](https://github.com/Alakakk) 独立维护。

基于 [Luma Todo](https://github.com/kfanbelinda-commits/luma-todo) 的 MIT 开源代码开发，保留原作者许可与署名。本项目维护 Mac 适配及 AI 功能，不是上游官方 Mac 发行版。

## 下载与运行

到 [Releases](https://github.com/Alakakk/Luma-Mac-AI/releases) 下载 `Luma-Mac-AI-1.4.0-mac-ai.1-arm64.zip`，完整解压后打开 `Luma Mac AI.app`。源码下载不能直接当作应用运行。

- 当前提供 **Apple 芯片 Mac（arm64）** 试用包，未验证 Intel Mac。
- 应用未做 Apple 开发者签名或公证；macOS 可能阻止首次打开。请确认下载来源，或自行从源码构建。不要关闭系统整体安全保护。
- 本版关闭自动更新，后续更新从本仓库 Releases 下载。
- 如果旧版 Luma Todo Mac Trial 正在运行，请从菜单退出，再打开新版；两者共享本地数据目录与单实例锁。

## 功能

- 本地待办、月历、周视图、LifeLog，分类管理和本地备份。
- Mac 透明窗口、置顶、菜单栏入口、编辑快捷键与正常退出。
- 右侧 AI 助手与待办区域同高，随窗口调整大小，内容独立滚动。
- AI 查询、新增、修改本地待办和日程，转移分类、创建分类及可恢复删除。
- 单条明确操作自动保存；批量操作先确认；操作记录可撤销，遇到后续编辑冲突不会覆盖。
- 设置中手动配置 API 地址、API Key 和模型；默认 DeepSeek，支持兼容的 Chat Completions 接口。

窗口较窄时，同时展开日历与助手会暂时隐藏月历；扩大窗口可恢复三栏。点击“✦ AI 助手”打开/收起面板。

本公开快照不附带演示照片或界面截图。

## 配置 AI

1. 打开「设置 → AI 助手与模型设置」，勾选启用。
2. 填入自己的 API Key。默认地址为 `https://api.deepseek.com`。
3. 选择或手动填写模型；也可点击「读取模型」。
4. 点击「测试连接」，成功后保存设置。

接口格式参考 [DeepSeek 官方文档](https://api-docs.deepseek.com/)。API 服务的收费、余额和模型权限由所选服务商决定。更换地址后需重新输入密钥，避免向新服务发送旧密钥。

输入示例：

- “明天下午三点和小王开会，半小时。”
- “把写方案移到工作分类。”
- “这周还有哪些待办没完成？”
- “删除刚才新增的那条。”

AI 不提供定时通知功能；已关联 Google/iCloud 的事项当前只允许通过 AI 查询，不能修改。

## 语音和同步的当前状态

| 功能 | 状态 |
| --- | --- |
| 本地待办、AI 布局及操作验证 | 已通过本地测试 |
| DeepSeek 真实账号调用 | 接口逻辑已用模拟响应测试，尚未做真实 Key 验证 |
| Mac 系统听写 | 已接入调用入口；本机测试未出现听写浮层，实际识别仍待验证 |
| Google 同步 | 未随包提供 `credentials.json`，当前不能直接连接 |
| iCloud 同步 | 保留上游代码，未做真实账号验收 |
| 开机启动、跨桌面行为 | 需进一步兼容性验收 |

系统听写需在 macOS「系统设置 → 键盘 → 听写」启用。转写后检查文字并发送，才会调用 AI。当前没有独立录音/语音转写服务。

## 数据与隐私

任务和 LifeLog 默认保存在本机 `~/Library/Application Support/luma-todo-mac-trial`；继续沿用此目录以兼容旧试用版。演示数据在 `luma-todo-mac-trial-demo` 中独立保存。

发送 AI 消息时，会向你配置的服务发送消息、最近对话和本地事项摘要。对话仅保留在当前运行会话，操作记录随本地数据保存。

API Key 使用 Electron `safeStorage` 加密，macOS 上由钥匙串支持，独立保存在 `ai-settings.enc`；不写入待办导出备份。仓库和发行包不包含用户数据、登录令牌、API Key 或同步凭据。

## 从源码运行

需要 Node.js 22.12 或以上兼容版本、npm，以及 macOS（构建 Mac 应用）。

```sh
git clone https://github.com/Alakakk/Luma-Mac-AI.git
cd Luma-Mac-AI
npm ci
npm start
```

```sh
npm run check       # 语法、单元测试和项目规则
npm run start:demo  # 独立演示数据
npm run dist:mac    # 本地 arm64 .app，不上传
```

构建产物位于 `dist-ai/mac-arm64/Luma Mac AI.app`。当前试用发行以手工验证后上传为准，CI 不会自动公开发布。

更多说明：[开发指南](DEVELOPMENT.md) · [贡献与上游同步](CONTRIBUTING.md) · [版本记录](CHANGELOG.md) · [隐私与问题反馈](SECURITY.md)。

## 致谢与许可

基础日历、待办及同步实现来自 Luma Todo，初始派生基于上游提交 `51ba1e1`。Mac 适配和 AI 助手在本仓库继续维护，欢迎把可复用改动回馈上游。

采用 [MIT License](LICENSE)。

公开源码不包含图片文件；自行构建时使用默认应用图标。
