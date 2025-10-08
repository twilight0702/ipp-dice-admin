# GitHub Secrets 设置指南

为了使 GitHub Actions CI/CD 工作流能够成功部署到服务器，您需要在 GitHub 仓库中设置以下 Secrets：

## 必需的 Secrets

1. **SERVER_HOST**
   - 服务器的 IP 地址或域名
   - 例如：`123.456.789.10` 或 `your-server.com`

2. **SERVER_USERNAME**
   - 用于 SSH 连接的用户名
   - 例如：`ubuntu`, `root` 或其他有权限的用户

3. **SERVER_SSH_KEY**
   - 用于 SSH 连接的私钥内容（不是文件路径）
   - 这应该是您用于连接服务器的 SSH 私钥的完整内容

## 如何设置 GitHub Secrets

1. 打开您的 GitHub 仓库
2. 点击 "Settings" 选项卡
3. 在左侧菜单中，点击 "Secrets and variables" 下的 "Actions"
4. 点击 "New repository secret" 按钮
5. 输入 Secret 名称（例如 `SERVER_HOST`）和对应的值
6. 点击 "Add secret" 保存
7. 重复步骤 4-6 添加所有必需的 Secrets

## 生成 SSH 密钥（如果需要）

如果您还没有 SSH 密钥，可以按照以下步骤生成：

```bash
# 生成新的 SSH 密钥对
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# 查看并复制公钥内容
cat ~/.ssh/id_rsa.pub

# 查看并复制私钥内容（这个内容需要添加到 GitHub Secrets 中的 SERVER_SSH_KEY）
cat ~/.ssh/id_rsa
```

将公钥（`id_rsa.pub`）添加到服务器的 `~/.ssh/authorized_keys` 文件中，将私钥内容（`id_rsa`）添加到 GitHub Secrets 的 `SERVER_SSH_KEY` 中。

## 环境变量

在 GitHub Actions 工作流中，我们已经设置了以下环境变量：

- `VITE_BASE_URL: /admin/` - 这确保应用程序在 `/admin/` 路径下正确运行

如果需要添加其他环境变量，可以在 `.github/workflows/deploy.yml` 文件的 `env` 部分进行添加。