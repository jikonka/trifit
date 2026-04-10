# TriFit Academy: AI-Native Software Development

**融合 CMU 15-113 + Stanford CS146S + OpenAI Harness Engineering**

面向项目：TriFit — Garmin .FIT 文件驱动的智能铁人三项训练规划系统

---

## 课程信息

| 项目 | 详情 |
|---|---|
| **学员** | Zikun（零编程基础，按自己节奏推进） |
| **教练** | Senior Software Engineer / Architect |
| **工具** | CodeBuddy IDE (MacBook) |
| **项目** | Web App：.FIT 文件解析 → 数据可视化 → AI 训练计划 → 自适应调度 |
| **节奏** | 按里程碑顺序推进。不绑定固定周数，完成一个再进入下一个 |

---

## 三种范式的关系

```
Level 1: Spec-Driven（Stanford CS146S）
  人写 SPEC → AI 执行 → 人审查
  ✅ 比手写代码快 10 倍
  ❌ 文档是一次性的，写完就过时

Level 2: Agentic Workflow（CMU HW8）
  人写 SPEC → Agent 自主构建 → Agent 自我审查 → 人修复
  ✅ 引入了 Agent 自主性
  ❌ SPEC 仍是一次性指令

Level 3: Harness Engineering（OpenAI Codex 团队）
  人设计环境 → Agent 在环境中持续自主工作 → 环境自动约束质量
  ✅ AGENTS.md + 架构规则 + 测试 = 持续生效的活约束
  ✅ 人的杠杆最大化：改进环境 1 次 → Agent 永久受益
```

本课程策略：Level 1 起步 → Level 2 过渡 → Level 3 目标。每个 Milestone 标注当前范式级别。

---

## 技术栈

| 层级 | 技术 | 理由 |
|---|---|---|
| 框架 | Next.js (App Router) | 全栈一体，Vercel 部署一键 |
| 样式 | Tailwind CSS + shadcn/ui | 快速构建好看 UI |
| 图表 | Recharts | React 原生，学习曲线平缓 |
| 数据库 | Supabase (PostgreSQL) | 免费，内置 Auth + RLS |
| AI | Vercel AI SDK + OpenAI/Claude | Function Calling 原生支持 |
| 文件解析 | fit-file-parser (npm) | 最流行的 JS .FIT 解析库 |
| 部署 | Vercel | 与 Next.js 完美配合 |
| 监控 | Sentry (free tier) | 行业标准 |
| IDE | CodeBuddy | 主力工具 |

---

## Milestone 0: 环境搭建 + 认知对齐

**范式级别**：Level 0 — 还没开始写代码

### 📚 本阶段阅读

开始之前，先读/看这些材料建立基础认知：

| # | 材料 | 类型 | 时长 | 链接 |
|---|---|---|---|---|
| 1 | **Harness Engineering** | ⭐ 必读 | ~20 min | https://openai.com/index/harness-engineering/ |
| 2 | Deep Dive into LLMs（Andrej Karpathy） | 🎬 视频 | 前 30 min 即可 | https://www.youtube.com/watch?v=7xTGNNLPyMI |
| 3 | Prompt Engineering Overview | 📖 快读 | ~10 min | https://cloud.google.com/discover/what-is-prompt-engineering |
| 4 | CMU Project 1 Setup Guide | 📖 跟着做 | ~15 min | https://docs.google.com/document/d/19dzs0fms0RIMBOSR_jBEuCcZPb0OQQ7XnheptPycWFY/edit |
| 5 | GitHub Branches Guide | 📖 跟着做 | ~10 min | https://docs.google.com/document/d/13o1PkbUQiBx6jRxmok-9IcSSaaR3RyU--sryZ_VRd7Y/edit |

> **TA 提示**：材料 #1 是整门课的灵魂。第一遍不需要全懂——你会在 M7 重读它，届时你将有完全不同的理解。材料 #2 是 3 小时长视频，只需看前 30 分钟理解 "LLM 是什么" 即可。

### 🗣️ TA 指导

**这个 Milestone 你唯一要做的就是：把工具装好，确认都能跑通。**

不要学 HTML，不要学 CSS，不要学 JavaScript，不要学 Prompt Engineering。这些全部是后面的事。

具体步骤：

1. **安装 Git**
   - macOS 自带 Git，打开 Terminal 输入 `git --version`
   - 如果报错，安装 Xcode Command Line Tools：`xcode-select --install`
   - 成功标志：终端显示类似 `git version 2.x.x`

2. **创建 GitHub 账号**
   - 去 github.com 注册
   - 记住你的用户名，后面会反复用

3. **安装 Node.js**
   - 去 https://nodejs.org 下载 LTS 版本，按提示安装
   - 打开 Terminal 输入 `node --version` 验证
   - 成功标志：显示类似 `v20.x.x`

4. **配置 CodeBuddy IDE**
   - 打开 CodeBuddy，确保能创建和编辑文件

