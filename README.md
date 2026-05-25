# Cyber Romance Chat

一款赛博朋克视觉风格的 AI 陪伴聊天应用。界面保留霓虹终端氛围，人物对话使用自然、生活化的中文表达。

## 功能

- 自定义人物姓名、性别表达、性格、生活背景与像素头像
- DeepSeek 聊天接入与本地降级回复
- 偏好、边界、近况、事实四类记忆管理
- 桌面与移动端适配的即时聊天界面

## 本地运行

```bash
npm install
cp .env.example .env.local
npm run dev
```

如需启用 DeepSeek，请在 `.env.local` 中填写自己的 `DEEPSEEK_API_KEY`。请勿将密钥提交到仓库。

## 验证

```bash
npm run lint
npm run test:memory
npm run build
```
