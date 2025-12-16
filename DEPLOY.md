# 部署指南

## 方案1：Vercel 部署（推荐）

Vercel 是最简单的部署方式，自动提供 HTTPS，国内访问速度快。

### 步骤：

1. **安装 Vercel CLI**（如果没有安装）
```bash
npm install -g vercel
```

2. **登录 Vercel**
```bash
vercel login
```

3. **部署项目**
```bash
cd "/Users/freedak/Documents/go-new/释放日记"
vercel --prod
```

4. **完成！** 
   - Vercel 会给你一个 `https://xxx.vercel.app` 的网址
   - 可以绑定自定义域名（可选）

### 使用网页部署（无需命令行）

1. 访问 [vercel.com](https://vercel.com)
2. 使用 GitHub/GitLab 账号登录
3. 点击 "Add New Project"
4. 导入你的 GitHub 仓库（需要先上传到 GitHub）
5. 点击 "Deploy"
6. 等待几分钟，完成！

---

## 方案2：GitHub Pages 部署

完全免费，但只支持静态网站。

### 步骤：

1. **初始化 Git 仓库**（如果还没有）
```bash
cd "/Users/freedak/Documents/go-new/释放日记"
git init
git add .
git commit -m "Initial commit"
```

2. **创建 GitHub 仓库**
   - 访问 [github.com/new](https://github.com/new)
   - 创建一个新仓库（如 `emotion-release-app`）

3. **推送代码**
```bash
git remote add origin https://github.com/你的用户名/emotion-release-app.git
git branch -M main
git push -u origin main
```

4. **启用 GitHub Pages**
   - 进入仓库的 Settings → Pages
   - Source 选择 `main` 分支
   - 点击 Save
   - 等待几分钟

5. **访问**
   - 网址：`https://你的用户名.github.io/emotion-release-app/`

---

## 方案3：Netlify 部署

也是免费的，功能类似 Vercel。

### 使用拖放部署（最简单）

1. 访问 [netlify.com](https://netlify.com)
2. 注册/登录
3. 将整个项目文件夹拖放到页面上
4. 完成！会得到一个 `https://xxx.netlify.app` 网址

---

## 部署后配置 AI API

无论使用哪种部署方式，都需要在应用的"设置"页面配置 AI API：

1. 打开部署后的网址
2. 进入"设置"页面
3. 填写：
   - **豆包 API**：
     - API 端点：`https://ark.cn-beijing.volces.com/api/v3/chat/completions`
     - API 密钥：你的豆包 API Key
     - 模型：`doubao-seed-1-6-251015`
   
   - **OpenAI API**：
     - API 端点：`https://api.openai.com/v1/chat/completions`
     - API 密钥：你的 OpenAI API Key
     - 模型：`gpt-3.5-turbo` 或 `gpt-4`

4. 保存设置

---

## 推荐方案

- **最简单**：Vercel 网页部署（无需命令行）
- **最快速**：Netlify 拖放部署
- **最稳定**：GitHub Pages

选择任何一个都可以！所有方案都：
- ✅ 完全免费
- ✅ 自动 HTTPS
- ✅ 国内可访问
- ✅ 支持豆包 API 调用

---

## 需要帮助？

如果遇到问题，可以：
1. 查看部署平台的文档
2. 检查浏览器控制台的错误信息
3. 确认 API 配置是否正确