5. **创建仓库并上线**
   - 在 GitHub 创建名为 `trifit` 的仓库
   - Clone 到本地：`git clone https://github.com/你的用户名/trifit.git`
   - 创建 `index.html`，只写一行 `<h1>Hello TriFit</h1>`
   - `git add .` → `git commit -m "init: hello trifit"` → `git push`
   - 在 GitHub 仓库的 Settings → Pages → 选 main branch → Save
   - 等 1-2 分钟，访问 `https://你的用户名.github.io/trifit`
   - 看到 "Hello TriFit" = 成功 🎉

6. **创建 AGENTS.md**
   - 这是你在整个课程中写的最重要的文件之一
   - 它不是一次性的 SPEC，它是**持续生效的 Agent 操作手册**
   - 复制下面的模板，提交到仓库根目录

```markdown
# AGENTS.md

## Project Overview
TriFit: A web app that reads Garmin .FIT activity files, visualizes
performance data, generates AI-powered triathlon training plans,
and adapts schedules to real life.

## Tech Stack
- Framework: Next.js 14 (App Router)
- Database: Supabase (PostgreSQL + Auth + RLS)
- UI: Tailwind CSS + shadcn/ui
- Charts: Recharts
- AI: Vercel AI SDK
- File Parsing: fit-file-parser

## Architecture
See docs/architecture.md (TODO: create after Milestone 3)

## Conventions
- All components in src/components/, grouped by feature
- All API routes in src/app/api/
- Database queries go through src/lib/db/ — never call Supabase directly from components
- Environment variables in .env.local, never committed
- Commit messages: conventional commits (feat:, fix:, docs:, refactor:)

## Current Status
- [ ] M0: Environment setup ← YOU ARE HERE
- [ ] M1: Landing Page + Prompt skills
- [ ] M2: API integration (weather)
- [ ] M3: Backend + Auth + Database
- [ ] M4: Data visualization (Dashboard)
- [ ] M5: .FIT file parsing
- [ ] M6: AI training plan + Coach chat
- [ ] M7: Polish + Deploy + Monitor
- [ ] M8: Retrospective + Playbook
```

> **TA 提示**：AGENTS.md 以后每完成一个 Milestone 都要更新 Current Status。这不是"作业"，而是让 Agent 下次进来就知道你在哪。

### ✅ 完成标准
- [ ] 终端能运行 `git --version` 和 `node --version`
- [ ] GitHub 仓库 `trifit` 已创建
- [ ] `index.html` 的 Hello World 在 GitHub Pages 可访问
- [ ] `AGENTS.md` 已提交到仓库根目录
- [ ] 已通读 Harness Engineering 文章（不用全懂）

---

## Milestone 1: 第一个网页 + Prompt 技能

**范式级别**：Level 1 — Spec-Driven 初体验

### 📚 本阶段阅读

| # | 材料 | 类型 | 时长 | 链接 |
|---|---|---|---|---|
| 1 | **Claude Code Best Practices** | ⭐ 必读 | ~15 min | https://www.anthropic.com/engineering/claude-code-best-practices |
| 2 | Good Context Good Code | ⭐ 必读 | ~10 min | https://blog.stockapp.com/good-context-good-code/ |
| 3 | CMU HW2: Crossy Road（看作业设计思路） | ⭐ 必读 | ~10 min | https://www.cs.cmu.edu/~113/hw2.html |
| 4 | Prompt Engineering Guide（完整版） | 📖 选读 | 按需翻阅 | https://www.promptingguide.ai/techniques |
| 5 | AI Prompt Engineering Deep Dive | 🎬 选读 | ~30 min | https://www.youtube.com/watch?v=T9aRN5JkmL8 |
| 6 | CS146S: LLM Prompting Playground | 📖 选读 | 按需 | https://github.com/mihail911/modern-software-dev-assignments/tree/master/week1 |
| 7 | CS146S: First Steps in the AI IDE | 📖 选读 | 按需 | https://github.com/mihail911/modern-software-dev-assignments/tree/master/week2 |

> **TA 提示**：材料 #1 和 #2 是这个 Milestone 最重要的两篇——它们教你怎么"给 AI 好的上下文"。材料 #3 教你 CMU 的限时挑战思路。选读的可以之后有空再看。

### 🗣️ TA 指导

**这个 Milestone 有两个任务。先做 A 再做 B。**

**任务 A：TriFit Landing Page**

你要做的是：用 AI 帮你建一个"产品介绍页面"。这是你的第一次真正的 AI 辅助编程体验。

具体做法：
1. 在 CodeBuddy 中打开你的 `trifit` 项目
2. 用自然语言告诉 AI："我需要一个 TriFit 产品的 Landing Page，使用 HTML + Tailwind CSS。包含以下内容：项目介绍、四个功能卡片（FIT 文件解析 / 数据可视化 / AI 训练计划 / 自适应调度）、响应式设计。"
3. AI 会生成代码。**不要复制粘贴就跑**。花 5 分钟看看生成的结构——你不需要理解每一行，但试着理解"这段是头部"、"这段是卡片"、"这段控制颜色"
4. 改一些东西看看效果——换个颜色、改个标题、加一段文字
5. 部署到 Vercel 或更新 GitHub Pages

