# 贡献与上游同步

本仓库独立维护 Mac 版本。开新分支修改，尽量把 Mac、AI、日历或同步改动拆分成可审核的提交。修改后运行 npm run check，界面变更需在演示数据下人工验证。

上游：https://github.com/kfanbelinda-commits/luma-todo 。请保留 MIT 许可和原作者署名。

## 引入上游修改

本仓库从已检查的源码快照开始，未导入上游完整历史。可以添加只用于读取的 upstream remote：

```sh
git remote add upstream https://github.com/kfanbelinda-commits/luma-todo.git
git fetch upstream
git switch -c sync/upstream-change
```

检查上游提交内容后，将需要的具体提交 cherry-pick 到分支，或手动移植。不要直接覆盖 Mac 用户数据目录、AI 桥接或本仓库发布配置。解决冲突后运行检查并人工验证，再提交 PR。

向上游回馈时，在上游分支中单独移植可复用修改并提交 PR，不把本项目版本号与发行目标混入。

所有 PR 请说明行为变化、验证情况与尚未验证的限制。截图只使用演示数据，问题报告中不要附 API Key、同步凭据或个人数据目录。
