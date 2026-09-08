# Mac 试用发行流程

1. 在维护分支完成修改，更新 package.json、package-lock.json 和 CHANGELOG.md；保留上游 MIT 许可。
2. npm ci && npm run check，并在演示数据下运行实际 UI 检查。
3. npm run dist:mac，检查 Contents/Resources/app.asar 与当前代码一致，无个人数据或密钥。
4. 将 Luma Mac AI.app 使用标准 ZIP（保留符号链接）压缩，文件名包含版本和 arm64。
5. 用 macOS 解压工具实际解压，校验文件内容、符号链接与执行权限，生成 SHA256 校验文件。
6. 提交经过审核的源码并推送到本仓库，创建对应标签。
7. 创建 GitHub 预发布 Release，上传应用 ZIP 和 SHA256。说明未签名/公证及真实 API/语音/同步验证限制。
8. 从 GitHub 下载验证资产，确认标签对应发布源码。

不要把 node_modules、dist、用户数据、凭据或安装包提交到 Git。安装包通过 Releases 分发。发布不自动执行。