**任务 B：1 小时 Prompt 挑战（来自 CMU HW2）**

设好计时器，60 分钟内在 Landing Page 上加一个**配速计算器**（用户输入距离+时间 → 算出配速）。

**必须对比三种 Prompt 策略**（每种约 20 分钟）：
1. **Naive**：直接说 "帮我写一个配速计算器"
2. **Plan-Tweak-Execute**：先说 "我需要一个配速计算器，先给我一个实现方案，不要写代码"，然后逐步改方案，满意后再让它写代码
3. **Detailed Context**：给完整上下文——"在我的 TriFit landing page 上（使用 Tailwind CSS），添加一个配速计算器组件。输入：距离（km）和时间（HH:MM:SS）。输出：配速（min/km）。要求：输入验证、清晰的 UI、匹配现有页面风格。"

时间一到就停。不管做到什么程度。**重点不是结果，是你对三种策略的感受。**

做完后写 `PROMPT_HISTORY.md`：记录每种策略的 Prompt + AI 的反应 + 你的评价。

**🔑 Harness Engineering 习惯养成**

完成任务后问自己一个问题：

> 这次做的过程中，有没有什么信息我不得不反复告诉 AI？

如果有——比如"我用的是 Tailwind CSS"、"组件风格要和现有页面一致"——就把它写进 AGENTS.md 的 Conventions。下次 Agent 进来自己就知道了。

### ✅ 完成标准
- [ ] Landing Page 在线可访问
- [ ] 配速计算器功能可用
- [ ] `PROMPT_HISTORY.md`：三种策略对比 + 个人评价
- [ ] 至少 5 次 Git commit
- [ ] AGENTS.md 更新（Current Status + 可能新增的 Conventions）

---

## Milestone 2: API 集成 — 从外面拿数据

**范式级别**：Level 1 → 1.5 — 开始体会"环境设计"

### 📚 本阶段阅读

| # | 材料 | 类型 | 时长 | 链接 |
|---|---|---|---|---|
| 1 | **CMU HW3: Explore an API** | ⭐ 必读 | ~10 min | https://www.cs.cmu.edu/~113/hw3.html |
| 2 | How OpenAI Uses Codex (PDF) | 📖 选读 | ~20 min | https://cdn.openai.com/pdf/6a2631dc-783e-479b-b1a4-af0cfbd38630/how-openai-uses-codex.pdf |

> **TA 提示**：材料 #1 是 CMU 教"什么是 API"的作业说明，写得很适合入门。材料 #2 帮助你理解 Codex 团队的实际工作方式，和你现在做的事情有直接对照。

### 🗣️ TA 指导

**这个 Milestone 你要学会一件事：从互联网上"拿"数据回来显示在页面上。**

这叫做 "调 API"。简单理解：
- 你的页面发一个请求到别人的服务器："请给我北京今天的天气"
- 别人的服务器返回一段数据：`{ "temperature": 22, "humidity": 45, "wind": 12 }`
- 你把数据显示在页面上

具体做法：

1. **选一个天气 API**
   - 推荐 **Open-Meteo**（完全免费，不需要 API Key）→ https://open-meteo.com/
   - 或者 **OpenWeatherMap**（需要注册拿 API Key）→ https://openweathermap.org/api
   - 如果你是第一次，用 Open-Meteo，更简单

2. **告诉 AI 你要做什么**
   - "在 TriFit 页面上添加一个天气卡片，调用 Open-Meteo API 获取当前位置的温度、湿度、风速，并根据天气给出训练建议"

3. **如果你用了需要 Key 的 API**——这是本 Milestone 最重要的工程实践：
   - 创建 `.env.local` 文件存 API Key
   - 创建 `.env.example` 文件（只有变量名，没有值）
   - 确保 `.gitignore` 里有 `.env.local`
   - **绝对不要把 Key 推到 GitHub**

4. **更新 AGENTS.md**
   - 在 Conventions 中新增：`All secrets in .env.local. Never hardcode. .env.example tracks required variables.`

**🔑 Harness Engineering 视角**

你刚刚做了两件 Harness Engineering 的事：
1. `.env.example` = 给未来的 Agent 留下了上下文（它知道需要哪些环境变量）
2. AGENTS.md 新增的规则 = 持续生效的架构约束（以后 Agent 不会把密钥硬编码）

这不是文档负担。这是**杠杆投资**。

### ✅ 完成标准
- [ ] 页面显示实时天气数据
- [ ] `.env.local` + `.env.example` + `.gitignore` 正确配置（如用了 API Key）
- [ ] AGENTS.md 新增环境变量规则
- [ ] README 说明如何配置 API
- [ ] Prompt Log

---

## Milestone 3: 后端 + Auth + 数据库 — 构建系统骨架

**范式级别**：Level 2 — Agentic Workflow 初体验

