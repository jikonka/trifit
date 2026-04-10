# TriFit Architecture

## 1. 文档目的

这份文档用于说明 `TriFit` 当前版本的系统架构，覆盖：

- 系统边界与核心组件
- 前后端与数据库的职责分工
- 关键业务数据流（登录、设置、天气、上传 FIT、分析）
- 安全设计与已知风险
- 后续演进方向（M4~M8）

适用对象：
- 项目开发者
- 代码审阅者
- 想系统学习本项目架构的同学

---

## 2. 系统概览

TriFit 是一个以**静态前端 + BaaS（Supabase）+ 轻量后端代理**为核心的三铁训练应用。

### 2.1 技术栈

- **前端**：静态 HTML + Tailwind CSS（CDN）+ Chart.js（CDN）
- **认证与数据**：Supabase Auth + PostgreSQL + RLS
- **后端代理**：Node.js + Express（仅代理天气 API）
- **FIT 解析**：Garmin FIT SDK（`@garmin/fitsdk@21.200.0`，浏览器端 ESM 动态加载）

### 2.2 高层架构（逻辑视图）

```text
Browser (GitHub Pages)
  ├─ login.html / index.html / setup.html / upload.html / analysis.html
  ├─ auth.js（认证、会话、CRUD、缓存隔离、FIT导入编排）
  ├─ Supabase JS SDK
  └─ Garmin FIT SDK (esm.sh)
        │
        ├──────────────► Supabase (Auth + Postgres + RLS)
        │
        └──────────────► Weather Proxy (Render: Node/Express)
                               └────────► OpenWeatherMap API
```

---

## 3. 目录与组件职责

## 3.1 前端页面层

- `login.html`
  - 登录/注册 UI
  - 前端密码强度校验（注册态）
  - 登录失败锁定（5 次失败锁 60 秒）

- `index.html`
  - Dashboard 页面
  - 展示 race 倒计时、训练卡片、天气信息
  - 通过后端代理拉取天气

- `setup.html`
  - 用户基础信息（profile）、比赛信息（race）、装备信息（equipment）配置
  - 写入 Supabase，并记录设置历史

- `upload.html`
  - 手动训练录入（单项/Brick/T1/T2）
  - Garmin `.fit` 文件拖拽上传、解析、入库
  - 重复文件检测、覆盖导入、活动列表维护

- `analysis.html`
  - 读取活动数据做统计与图表分析（如心率区间、趋势等）

## 3.2 共享应用服务层

- `auth.js`（当前最核心模块）
  - Supabase 客户端初始化
  - 认证：`signUp` / `signIn` / `signOut` / `getSession` / `requireAuth`
  - 数据读写：`profiles`、`race_settings`、`equipment_settings`、`activities`、`settings_history`
  - FIT 导入编排：`importFitFile`、`extractActivitiesFromFit`、`saveActivity`、`saveBrickActivity`
  - 缓存与迁移：按用户隔离的 `localStorage` 缓存键（`trifit_*:<userId>`）及迁移逻辑

## 3.3 后端代理层

- `server/index.js`
  - 提供 `/api/weather` 代理
  - 保护 OpenWeatherMap 密钥（仅服务端持有）
  - 安全控制：CORS 白名单、`express-rate-limit`、Helmet、输入校验、错误处理

## 3.4 数据层（Supabase）

主要表（见 `docs/supabase-setup.md`）：

- `profiles`：用户个人信息（1:1）
- `race_settings`：比赛配置（按 `user_id` 隔离）
- `equipment_settings`：器材配置（按 `user_id` 隔离）
- `settings_history`：设置变更审计（append-only）
- `activities`：训练活动（支持独立活动 + Brick 父子结构 + source_file 追踪）

所有核心表启用 RLS，并按 `auth.uid()` 限制只访问本人数据。

---

## 4. 关键业务数据流

## 4.1 登录与会话保护

1. 页面加载后调用 `requireAuth()`（受保护页面）
2. `getSession()` 校验会话
3. 未登录跳转 `login.html`
4. 已登录则显示 `<main>`（防 FOUC），注入导航用户区
5. 执行迁移检查 `migrateLocalStorageData(user.id)`

