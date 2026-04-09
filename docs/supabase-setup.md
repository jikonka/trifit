# Supabase 设置指南（TriFit M3）

本指南将带你完成 Supabase 的注册、项目创建、数据库表配置和 RLS 安全策略设置。  
**全程使用 Supabase 网页 Dashboard 操作，不需要终端命令。**

---

## 第 1 步：注册 Supabase 账号

1. 打开浏览器，访问 **[https://supabase.com](https://supabase.com)**
2. 点击右上角 **Start your project**（或 **Sign Up**）
3. 选择 **Sign Up with GitHub**（推荐，最方便）
   - 如果没有 GitHub 账号，也可以用邮箱注册
4. 授权后会自动进入 Supabase Dashboard

> ✅ **免费计划** 不需要信用卡，提供 500MB 数据库、50,000 月活用户 (MAU)、1GB 存储，对我们的项目绰绰有余。

---

## 第 2 步：创建 Supabase 项目

1. 在 Dashboard 点击 **New Project**
2. 填写项目信息：
   - **Project Name**: `trifit`
   - **Database Password**: 设置一个强密码（记下来，以后可能需要）
   - **Region**: 选择离你最近的区域（如 `Northeast Asia (Tokyo)` 或 `Southeast Asia (Singapore)`）
3. 点击 **Create New Project**
4. 等待 1-2 分钟，项目创建完成

---

## 第 3 步：获取项目 URL 和 anon Key

1. 在项目 Dashboard 中，点击左侧菜单的 **⚙️ Project Settings**
2. 点击 **API** 标签页
3. 你会看到两个重要信息：
   - **Project URL**: 类似 `https://xxxxx.supabase.co`
   - **anon public key**: 一串长字符串（`eyJhbG...`）
4. **复制这两个值**，后面需要填入 `auth.js` 中

> 🔒 **安全说明**：anon key 是公开 key，可以安全地放在前端代码中。数据安全由 RLS（Row Level Security）策略保证，而不是靠隐藏这个 key。

---

## 第 4 步：创建数据库表

1. 在左侧菜单点击 **SQL Editor**（SQL 编辑器图标）
2. 点击 **New Query**
3. 将以下 SQL 完整复制粘贴到编辑器中：

```sql
-- =============================================
-- TriFit M3: Database Schema
-- =============================================

-- 1. profiles 表（用户档案 — 对应 trifit_profile）
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  age INTEGER,
  weight NUMERIC(5,1),
  height NUMERIC(5,1),
  gender TEXT CHECK (gender IN ('male', 'female', 'other', '')),
  level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced', 'elite', '')),
  max_hr INTEGER,
  rest_hr INTEGER,
  ftp INTEGER,
  swim_pace TEXT,
  bike_speed NUMERIC(5,1),
  run_pace TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. race_settings 表（比赛设置 — 对应 trifit_race）
CREATE TABLE race_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  date DATE,
  type TEXT CHECK (type IN ('sprint', 'olympic', 'half', 'full', 'super-sprint', 'custom', '')),
  goal_time TEXT,
  custom_swim TEXT,
  custom_bike TEXT,
  custom_run TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. equipment_settings 表（装备设置 — 对应 trifit_equipment）
CREATE TABLE equipment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  has_trainer BOOLEAN DEFAULT false,
  has_treadmill BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. settings_history 表（设置历史记录 — 审计日志）
CREATE TABLE settings_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL CHECK (change_type IN ('race', 'profile', 'equipment')),
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 创建索引
CREATE INDEX idx_race_settings_user ON race_settings(user_id);
CREATE INDEX idx_equipment_settings_user ON equipment_settings(user_id);
CREATE INDEX idx_settings_history_user ON settings_history(user_id);
CREATE INDEX idx_settings_history_created ON settings_history(user_id, created_at DESC);
```

4. 点击 **Run**（或按 `Ctrl+Enter`）
5. 应该看到 `Success. No rows returned` — 表示表创建成功

---

## 第 5 步：启用 RLS 并配置安全策略

继续在 SQL Editor 中，**新建一个查询**，粘贴以下 SQL：

```sql
-- =============================================
-- TriFit M3: Row Level Security (RLS) Policies
-- =============================================

-- 启用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE race_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings_history ENABLE ROW LEVEL SECURITY;

-- profiles: 用户只能操作自己的档案（不允许删除）
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- race_settings: 用户只能操作自己的比赛设置
CREATE POLICY "Users can view own races" ON race_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own races" ON race_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own races" ON race_settings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own races" ON race_settings FOR DELETE USING (auth.uid() = user_id);

-- equipment_settings: 用户只能操作自己的装备设置
CREATE POLICY "Users can view own equipment" ON equipment_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own equipment" ON equipment_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own equipment" ON equipment_settings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own equipment" ON equipment_settings FOR DELETE USING (auth.uid() = user_id);

-- settings_history: 只允许查看和新增（审计日志不可修改/删除）
CREATE POLICY "Users can view own history" ON settings_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own history" ON settings_history FOR INSERT WITH CHECK (auth.uid() = user_id);
-- 注意：没有 UPDATE 和 DELETE 策略 — 历史记录不可篡改
```

点击 **Run**，确认成功。

---

## 第 6 步：创建历史记录自动清理触发器

继续在 SQL Editor 中，**新建一个查询**：

```sql
-- =============================================
-- 防滥用：每个用户最多保留 50 条历史记录
-- 新增记录时自动清理最旧的
-- =============================================

CREATE OR REPLACE FUNCTION trim_settings_history()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM settings_history
  WHERE id IN (
    SELECT id FROM settings_history
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    OFFSET 50
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_trim_settings_history
  AFTER INSERT ON settings_history
  FOR EACH ROW
  EXECUTE FUNCTION trim_settings_history();
```

点击 **Run**，确认成功。

---

## 第 7 步：配置认证设置

1. 在左侧菜单点击 **Authentication**
2. 点击 **Providers** 标签
3. 确认 **Email** 已启用（默认就是启用的）
4. 点击 **Settings** 标签（在 Authentication 下）
5. 确认以下设置：
   - ✅ **Enable email confirmations** — 开启（注册后需要邮件确认）
   - **Minimum password length**: 设为 `8`

> 🔒 开启邮件确认可以防止假邮箱批量注册。

---

## 第 8 步：将 URL 和 Key 填入项目

拿到第 3 步中复制的两个值后，打开项目根目录的 `auth.js` 文件，找到顶部的配置区域：

```javascript
const SUPABASE_URL = 'https://你的项目.supabase.co';
const SUPABASE_ANON_KEY = '你的anon-key';
```

将你的值替换进去即可。

---

## 完成！🎉

现在你的 Supabase 后端已经配置好了：
- ✅ 4 张数据表已创建
- ✅ RLS 安全策略已启用（用户只能访问自己的数据）
- ✅ 历史记录自动清理触发器已设置（每用户最多 50 条）
- ✅ 邮箱确认已开启

接下来回到项目，刷新页面就可以使用注册/登录功能了！

---

## M4 补充：Activities 表（训练活动记录）

### 建表 SQL（含 Brick + T1/T2 换项）

在 SQL Editor 中运行：

```sql
-- 如需重建：DROP TABLE IF EXISTS activities CASCADE;

CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES activities(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'swim', 'bike', 'run',
    'brick',
    't1', 't2',
    'strength', 'other'
  )),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_min NUMERIC(6,1) CHECK (duration_min > 0),
  distance_m NUMERIC(10,1) CHECK (distance_m >= 0),
  avg_hr INTEGER CHECK (avg_hr > 0 AND avg_hr < 300),
  max_hr INTEGER CHECK (max_hr > 0 AND max_hr < 300),
  calories INTEGER CHECK (calories >= 0),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_activities_user ON activities(user_id);
CREATE INDEX idx_activities_user_date ON activities(user_id, date DESC);
CREATE INDEX idx_activities_user_type ON activities(user_id, activity_type);
CREATE INDEX idx_activities_parent ON activities(parent_id);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activities"
  ON activities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activities"
  ON activities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own activities"
  ON activities FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own activities"
  ON activities FOR DELETE USING (auth.uid() = user_id);
```

### 数据模型说明

- **独立训练**：`parent_id = NULL`，直接存储
- **Brick 训练**：父记录 `activity_type = 'brick'`，子段通过 `parent_id` 关联
- **换项**：`t1`（Swim→Bike）、`t2`（Bike→Run）作为 Brick 子段
- **查询单项**：`WHERE activity_type = 'bike'` 会同时返回独立 Bike + Brick 中的 Bike 段

---

## M5：FIT 文件导入功能

### 概述

Upload 页面现在支持直接拖放 Garmin `.fit` 文件，浏览器端解析并存入 Supabase `activities` 表。

### 技术实现

- **解析库**：Garmin 官方 FIT JavaScript SDK (`@garmin/fitsdk@21.200.0`)
- **加载方式**：通过 `esm.sh` CDN 以 ES Module 形式动态导入
- **处理流程**：`FileReader.readAsArrayBuffer()` → `Decoder.read()` → `extractActivitiesFromFit()` → `saveActivity()` / `saveBrickActivity()`

### 数据映射（FIT sport → activity_type）

| FIT Sport | activity_type |
|-----------|--------------|
| swimming / open_water_swimming / lap_swimming | swim |
| cycling / e_biking | bike |
| running | run |
| transition（第1次） | t1 |
| transition（第2次） | t2 |
| strength_training | strength |
| multisport | brick（自动创建父记录 + 子段） |
| 其他 | other |

### 多运动（Brick/Triathlon）自动识别

- 当 FIT 文件包含 **多个 session** 时，自动识别为 Brick 训练
- 创建 `activity_type = 'brick'` 的父记录
- 各 session 作为子段，通过 `parent_id` 关联
- Transition 会自动按顺序区分为 T1（Swim→Bike）和 T2（Bike→Run）

### 安全措施

- 文件大小限制：50MB（前端 + 后端双重校验）
- FIT 格式校验：`Decoder.isFIT()` 在解析前验证
- 文件名清理：`sanitizeText()` 过滤特殊字符防 XSS
- DOM 渲染：全部使用 `createElement` / `textContent`，零 `innerHTML`
- RLS 保护：所有写入通过已有 CRUD 函数，RLS 限制 `user_id = auth.uid()`
- CDN 版本锁定：`@21.200.0` 固定版本，防供应链攻击
- **级联删除**：删除 Brick 父记录时，所有子段自动删除

---

## M5 补充：source_file 字段（FIT 文件追踪）

### 概述

为 `activities` 表新增 `source_file` 列，记录每条活动是从哪个 FIT 文件导入的。  
用于：显示已上传文件列表、重复文件检测（覆盖/取消）、按文件删除。

### 迁移 SQL

在 SQL Editor 中运行：

```sql
-- 为 activities 表添加 source_file 列
ALTER TABLE activities ADD COLUMN IF NOT EXISTS source_file TEXT;

-- 添加索引以加速按文件名查询
CREATE INDEX IF NOT EXISTS idx_activities_source_file
  ON activities(user_id, source_file);
```

### 防重复唯一索引（推荐）

在 SQL Editor 中运行以下 SQL，防止同一个 FIT 文件被多次导入产生重复记录：

```sql
-- 创建唯一索引：同一用户、同一源文件、同一类型、同一日期只能有一条顶层记录
-- 注意：source_file 为 NULL 的手动录入活动不受此约束
CREATE UNIQUE INDEX IF NOT EXISTS idx_activities_unique_source
  ON activities(user_id, source_file, activity_type, date)
  WHERE source_file IS NOT NULL AND parent_id IS NULL;
```

### 清理已有重复数据

如果数据库中已存在重复记录，在创建唯一索引前需要先清理。有两种方式：

**方式 A：通过应用自动清理**（推荐）  
打开 Upload 页面，页面加载时会自动调用 `deduplicateActivities()` 清理重复数据。

**方式 B：通过 SQL 手动清理**  
```sql
-- 查看重复记录（不删除，先预览）
SELECT source_file, activity_type, date, COUNT(*) as cnt
FROM activities
WHERE source_file IS NOT NULL AND parent_id IS NULL
GROUP BY user_id, source_file, activity_type, date
HAVING COUNT(*) > 1;

-- 删除重复记录，保留每组最早创建的那条
DELETE FROM activities
WHERE id IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (
        PARTITION BY user_id, source_file, activity_type, date
        ORDER BY created_at ASC
      ) AS rn
    FROM activities
    WHERE source_file IS NOT NULL AND parent_id IS NULL
  ) sub
  WHERE rn > 1
);
```

### 说明

- `source_file` 存储经过 `sanitizeText()` 清理后的原始文件名（如 `2026-04-05-run.fit`）
- 手动添加的活动 `source_file = NULL`
- 查询某文件的所有顶层活动：`WHERE source_file = '...' AND parent_id IS NULL`
- 删除某文件的数据：删除顶层记录，子段通过 CASCADE 自动删除