### 📚 本阶段阅读

| # | 材料 | 类型 | 时长 | 链接 |
|---|---|---|---|---|
| 1 | **CMU HW4: Backend + Frontend** | ⭐ 必读 | ~15 min | https://www.cs.cmu.edu/~113/hw4.html |
| 2 | **How Long Contexts Fail** | ⭐ 必读 | ~10 min | https://www.dbreunig.com/2025/06/22/how-contexts-fail-and-how-to-fix-them.html |
| 3 | **OWASP Top Ten**（只看前 3 条） | ⭐ 必读 | ~10 min | https://owasp.org/www-project-top-ten/ |
| 4 | How Anthropic Uses Claude Code | 📖 选读 | ~20 min | https://www-cdn.anthropic.com/58284b19e702b49db9302d5b6f135ad8871e7658.pdf |
| 5 | CS146S: Coding with Claude Code | 📖 选读 | 按需 | https://github.com/mihail911/modern-software-dev-assignments/blob/master/week4/assignment.md |

> **TA 提示**：材料 #2 非常重要——它解释了为什么给 AI 塞太多上下文反而会变差。你在后面设计 AGENTS.md 时会直接用到这个洞察。材料 #3 只需要看前三大安全漏洞，建立安全意识即可。

### 🗣️ TA 指导

**这是整门课中最大最重要的 Milestone。你会从"静态网页"升级到"全栈系统"。分三步走，顺序非常重要。**

#### Step 1: 后端 API（先做这个）

目前你的页面是"前端直接显示数据"。从现在开始，数据要经过"后端服务器"中转。

为什么？
- 前端代码用户都能看到（打开浏览器开发者工具就行）
- 密钥、数据库操作、AI 调用都不应该在前端做
- 后端是你的"保险箱"

具体做法：
1. 用 Next.js API Routes 创建两个端点：
   - `POST /api/activities` — 接收一条训练数据
   - `GET /api/activities` — 返回所有训练数据列表
2. 前端用 `fetch()` 调用这两个端点
3. 暂时把数据存在内存里（一个数组），下一步才接数据库

告诉 AI："我要用 Next.js App Router 创建 API Routes。POST /api/activities 接收 JSON 格式的活动数据，GET /api/activities 返回所有活动。参考 AGENTS.md 中的架构约定。"

#### Step 2: 用户认证（然后做这个）

一旦有了后端 API，你必须立即回答一个问题：**谁在调用？**

如果不做认证，任何人都能往你的数据库里写数据、读数据。

具体做法：
1. 注册 Supabase 账号（https://supabase.com），创建项目
2. 启用 Supabase Auth（Email + Google 登录）
3. 在 Next.js 中集成 Supabase Auth
4. 所有 API Routes 添加 auth 检查：没有有效 Token → 返回 401

告诉 AI："集成 Supabase Auth 到我的 Next.js 项目。实现注册、登录、登出。所有 API 路由必须验证用户身份，未登录返回 401。"

#### Step 3: 数据库 + CRUD（最后做这个）

现在有了后端和认证，该把数据持久化到真正的数据库里了。

具体做法：
1. 在 Supabase Dashboard 创建表：
   ```
   activities: id(uuid), user_id(uuid), activity_type(text), date(date),
   duration_sec(int), distance_m(int), avg_hr(int), max_hr(int),
   calories(int), source(text), created_at(timestamptz)
   ```
2. 配置 Row Level Security (RLS)：`auth.uid() = user_id`
3. 把 Step 1 的内存数组替换为 Supabase 数据库调用
4. 前端做一个表单：手动录入训练活动
5. 前端做一个列表页：展示所有活动（支持删除、编辑）

**🔑 Harness Engineering 实践：创建 `docs/architecture.md`**

完成这三步后，创建架构文档并在 AGENTS.md 中指向它：

```markdown
# Architecture

## Layers (dependency direction: top → bottom)
UI (React Components)
  → API Routes (Next.js /api/)
    → Services (business logic)
      → Database (Supabase client)

## Rules
- Components NEVER call Supabase directly. Always go through API routes.
- API routes ALWAYS check auth before doing anything.
- All database tables have RLS enabled. No exceptions.
```

然后在 AGENTS.md 加一行：`Architecture: see docs/architecture.md`

### ✅ 完成标准
- [ ] 后端 API 至少 2 个端点可用
- [ ] 注册/登录/登出流程完整
- [ ] 数据库 CRUD 可用（手动录入表单 + 列表页）
- [ ] RLS 策略正确（用户 A 看不到用户 B 的数据）
- [ ] `docs/architecture.md` 创建
- [ ] AGENTS.md 更新（指向 architecture.md + 新 conventions）
- [ ] 代码提交 ≥ 10 次

---

## Milestone 4: 数据可视化 — Dashboard

**范式级别**：Level 2 — 熟练使用 Agentic Workflow

### 📚 本阶段阅读

