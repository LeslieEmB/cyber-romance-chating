# 赛博之恋

一款在你自己的电脑上运行的 AI 陪伴聊天应用。页面采用雨夜霓虹与像素信号视觉，人设与对话内容偏生活化；注册账号、人物设定和 DeepSeek 配置均留在本机。

## 当前能力

- 注册、登录、退出与昵称设置
- 聊天对象初始化：姓名、外观、性格、生活背景与相处风格
- DeepSeek 对话接入；未配置或调用失败时使用本地回复
- 偏好、边界、近况、事实四类记忆管理
- 设置页输入并测试 DeepSeek API Key
- 临时访客聊天体验，与正式账号数据隔离
- macOS 与 Windows 浏览器使用，桌面和移动尺寸界面适配

## 运行方式与隐私边界

本项目当前是 `Node.js + 浏览器` 的本地应用，不是双击安装的桌面安装包。启动后服务只监听 `127.0.0.1`，默认仅运行它的这台电脑能够访问。

本地数据位置：

| 内容 | 保存位置 | 说明 |
| --- | --- | --- |
| 账号、密码哈希、登录会话、人物设定 | `data/auth-store.json` | 不保存明文密码 |
| 设置页保存的 DeepSeek API Key | `data/provider-config.json` | 本机明文配置文件，不会在页面回显完整 Key |
| 聊天记录、记忆与界面设置 | 浏览器本地存储 | 按正式账号隔离 |
| 访客体验 | 临时浏览器状态 | 不写入账户文件 |

`data/auth-store.json`、`data/provider-config.json` 和 `.env.local` 均已被 Git 忽略。macOS/Linux 下应用写入的敏感 JSON 文件会限制为仅当前系统用户可读写；Windows 用户仍应将项目放在自己的用户目录，并不要与他人共享该文件夹。

## 环境要求

- [Node.js LTS](https://nodejs.org/) `20.9.0` 或更高版本
- Git，用于克隆与更新项目；也可以从 GitHub 下载 ZIP
- 可选：[DeepSeek API Key](https://platform.deepseek.com/)；不配置时仍可体验本地回复

检查 Node.js 与 npm 是否安装成功：

```bash
node --version
npm --version
```

## macOS 安装与启动

打开“终端”，执行：

```bash
git clone https://github.com/LeslieEmB/cyber-romance-chating.git
cd cyber-romance-chating
npm ci
npm run build
npm run start
```

浏览器访问：[http://127.0.0.1:3000](http://127.0.0.1:3000)

开发调试模式：

```bash
npm run dev
```

## Windows 安装与启动

安装 Node.js LTS 与 Git 后，打开 PowerShell，执行：

```powershell
git clone https://github.com/LeslieEmB/cyber-romance-chating.git
Set-Location cyber-romance-chating
npm ci
npm run build
npm run start
```

浏览器访问：[http://127.0.0.1:3000](http://127.0.0.1:3000)

开发调试模式：

```powershell
npm run dev
```

## 首次使用

1. 打开首页，选择“注册”，填写昵称、邮箱和密码。
2. 完成聊天对象初始化，进入聊天界面。
3. 打开“设置”，在“模型连接”中输入自己的 DeepSeek API Key。
4. 点击“测试并保存”；显示“已成功连接”后，新的聊天消息会使用 DeepSeek。

API Key 只应使用你自己的 Key。设置页保存成功后，Key 写入本机 `data/provider-config.json`；请勿将这个文件、截图或 Key 内容发送给他人。

## 可选：通过环境文件配置 DeepSeek

不使用设置页时，也可以创建 `.env.local`。设置页已经保存的配置优先于 `.env.local`。

macOS：

```bash
cp .env.example .env.local
```

Windows PowerShell：

```powershell
Copy-Item .env.example .env.local
```

编辑 `.env.local`：

```dotenv
DEEPSEEK_API_KEY=你的_API_Key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat
```

修改环境文件后，停止并重新启动本地服务。

## 更新项目

从 Git 安装的用户可以在项目目录执行：

macOS：

```bash
git pull
npm ci
npm run build
npm run start
```

Windows PowerShell：

```powershell
git pull
npm ci
npm run build
npm run start
```

更新前可以在应用“设置”中导出聊天与记忆数据。`git pull` 不会主动删除被忽略的 `data/` 本地配置文件。

## 自行验证

```bash
npm run test:auth
npm run test:provider
npm run test:status
npm run test:chat
npm run test:release
npm run test:memory
npm run lint
npm run build
```

这些检查覆盖账户与会话、敏感文件权限、DeepSeek 配置脱敏和鉴权、聊天降级、隐私模式、记忆逻辑、本机监听约束与生产构建。

## 常见问题

**端口 `3000` 已被占用**

改用另一个本机端口：

```bash
npm run start -- -p 3002
```

访问 `http://127.0.0.1:3002`。

**DeepSeek 无法连接**

检查 Key 是否有效、账户是否有可用额度、Base URL 是否为 `https://api.deepseek.com`，再在设置页重新点击“测试并保存”。

**换浏览器后聊天或记忆不见了**

聊天记录和记忆当前保存在原浏览器的本地存储中，不会随登录跨浏览器同步；更换前请先在设置页导出数据。

**想让手机访问电脑上的服务**

本版本出于 API Key 与个人聊天隐私考虑，默认禁止局域网访问。请勿随意改为公开监听地址，除非你理解同一网络中其他设备可能访问服务的风险。
