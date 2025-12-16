# 自在释放 - 情绪释放应用

基于圣多纳释放法的情绪管理工具，帮助你识别、接纳和释放情绪。

## 功能特点

- 🌟 **情绪识别与释放**：通过圣多纳释放法的四个步骤，引导你释放负面情绪
- 📔 **情绪日记**：记录每次释放的过程和感受，追踪情绪变化趋势
- 💬 **AI对话**：与虚拟的莱斯特·莱文森对话，获得情绪管理的建议
- 📚 **智慧库**：收藏和学习圣多纳释放法的智慧内容
- ⚙️ **个性化设置**：支持多种AI模型（OpenAI、豆包等）

## 技术栈

- 纯前端应用（HTML + CSS + JavaScript）
- Tailwind CSS 样式框架
- ECharts 数据可视化
- Anime.js 动画库
- Marked.js Markdown渲染

## 本地运行

```bash
# HTTP 服务器
python3 -m http.server 8000

# HTTPS 服务器（推荐用于API调用）
python3 https_server.py
```

然后访问 `http://localhost:8000` 或 `https://localhost:8443`

## 部署

### 部署到 Vercel

1. Fork 或上传项目到 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 点击部署即可

### 部署到 GitHub Pages

1. 推送代码到 GitHub 仓库
2. 在仓库设置中启用 GitHub Pages
3. 选择主分支部署

## AI API 配置

应用支持以下AI服务：

- **OpenAI GPT**：在设置中填入 OpenAI API Key
- **字节豆包**：配置豆包的 API 端点和密钥
- 其他兼容 OpenAI 格式的 API

## 许可证

MIT License

## 致谢

本应用基于莱斯特·莱文森（Lester Levenson）的圣多纳释放法（Sedona Method）理论开发。