| # | 材料 | 类型 | 时长 | 链接 |
|---|---|---|---|---|
| 1 | **CMU HW6: SQLite App**（看数据操作思路） | ⭐ 必读 | ~10 min | https://www.cs.cmu.edu/~113/hw6.html |
| 2 | **Recharts Getting Started** | ⭐ 必读 | ~15 min | https://recharts.org/en-US/guide |
| 3 | SQLite Examples Repo（参考代码结构） | 📖 选读 | 按需 | https://github.com/mtaylor-create/sqliteBasics |

> **TA 提示**：材料 #1 虽然是 SQLite 的作业，但核心教的是"怎么从数据库读数据做聚合然后展示"——和你要做的事情一样。材料 #2 是你实际要用的图表库。

### 🗣️ TA 指导

**到这里你已经有了后端 + Auth + 数据库 + 手动录入的训练数据。现在把数据变成图表。**

先手动录入至少 10-15 条活动数据（不同日期、不同运动类型、不同心率）。这些是你的"测试数据"。

然后构建 Dashboard 页面。告诉 AI 类似这样的话：

"在 TriFit 中创建一个 Dashboard 页面（/dashboard），使用 Recharts 展示以下图表：
1. 折线图：按周汇总的训练时长趋势
2. 饼图：各运动类型（swim/bike/run）的时间占比
3. 柱状图：各心率区间（Zone 1-5）的分布
数据从 /api/activities 获取。参考 AGENTS.md 和 docs/architecture.md 中的约定。"

关键要求：
- 图表组件只接收 data 作为 props，不自己 fetch（这是你在 AGENTS.md 中要写的规则）
- 有日期范围筛选器
- Hover 时显示 tooltip 详情

**🔑 Harness Engineering 实践：Data Flow Rules**

在 AGENTS.md 的 Conventions 中新增：

```
## Data Flow Rules
- Chart components receive data as props. They NEVER fetch data themselves.
- Data fetching happens in page-level or server components only.
- This ensures charts are reusable and testable.
```

### ✅ 完成标准
- [ ] 至少 3 种图表正常渲染（数据来自数据库）
- [ ] 日期筛选器 / 运动类型过滤可用
- [ ] Hover tooltip 工作正常
- [ ] AGENTS.md 新增 Data Flow Rules
- [ ] 演示视频或截图

---

## Milestone 5: .FIT 文件解析 — 读懂你的 Garmin

**范式级别**：Level 2 → 3 — 首次 Agentic Build，范式过渡的关键 Milestone

### 📚 本阶段阅读

| # | 材料 | 类型 | 时长 | 链接 |
|---|---|---|---|---|
| 1 | **CMU HW8: The Agentic Build** | ⭐ 必读 | ~15 min | https://www.cs.cmu.edu/~113/hw8.html |
| 2 | **Code Reviews: Just Do It** | ⭐ 必读 | ~10 min | https://blog.codinghorror.com/code-reviews-just-do-it/ |
| 3 | **How to Review Code Effectively** | ⭐ 必读 | ~15 min | https://github.blog/developer-skills/github/how-to-review-code-effectively-a-github-staff-engineers-philosophy/ |
| 4 | CMU HW7: Code Handoff（理解代码交接的重要性） | 📖 选读 | ~10 min | https://www.cs.cmu.edu/~113/hw7.html |
| 5 | CMU Project 2: Creative Web App（参考项目规模） | 📖 选读 | ~10 min | https://www.cs.cmu.edu/~113/project2.html |
| 6 | Context Rot（理解 AI 上下文退化现象） | 📖 选读 | ~15 min | https://research.trychroma.com/context-rot |
| 7 | CS146S: Writing Secure AI Code | 📖 选读 | 按需 | https://github.com/mihail911/modern-software-dev-assignments/blob/master/week6/assignment.md |
| 8 | CS146S: Code Review Reps | 📖 选读 | 按需 | https://github.com/mihail911/modern-software-dev-assignments/tree/master/week7 |

> **TA 提示**：这是阅读量最大的一个 Milestone，因为你在这里要学会一个完整的工作流。#1 是核心（CMU 的 Agentic Build 流程），#2 和 #3 教你怎么做 Code Review。其他可以按兴趣选读。

### 🗣️ TA 指导

**这是全课程的"高光 Milestone"——你要第一次完整走一遍 Agentic Build 流程。而且这里有一个关键转折：做完之后你会把 SPEC 里的经验提炼成 AGENTS.md 的规则，开始从 Level 2 过渡到 Level 3。**

**流程分四个 Phase，严格按顺序执行：**

#### Phase 1：你手写 SPEC（~45 分钟，禁止用 AI）

创建 `docs/fit-parser-spec.md`，自己手写以下内容（不要让 AI 帮你写 SPEC）：