## 4.2 设置保存与读取（Setup）

1. 前端收集 profile/race/equipment
2. 调用 `saveProfile` / `saveRace` / `saveEquipment`
3. 成功后写 `settings_history`
4. 后续读取使用 `loadProfile/loadRace/loadEquipment`
5. 若云端读取失败，使用**当前用户作用域缓存**兜底

## 4.3 Dashboard 天气流

1. `index.html` 发起天气请求到 `server/index.js` 的 `/api/weather`
2. 代理服务注入 API Key 调 OpenWeatherMap
3. 仅回传必要字段（不暴露 key）
4. 前端根据雨天 + 装备（trainer/treadmill）生成训练提醒

## 4.4 FIT 导入流（Upload）

1. 浏览器读取 `.fit` 为 `ArrayBuffer`
2. `importFitFile()` 做大小校验 / FIT 格式校验
3. Garmin SDK 解码 `session`
4. 映射到 `activities`（单项或 Brick 父子）
5. 写入 Supabase，记录 `source_file`
6. 去重策略：导入前检查 + 插入前检查 + 唯一约束冲突兜底

## 4.5 分析流（Analysis）

1. 加载用户活动 `loadActivities`
2. 聚合生成统计指标
3. 渲染图表
4. 使用 profile（如 maxHR）计算心率区间

---

## 5. 安全架构（当前基线）

## 5.1 数据隔离

- 数据库层：RLS 强制 `auth.uid()` 隔离
- 前端层：所有 Supabase 查询携带用户上下文（`id` / `user_id`）
- 缓存层：`localStorage` 使用 `trifit_*:<userId>`，避免跨账号串读

## 5.2 密钥与接口安全

- OWM API Key 仅在服务端环境变量
- 前端不保存第三方私密 key
- 代理层做 CORS、Rate Limit、参数校验、Helmet

## 5.3 前端安全

- 用户可控内容渲染优先 `textContent` / DOM API
- 避免对用户输入使用 `innerHTML`

## 5.4 审计与回溯

- `settings_history` 记录关键设置快照
- 策略上保持 append-only（不允许 UPDATE/DELETE）

## 5.5 失败降级（Fail-Secure）

- 云端查询异常时仅允许“当前用户缓存”兜底
- 不允许回退到全局共享缓存

---

## 6. 部署架构

- 前端：GitHub Pages（静态资源）
- 后端代理：Render（Node 18+）
- 数据与认证：Supabase Cloud

环境变量（示例）：

- 前端：`SUPABASE_URL`、`SUPABASE_ANON_KEY`（anon key 可公开）
- 后端：`OWM_API_KEY`、`ALLOWED_ORIGINS`

---

## 7. 已知限制与演进方向

## 7.1 当前限制

- `auth.js` 职责较重（认证、数据、导入、缓存都在一个文件）
- 目前主要是页面内脚本，模块化与自动化测试基础较弱
- 高并发/大规模数据场景尚未进入重点优化阶段

## 7.2 建议演进（按里程碑）

- **M4**：完善可视化指标和图表一致性
- **M5**：加强 FIT 异常文件处理与导入可观测性
- **M6**：引入 AI 训练计划服务边界（建议单独服务层）
- **M7**：性能、监控、告警与稳定性治理
- **M8**：架构复盘，沉淀 ADR（Architecture Decision Records）

---

## 8. 给第一次读架构文档的人（学习顺序）

建议按这个顺序看：

1. 先读本文件第 2、3 节（知道系统由哪些块组成）
2. 再读第 4 节数据流（知道请求如何走）
3. 再读第 5 节安全基线（知道哪些不能破）
4. 对照代码：`auth.js`、`upload.html`、`server/index.js`

如果你只记住一句话：

> TriFit 的核心是“前端编排 + Supabase 强隔离 + 服务端代理保密钥”，并通过用户级缓存隔离避免浏览器跨账号数据串读。
