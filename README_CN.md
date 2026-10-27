# ReCode Online - 你的专业级算法练习管家

[English](./README.md)

> 本仓库是 [CoisiniIce/ReCode](https://github.com/CoisiniIce/ReCode) 的二次开发版本。ReCode 的设计与核心功能都出自原作者 **CCoisini（[@CoisiniIce](https://github.com/CoisiniIce)）**，我只是在它的基础上做了部署和一些个人化的改造。

---

## 致谢原作者

如果没有原作者的工作，就不会有这个仓库。下面这些都是 ReCode 原版就有的，也是我选择它的原因：

- 🧠 基于经典 SRS 改进的复习算法：根据自评掌握度（0-5 级）与题目难度，动态计算下一次复习的最佳时机。
- 📝 内置 `Monaco Editor`，支持全语种代码高亮，外加双栏实时预览的 `Markdown` 笔记。
- 🔢 支持 `LaTeX` 数学公式，方便记录复杂度分析、数学推导。
- 📊 掌握度分布图、今日任务聚焦、学习进度追踪。
- ✨ 精致的玻璃拟态界面、LeetCode 题目信息自动填充、中英双语界面，以及一键启动脚本。

提交历史中 CCoisini 的提交均原样保留。原项目未声明开源协议，本仓库仅供学习交流，**无任何商业用途**；如原作者认为不妥，请联系我，我会立即下架。

## 为什么要二开

一开始我只是想把 ReCode 部署到服务器上，原因有两个：

1. **在不同电脑之间流畅切换刷题。** 原版是本地运行，数据存在本机的 SQLite 文件里。我平时会在随身带的笔记本和家里的台式电脑上刷题，来回拷数据库文件很麻烦。部署到服务器后，两台电脑打开浏览器就是同一份进度。
2. **加入一些适合自己的元素。** 用了一段时间后，有一些顺手的小需求，比如一道题记录多种解法、按自己的作息划分「学习日」，就慢慢加了进去。

## 在原版基础上新增了什么

**部署上云**

- 登录鉴权与登录日志，可以放心地暴露在公网上。
- 推送到 `main` 后由 GitHub Actions 自动构建部署；每次迁移数据库前会先自动备份。
- 获取 `leetcode.cn` 题目信息时，如果遇到人机验证会自动改用真实浏览器，再不行回退到 `leetcode.com`。

**多用户**

- 每个账号的题目、进度、代码完全隔离；管理员可以开号、发放邀请码。
- 邀请码注册、邮箱验证、邮件找回密码、「记住我」、一键退出所有设备。

**刷题体验**

- 笔记改为「命名解法」列表：一道题可以记录多种解法，在弹窗中查看。
- 新建解法时直接从 LeetCode 自带的代码模板开始写。
- 「学习日」在凌晨 4 点切换，而不是按日历日期，熬夜刷题也不会算到第二天。
- 今天的复习清空后，首页会显示明天的待复习数，并可以提前复习。
- 首页显示待复习题目中掌握度低于 4 级的数量；点击掌握度分布图的柱子可以列出该级别的题目。
- 多解法挑战：随机抽一道有多种解法的题，逐个回忆每种解法，不影响复习排期。

**公开演示站**

- `DEMO_MODE=1` 时运行为演示站：访客一键获得独立的沙盒账号（预置示例题目，6 小时后自动清理）。
- 在线体验：<https://demo.recode.devwiles.online>

---

以下截图为原版界面：

![Home](./public/images/home.png)
![Questions](./public/images/questions.png)
![Review](./public/images/review.png)

## 技术架构

- 框架: `Next.js 16`
- 界面: `Tailwind CSS 4`, `Framer Motion`
- 数据库: `SQLite` + `Prisma`
- 核心组件: `Monaco Editor`, `React Markdown`, `KaTeX` 等
- 二开新增: `nodemailer`（验证邮件）、`playwright-core`（获取题目信息）

## 快速上手（本地运行）

### 环境准备

1. `Node.js` 20.x 或更高版本
   - Download: [Node.js Official Website](https://nodejs.org/) - LTS Version
2. `Git`
   - Download: [Git Official Website](https://git-scm.com/)

### 安装与运行 - 自动

- Windows: 双击根目录下的 `start_windows.bat`。
- Mac / Linux: 在终端执行 `chmod +x start_mac.sh && ./start_mac.sh`。

脚本会自动安装依赖、生成 `.env`、初始化数据库并启动。首次运行后还需要按下面第 4 步创建账号。

### 安装与运行 - 手动

#### 1. 克隆仓库

```bash
git clone https://github.com/DevWiles/ReCode-Online
cd ReCode-Online
```

想要原汁原味的单机版，请使用原项目：`git clone https://github.com/CoisiniIce/ReCode`。

#### 2. 安装依赖

```bash
npm install
```

注意：这可能需要一些时间。如果由于网络问题安装失败，请考虑使用镜像。

#### 3. 生成配置并初始化数据库

```bash
node scripts/init-env.mjs
npx prisma generate
npx prisma db push
```

`init-env.mjs` 会根据 `.env.example` 生成 `.env`，并写入随机的 `AUTH_SECRET`。其余配置项的说明见 `.env.example`。

#### 4. 创建账号

```bash
node --env-file=.env scripts/set-account.mjs 你的用户名
```

不指定密码时会自动生成一个强密码并打印出来，请妥善保存。

#### 5. 启动应用

```bash
npm run dev
```

打开 `http://localhost:3000` 登录。首次登录需要绑定邮箱：如果没有在 `.env` 中配置 SMTP，验证码会直接打印在运行 `npm run dev` 的终端里。

## FAQ

### Q1: 数据存储在哪里？

本地运行时，所有笔记、代码、复习进度都存储在 `prisma/dev.db` 文件中。

- 备份：定期将 `dev.db` 复制到安全位置即可。
- 迁移：更换电脑时，将该文件拷贝至新环境的 `prisma/` 目录下即可。

### Q2: 我能直接查看数据库内容吗？

数据库结构见 `prisma/schema.prisma`。如果想直接查看或修改底层数据，可以运行：

```bash
npx prisma studio
```

这将在浏览器中打开一个数据库管理器（不建议手动编辑）。

### Q3: 如果我遇到 `Module not found` 的错误该怎么办？

这通常是由于网络问题导致安装不完整。请删除 `node_modules` 文件夹，然后重新运行 `npm install`。

### Q4: 如何部署到自己的服务器？

`.github/workflows/deploy.yml` 会在推送到 `main` 后构建并通过 SSH 部署。需要在仓库的 Secrets 中配置 `SSH_PRIVATE_KEY`、`SERVER_HOST`、`SERVER_USER`，服务器端以 systemd 运行 `server.js`，环境变量写在 `/home/recode/app.env`（路径可在 workflow 中修改）。演示站的服务器初始化见 `scripts/setup-demo-server.sh`。

---

如果遇到问题，欢迎在 GitHub 上提 Issue。原版相关的问题，也可以前往 [CoisiniIce/ReCode](https://github.com/CoisiniIce/ReCode)。