- **功能描述**：.FIT 文件上传 UI（拖拽或选择文件）
- **解析字段**：session 摘要（运动类型、时长、距离、心率）、lap 数据（每圈拆分）
- **文件验证**：非 .FIT 文件 → 拒绝并提示
- **数据存储**：解析结果存入 `activities` + `activity_laps` 表
- **错误处理**：至少列出 3 种错误场景（文件损坏、字段缺失、超大文件）
- **验收标准**：5-8 条具体可测试的标准（例："上传有效 .FIT 文件后 activities 表新增一条记录"）

> **为什么禁止用 AI 写 SPEC？** 因为 SPEC 是你的"意图表达"——如果 AI 写了你的意图，你就把"导航权"交给了 AI。Harness Engineering 说的是"人类掌舵"——这就是掌舵。

#### Phase 2：Agent 构建（~2 小时）

把你写好的 SPEC 交给 CodeBuddy：
"请阅读 docs/fit-parser-spec.md 并实现其中描述的所有功能。同时参考 AGENTS.md 和 docs/architecture.md 中的项目约定。"

**尽量少干预**。但当你不得不干预时，记录下来：
- 我在第 X 分钟干预了
- 原因：Agent 做了 Y，但 SPEC 要求的是 Z
- 我的操作：告诉 Agent...

#### Phase 3：AI Code Review（~45 分钟）

**关键：新开一个 AI 会话**（不要在同一个对话里），确保审查者没有构建者的上下文。

告诉 AI："请阅读 docs/fit-parser-spec.md，然后审查当前代码库中 .FIT 相关的代码。找出不符合 SPEC 的地方、潜在 bug、安全问题和代码质量问题。输出一份审查报告。"

把报告保存为 `docs/fit-parser-review.md`。

#### Phase 4：修复 + Reflection + 规则提取

1. 根据 Review 修复关键问题
2. 写 `REFLECTION.md`（250-500 词）：Agent 做对了什么？哪里要干预？下次 SPEC 怎么改进？
3. **最关键的一步——从 SPEC 到活约束的过渡**：

> 回顾整个过程，找出你不得不"反复提醒 Agent"的规则，把它们写进 AGENTS.md。

例如，如果 Agent 总是忘记错误处理，加一条：
```
## Error Handling
- All parsing functions return { success: boolean, data?, error? } instead of throwing.
- Never let uncaught errors crash the app.
```

**这就是从 Level 2 到 Level 3 的关键动作。** SPEC 是一次性的。AGENTS.md 里的规则是永久的。

### ✅ 完成标准
- [ ] .FIT 文件上传 + 解析 + 存储功能完整
- [ ] 至少成功解析 3 个不同的真实 .FIT 文件
- [ ] Dashboard 图表能显示 .FIT 导入的数据
- [ ] `docs/fit-parser-spec.md` + `docs/fit-parser-review.md` + `REFLECTION.md`
- [ ] AGENTS.md 新增从 SPEC 提取的持久规则
- [ ] Git 提交 ≥ 3 次（Raw build → Review fixes → Polish）

---

## Milestone 6: AI 功能 — 训练计划 + 教练对话

**范式级别**：Level 3 — 完整的 Harness Engineering 实践

### 📚 本阶段阅读

| # | 材料 | 类型 | 时长 | 链接 |
|---|---|---|---|---|
| 1 | **Writing Effective Tools for Agents** | ⭐ 必读 | ~15 min | https://www.anthropic.com/engineering/writing-tools-for-agents |
| 2 | **OpenAI Function Calling 文档** | ⭐ 必读 | ~20 min | https://platform.openai.com/docs/guides/function-calling |
| 3 | **Vercel AI SDK 文档** | ⭐ 必读 | ~20 min | https://sdk.vercel.ai/docs |
| 4 | MCP Introduction | 📖 选读 | ~15 min | https://stytch.com/blog/model-context-protocol-introduction/ |
| 5 | Sample MCP Server Implementations | 📖 选读 | 按需 | https://github.com/modelcontextprotocol/servers |
| 6 | CS146S: Build a Custom MCP Server | 📖 选读 | 按需 | https://github.com/mihail911/modern-software-dev-assignments/blob/master/week3/assignment.md |

> **TA 提示**：#1 教你怎么给 AI Agent 设计好的工具接口。#2 是 Function Calling 的官方文档，你的 AI Coach Chat 要用到这个。#3 是你实际要用的 SDK。MCP 相关的材料现在读正好——你已经有了足够的后端经验来理解它了。

### 🗣️ TA 指导

**这个 Milestone 的核心转变：你不写 SPEC 了。你设计环境，让 Agent 自主工作。**

为什么？因为到了这里，你的 AGENTS.md + docs/architecture.md + Conventions 已经积累了足够多的规则。Agent 进来读一遍就知道该怎么做。你只需要补充一份简短的 Design Doc 说明"要做什么"，不需要像 SPEC 那样事无巨细。

#### 任务 A：AI Training Plan Generator

1. 创建 `docs/design-training-plan.md`（简短设计文档，不是 SPEC）：

```markdown
# Design: AI Training Plan Generator

## Goal
User fills in race goal + constraints → AI generates weekly training plan.

## Data Flow
User Input → POST /api/plans/generate → AI API (with system prompt)
→ Structured JSON → Store in DB → Render as calendar

## New Database Tables
- training_plans: id, user_id, plan_name, target_race, created_at
- plan_sessions: id, plan_id, date, type, duration, intensity, description

## AI System Prompt Requirements
- Role: Professional triathlon coach
- Follow periodization (Base → Build → Peak → Taper)
- Output must be valid JSON matching plan_sessions schema
- Include rest days
- Medical disclaimer in every response

## Constraints
- See docs/architecture.md for layer rules
- See AGENTS.md for error handling and data flow conventions
```

2. 然后告诉 Agent："Read docs/design-training-plan.md and AGENTS.md, then implement the AI Training Plan Generator feature."

注意和 M5 的区别：
- M5：你写了详细的 SPEC（包括验收标准、错误场景等）
- M6：你只写了 Design Doc（目标 + 数据流 + 约束），细节让 Agent 根据已有的 Conventions 自己决定

**如果 Agent 做得不好——不要直接干预代码。问自己：AGENTS.md 里缺了什么规则导致 Agent 做错了？补上规则，让 Agent 重新做。这就是杠杆思维。**

#### 任务 B：AI Coach Chat (Function Calling)

同样的模式——创建 `docs/design-coach-chat.md`，定义：
- Chat UI 界面需求
- System Prompt（教练人格 + 安全护栏 + 医疗免责）
- Tools（函数）定义：
  - `get_recent_activities(days, sport_type?)` → 查数据库
  - `get_current_plan()` → 查训练计划
  - `adapt_schedule(constraints[], reason)` → 调整计划
- 对话记忆策略（存最近 N 轮对话）

然后交给 Agent 实现。

### ✅ 完成标准
- [ ] AI 训练计划生成功能可用
- [ ] AI Coach Chat 可用（至少 3 个 Tools 连接数据库）
- [ ] AI 回答基于真实数据（手动验证几次对话）
- [ ] `docs/design-training-plan.md` + `docs/design-coach-chat.md`
- [ ] AGENTS.md 再次更新（新增 AI 相关 conventions）
- [ ] 安全护栏测试通过（医疗免责 + 危险建议拦截）

---

## Milestone 7: 打磨 + 部署 + 监控 — 生产就绪

**范式级别**：Level 3 — Harness Engineering 应用于运维

### 📚 本阶段阅读

| # | 材料 | 类型 | 时长 | 链接 |
|---|---|---|---|---|
| 1 | **Harness Engineering（重读！）** | ⭐ 必读 | ~20 min | https://openai.com/index/harness-engineering/ |
| 2 | **Introduction to Site Reliability Engineering** | ⭐ 必读 | ~20 min | https://sre.google/sre-book/introduction/ |
| 3 | Observability Basics | ⭐ 必读 | ~10 min | https://last9.io/blog/traces-spans-observability-basics/ |
| 4 | Lessons from millions of AI code reviews | 🎬 选读 | ~30 min | https://www.youtube.com/watch?v=TswQeKftnaw |
| 5 | SAST vs DAST | 📖 选读 | ~10 min | https://www.splunk.com/en_us/blog/learn/sast-vs-dast.html |

> **TA 提示**：材料 #1 现在重读 Harness Engineering——你会发现和 M0 时的理解完全不同。那时候是抽象概念，现在你亲身经历了从 SPEC 到环境设计的全过程。材料 #2 来自 Google 的 SRE 书，教你"怎么让生产环境保持可靠"。

### 🗣️ TA 指导

**你现在有了一个功能完整的 TriFit 应用。这个 Milestone 的目标是让它从"你自己能用"变成"可以给别人用"。**

按以下顺序做：

**A. UX 打磨**——让 AI 帮你逐个页面检查：
- 每个异步操作都有 Loading 状态吗？（图表加载、AI 生成、文件上传）
- 没有数据时页面显示什么？（空状态引导："上传你的第一个 .FIT 文件"）
- 出错时用户看到什么？（不是白屏或代码报错，而是友好提示）
- 手机上能用吗？

**B. 端到端测试**——自己走一遍完整流程：
1. 注册新账号 → 上传 .FIT 文件 → 看 Dashboard → 生成训练计划 → Chat 问问题
2. 记录每一个卡住或困惑的地方
3. 修复

**C. 部署到生产环境**
1. Vercel 部署（如果一直在 Vercel 上就只需确认配置）
2. 集成 Sentry（https://sentry.io）——故意触发一个错误，确认 Sentry 收到
3. 检查所有环境变量
4. 安全最终检查：RLS 在生产环境生效？密钥没泄露？HTTPS？

**D. 文档**
- 更新 `README.md`（项目截图 + 快速开始 + 技术栈）
- 更新 `docs/architecture.md` 到最新
- 更新 `AGENTS.md` 到最新
- 写 `LEARNINGS.md`（≥ 500 词，什么有效、什么无效、意外发现）

**E. Demo 视频**（3-5 分钟）

**🔑 Harness Engineering 实践：对抗熵增**

最后做一件事：让 AI 全面审查代码库，找出不一致的模式、旧的坏习惯，批量修复，然后把"好模式"写入 AGENTS.md。这就是原则 #6（持续重构对抗熵增）。

### ✅ 完成标准
- [ ] 所有页面有 Loading/Empty/Error 状态
- [ ] 端到端测试全部通过
- [ ] 生产环境在线 + Sentry 在线
- [ ] README + architecture + AGENTS.md 全部最新
- [ ] Demo 视频完成
- [ ] LEARNINGS.md（≥ 500 词）
- [ ] 代码库经过"熵清理"

---

## Milestone 8: 回顾 + Playbook — 把经验变成方法论

**范式级别**：Level 3 总结

### 📚 本阶段阅读

| # | 材料 | 类型 | 时长 | 链接 |
|---|---|---|---|---|
| 1 | **How to Do Great Work** | ⭐ 必读 | ~30 min | https://paulgraham.com/greatwork.html |
| 2 | Rossum's Universal Robots（AI 伦理的鼻祖科幻） | 📖 选读 | 按兴趣 | https://www.gutenberg.org/files/59112/59112-h/59112-h.htm |

> **TA 提示**：Paul Graham 的文章不是技术文章，而是关于"怎么做出好的作品"——在你刚刚完成一个从零到一的项目之后，读这篇文章会非常有共鸣。

### 🗣️ TA 指导

**恭喜走到这里。你从一个不会写代码的人，变成了一个能用 Harness Engineering 范式指挥 AI 构建全栈应用的人。**

这个 Milestone 没有代码任务。只有思考和写作。

#### 任务 A：项目自评

| 维度 | 自评 (1-10) | 证据 |
|---|---|---|
| 功能完整性 | ? | |
| 代码质量 | ? | |
| AI 集成深度 | ? | |
| Harness Engineering 实践 | ? | |
| 安全性 | ? | |
| 用户体验 | ? | |

#### 任务 B：Zikun's AI-Native Dev Playbook（≥ 1000 词）

这是你整门课最重要的产出之一。回答以下问题：

1. **AGENTS.md 演化史**：从 M0 到 M7 你的 AGENTS.md 经历了哪些变化？哪些 Convention 被证明最有价值？
2. **SPEC vs 环境设计**：M5 用了 SPEC，M6 用了 Design Doc。哪种更有效？在什么场景下选择哪种？
3. **干预模式**：你最常在什么地方需要干预 Agent？有规律吗？
4. **杠杆排名**：你花时间最值的事情是什么？排个序。
5. **信任校准**：你现在信任 AI 代码到什么程度？你的验证策略是什么？
6. **下一步**：做下一个项目，你的第一步会是什么？

#### 任务 C：决定 TriFit 的未来

- 方向 A：**发布给真实用户**（邀请 5-10 位铁友试用）
- 方向 B：**移动端拓展**（React Native / PWA）
- 方向 C：**开源**（写 Blog 分享经历）
- 方向 D：**开始下一个项目**（用学到的方法论快速启动）

### ✅ 完成标准
- [ ] 项目自评表完成
- [ ] Zikun's AI-Native Dev Playbook（≥ 1000 词）
- [ ] TriFit 下一步方向确定
- [ ] AGENTS.md 最终版本提交

---

## 附录：Milestone-课程对照矩阵

| Milestone | CMU 15-113 | Stanford CS146S | Harness Engineering 原则 |
|---|---|---|---|
| M0 环境搭建 | Project 1 Setup | W1 (LLM Intro) | #1 Repo=记录系统, #3 地图>百科 |
| M1 Landing+Prompt | Project 1 + HW2 | W1 (Prompting) + W2 (AI IDE) | 积累 Conventions |
| M2 API 集成 | HW3 (Explore API) | — | #4 架构强制（.env 管理）|
| M3 后端+Auth+DB | HW4 + HW6 | W4 (Agent Patterns) + W6 (Security) | #4 架构强制, #2 Agent可读性 |
| M4 可视化 | Project 2 | — | #4 Data Flow Rules |
| M5 .FIT 解析 | HW8 (Agentic Build) + HW7 | W6 (Secure Code) + W7 (Code Review) | SPEC → 持久规则过渡 |
| M6 AI 功能 | — | W2 (MCP) + W3 (MCP Server) + W4 (Function Calling) | #3 地图>百科, #5 杠杆思维 |
| M7 打磨+部署 | Project 3 | W9 (Post-Deploy) | #6 对抗熵增, #7 高吞吐 |
| M8 回顾 | — | W10 (Future) | 全部原则总结 |

---

*本课程基于 CMU 15-113 (Spring 2026)、Stanford CS146S、OpenAI Harness Engineering 融合编排。*
*核心范式：从 Spec-Driven → Agentic Workflow → Harness Engineering 的渐进式过渡。*
*所有原始课程材料版权归属各自机构。*
*最后更新：2026 年 4 月 4 日*
