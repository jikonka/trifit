/**
 * TriFit — auth.js
 * 公共认证与数据库模块
 * 
 * 所有页面通过 <script src="auth.js"> 引入
 * 依赖: Supabase JS CDN (必须在此脚本之前加载)
 * 
 * 功能:
 * - Supabase 客户端初始化
 * - 会话检查 + 未登录跳转
 * - 登录 / 注册 / 登出
 * - 数据库 CRUD (profiles / race_settings / equipment_settings)
 * - settings_history 插入与查询
 * - 导航栏用户信息注入
 * - localStorage 缓存同步与 fallback
 * - 首次登录数据迁移
 * - 防 FOUC (Flash of Unauthenticated Content)
 */

// =============================================
// 🔧 配置 — 在 Supabase Dashboard 获取
// =============================================
const SUPABASE_URL = 'https://nxcfvvaywbruwktsgdic.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54Y2Z2dmF5d2JydXdrdHNnZGljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MDY1MzMsImV4cCI6MjA5MTI4MjUzM30.eBoDWWkxGfbZXKNvhLDCaH4RsTFvPNsTY2bV3dufs70';

// =============================================
// 初始化 Supabase 客户端
// =============================================
const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =============================================
// 会话管理
// =============================================

/**
 * 获取当前用户会话
 * @returns {Promise<{session: object|null, user: object|null}>}
 */
async function getSession() {
  const { data: { session }, error } = await _supabase.auth.getSession();
  if (error) {
    console.error('[auth] getSession error:', error.message);
    return { session: null, user: null };
  }
  return { session, user: session?.user || null };
}

/**
 * 检查登录状态，未登录则跳转到 login.html
 * 同时处理防 FOUC: 确认登录后显示 <main>
 * @param {object} options
 * @param {boolean} options.redirect - 是否自动跳转 (默认 true)
 */
async function requireAuth(options = {}) {
  const { redirect = true } = options;
  const { session, user } = await getSession();

  if (!session) {
    if (redirect) {
      window.location.href = 'login.html';
    }
    return null;
  }

  // 防 FOUC: 显示隐藏的主内容
  const main = document.querySelector('main');
  if (main) {
    main.style.display = '';
  }

  // 注入用户信息到导航栏
  injectUserNav(user);

  // 首次登录时迁移 localStorage 数据
  await migrateLocalStorageData(user.id);

  return user;
}

// =============================================
// 认证操作
// =============================================

/**
 * 邮箱 + 密码注册
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
async function signUp(email, password) {
  // 根据当前部署环境构建确认邮件跳转地址
  const siteBase = window.location.origin + window.location.pathname.replace(/\/[^/]*$/, '');
  const { data, error } = await _supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: siteBase + '/',
    },
  });
  return { data, error };
}

/**
 * 邮箱 + 密码登录
 * @param {string} email 
 * @param {string} password 
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
async function signIn(email, password) {
  const { data, error } = await _supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
}

/**
 * 登出
 */
async function signOut() {
  await _supabase.auth.signOut();
  window.location.href = 'login.html';
}

// =============================================
// 导航栏用户信息注入
// =============================================

/**
 * 在导航栏右侧注入用户信息和登出按钮
 * 使用 DOM API (textContent / createElement) 防 XSS
 * @param {object} user - Supabase user object
 */
function injectUserNav(user) {
  if (!user) return;

  const email = user.email || '';
  const initial = email.charAt(0).toUpperCase();

  // === 桌面端导航栏 ===
  const desktopNav = document.querySelector('nav .hidden.md\\:flex');
  if (desktopNav) {
    // 检查是否已注入
    if (!desktopNav.querySelector('.trifit-user-area')) {
      const userArea = document.createElement('div');
      userArea.className = 'trifit-user-area flex items-center gap-3 ml-4 pl-4 border-l border-gray-700/50';

      // 头像圆圈
      const avatar = document.createElement('div');
      avatar.className = 'w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary';
      avatar.textContent = initial;

      // 邮箱
      const emailSpan = document.createElement('span');
      emailSpan.className = 'text-xs text-gray-400 max-w-[120px] truncate hidden lg:inline';
      emailSpan.textContent = email;

      // 登出按钮
      const logoutBtn = document.createElement('button');
      logoutBtn.className = 'text-gray-400 hover:text-red-400 transition-colors p-1';
      logoutBtn.title = 'Sign Out';
      logoutBtn.addEventListener('click', signOut);
      const logoutIcon = document.createElement('i');
      logoutIcon.className = 'fas fa-right-from-bracket text-sm';
      logoutBtn.appendChild(logoutIcon);

      userArea.appendChild(avatar);
      userArea.appendChild(emailSpan);
      userArea.appendChild(logoutBtn);
      desktopNav.appendChild(userArea);
    }
  }

  // === 移动端菜单 ===
  const mobileMenu = document.querySelector('nav [id$="Menu"], nav [id$="mobMenu"]');
  // 尝试更精确地找到移动端菜单
  const mobileMenuEl = document.getElementById('mobileMenu') || document.getElementById('mobMenu');
  if (mobileMenuEl && !mobileMenuEl.querySelector('.trifit-user-area-mobile')) {
    const mobileUserArea = document.createElement('div');
    mobileUserArea.className = 'trifit-user-area-mobile border-t border-gray-700/50 px-4 py-3';

    const userInfo = document.createElement('div');
    userInfo.className = 'flex items-center gap-3 mb-2';

    const mAvatar = document.createElement('div');
    mAvatar.className = 'w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary';
    mAvatar.textContent = initial;

    const mEmail = document.createElement('span');
    mEmail.className = 'text-sm text-gray-400 truncate';
    mEmail.textContent = email;

    userInfo.appendChild(mAvatar);
    userInfo.appendChild(mEmail);

    const mLogout = document.createElement('button');
    mLogout.className = 'block w-full text-left text-sm text-red-400 hover:text-red-300 py-2';
    mLogout.addEventListener('click', signOut);
    const mLogoutIcon = document.createElement('i');
    mLogoutIcon.className = 'fas fa-right-from-bracket mr-2';
    mLogout.appendChild(mLogoutIcon);
    mLogout.appendChild(document.createTextNode('Sign Out'));

    mobileUserArea.appendChild(userInfo);
    mobileUserArea.appendChild(mLogout);
    mobileMenuEl.appendChild(mobileUserArea);
  }
}

// =============================================
// 数据库 CRUD
// =============================================

/**
 * 保存个人档案到 Supabase (upsert)
 * @param {string} userId 
 * @param {object} profileData 
 */
async function saveProfile(userId, profileData) {
  const row = {
    id: userId,
    name: profileData.name || null,
    age: profileData.age ? parseInt(profileData.age) : null,
    weight: profileData.weight ? parseFloat(profileData.weight) : null,
    height: profileData.height ? parseFloat(profileData.height) : null,
    gender: profileData.gender || '',
    level: profileData.level || '',
    max_hr: profileData.maxHR ? parseInt(profileData.maxHR) : null,
    rest_hr: profileData.restHR ? parseInt(profileData.restHR) : null,
    ftp: profileData.ftp ? parseInt(profileData.ftp) : null,
    swim_pace: profileData.swimPace || null,
    bike_speed: profileData.bikeSpeed ? parseFloat(profileData.bikeSpeed) : null,
    run_pace: profileData.runPace || null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await _supabase
    .from('profiles')
    .upsert(row, { onConflict: 'id' });

  if (error) {
    console.error('[auth] saveProfile error:', error.message);
    throw error;
  }

  // 同步 localStorage 缓存
  localStorage.setItem('trifit_profile', JSON.stringify(profileData));
}

/**
 * 读取个人档案
 * @param {string} userId 
 * @returns {Promise<object|null>}
 */
async function loadProfile(userId) {
  try {
    const { data, error } = await _supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      throw error;
    }

    if (data) {
      // 转换为前端格式
      const profile = {
        name: data.name || '',
        age: data.age ? String(data.age) : '',
        weight: data.weight ? String(data.weight) : '',
        height: data.height ? String(data.height) : '',
        gender: data.gender || '',
        level: data.level || '',
        maxHR: data.max_hr ? String(data.max_hr) : '',
        restHR: data.rest_hr ? String(data.rest_hr) : '',
        ftp: data.ftp ? String(data.ftp) : '',
        swimPace: data.swim_pace || '',
        bikeSpeed: data.bike_speed ? String(data.bike_speed) : '',
        runPace: data.run_pace || '',
      };
      // 更新 localStorage 缓存
      localStorage.setItem('trifit_profile', JSON.stringify(profile));
      return profile;
    }
    return null;
  } catch (e) {
    console.warn('[auth] loadProfile failed, using localStorage fallback:', e.message);
    return JSON.parse(localStorage.getItem('trifit_profile') || 'null');
  }
}

/**
 * 保存比赛设置到 Supabase (upsert)
 * @param {string} userId 
 * @param {object} raceData 
 */
async function saveRace(userId, raceData) {
  // 先尝试获取现有记录
  const { data: existing } = await _supabase
    .from('race_settings')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .single();

  const row = {
    user_id: userId,
    name: raceData.name || null,
    date: raceData.date || null,
    type: raceData.type || '',
    goal_time: raceData.goalTime || null,
    custom_swim: raceData.customSwim || null,
    custom_bike: raceData.customBike || null,
    custom_run: raceData.customRun || null,
    updated_at: new Date().toISOString(),
  };

  if (existing && existing.id) {
    row.id = existing.id;
    const { error } = await _supabase
      .from('race_settings')
      .update(row)
      .eq('id', existing.id);
    if (error) {
      console.error('[auth] saveRace update error:', error.message);
      throw error;
    }
  } else {
    const { error } = await _supabase
      .from('race_settings')
      .insert(row);
    if (error) {
      console.error('[auth] saveRace insert error:', error.message);
      throw error;
    }
  }

  // 同步 localStorage 缓存
  localStorage.setItem('trifit_race', JSON.stringify(raceData));
}

/**
 * 读取比赛设置
 * @param {string} userId 
 * @returns {Promise<object|null>}
 */
async function loadRace(userId) {
  try {
    const { data, error } = await _supabase
      .from('race_settings')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (data) {
      const race = {
        name: data.name || '',
        date: data.date || '',
        type: data.type || '',
        goalTime: data.goal_time || '',
        customSwim: data.custom_swim || '',
        customBike: data.custom_bike || '',
        customRun: data.custom_run || '',
      };
      localStorage.setItem('trifit_race', JSON.stringify(race));
      return race;
    }
    return null;
  } catch (e) {
    console.warn('[auth] loadRace failed, using localStorage fallback:', e.message);
    return JSON.parse(localStorage.getItem('trifit_race') || 'null');
  }
}

/**
 * 保存装备设置到 Supabase (upsert)
 * @param {string} userId 
 * @param {object} equipData 
 */
async function saveEquipment(userId, equipData) {
  const { data: existing } = await _supabase
    .from('equipment_settings')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .single();

  const row = {
    user_id: userId,
    has_trainer: equipData.hasTrainer || false,
    has_treadmill: equipData.hasTreadmill || false,
    updated_at: new Date().toISOString(),
  };

  if (existing && existing.id) {
    row.id = existing.id;
    const { error } = await _supabase
      .from('equipment_settings')
      .update(row)
      .eq('id', existing.id);
    if (error) {
      console.error('[auth] saveEquipment update error:', error.message);
      throw error;
    }
  } else {
    const { error } = await _supabase
      .from('equipment_settings')
      .insert(row);
    if (error) {
      console.error('[auth] saveEquipment insert error:', error.message);
      throw error;
    }
  }

  localStorage.setItem('trifit_equipment', JSON.stringify(equipData));
}

/**
 * 读取装备设置
 * @param {string} userId 
 * @returns {Promise<object|null>}
 */
async function loadEquipment(userId) {
  try {
    const { data, error } = await _supabase
      .from('equipment_settings')
      .select('*')
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (data) {
      const equip = {
        hasTrainer: data.has_trainer || false,
        hasTreadmill: data.has_treadmill || false,
      };
      localStorage.setItem('trifit_equipment', JSON.stringify(equip));
      return equip;
    }
    return null;
  } catch (e) {
    console.warn('[auth] loadEquipment failed, using localStorage fallback:', e.message);
    return JSON.parse(localStorage.getItem('trifit_equipment') || 'null');
  }
}

// =============================================
// FIT 文件解析与数据映射
// =============================================

/**
 * 从 Garmin FIT SDK 解析结果中提取训练活动数据
 * 将 FIT sessions/records 映射为 activities 表结构
 * 
 * @param {object} fitMessages - Garmin FIT SDK decoder.read() 返回的 messages 对象
 * @param {string} fileName - 原始文件名（用于 notes 备注）
 * @returns {Array<object>} 可直接传给 saveActivity() 的数据数组
 */
function extractActivitiesFromFit(fitMessages, fileName) {
  const results = [];

  // FIT sport enum → 我们的 activity_type 映射
  const SPORT_MAP = {
    'swimming': 'swim',
    'cycling': 'bike',
    'running': 'run',
    'transition': 't1', // 后面会根据顺序区分 t1/t2
    'strength_training': 'strength',
    'generic': 'other',
    'training': 'other',
    'walking': 'other',
    'hiking': 'other',
    'e_biking': 'bike',
    'open_water_swimming': 'swim',
    'lap_swimming': 'swim',
    'multisport': 'brick',
  };

  // 数字 sport enum 映射（Garmin 设备有时返回数字而非字符串）
  const SPORT_NUM_MAP = {
    0: 'other',     // generic
    1: 'run',       // running
    2: 'bike',      // cycling
    3: 'other',     // transition (处理为独立换项时用)
    5: 'swim',      // swimming
    11: 'other',    // walking
    13: 'strength', // strength_training
    17: 'other',    // hiking
    20: 'strength', // floor_climbing
    23: 'swim',     // open_water_swimming
    26: 'swim',     // lap_swimming
    53: 'bike',     // e_biking
  };

  const sessions = fitMessages.sessionMesgs || fitMessages.sessions || [];

  if (sessions.length === 0) {
    // 没有 session，尝试从 activity 级别提取
    return results;
  }

  // 检测是否为多运动（brick/triathlon）
  const isMultiSport = sessions.length > 1;

  if (isMultiSport) {
    // 多运动：创建 brick 父记录 + 各段子记录
    const brickData = {
      activityType: 'brick',
      date: null,
      durationMin: 0,
      distanceM: 0,
      calories: 0,
      avgHr: null,
      maxHr: null,
      notes: 'FIT import: ' + sanitizeText(fileName),
    };

    const legs = [];
    let transitionCount = 0;

    for (const session of sessions) {
      const leg = mapSessionToActivity(session, SPORT_MAP, SPORT_NUM_MAP);

      // 累加到父记录
      if (!brickData.date) brickData.date = leg.date;
      brickData.durationMin += (leg.durationMin || 0);
      brickData.distanceM += (leg.distanceM || 0);
      brickData.calories += (leg.calories || 0);

      // 换项区分 T1 vs T2
      if (leg.activityType === 't1') {
        transitionCount++;
        leg.activityType = transitionCount <= 1 ? 't1' : 't2';
      }

      legs.push(leg);
    }

    // 四舍五入
    brickData.durationMin = Math.round(brickData.durationMin * 10) / 10;
    brickData.distanceM = Math.round(brickData.distanceM);
    brickData.calories = brickData.calories || null;

    results.push({ type: 'brick', parent: brickData, legs });
  } else {
    // 单运动
    const session = sessions[0];
    const activity = mapSessionToActivity(session, SPORT_MAP, SPORT_NUM_MAP);
    activity.notes = 'FIT import: ' + sanitizeText(fileName);
    results.push({ type: 'single', data: activity });
  }

  return results;
}

/**
 * 将单个 FIT session 消息映射为 activity 数据
 * @param {object} session - FIT SDK session message
 * @param {object} sportMap - 字符串 sport 映射表
 * @param {object} sportNumMap - 数字 sport 映射表
 * @returns {object} activity 数据
 */
function mapSessionToActivity(session, sportMap, sportNumMap) {
  // 识别运动类型
  let activityType = 'other';
  const sport = session.sport;
  if (typeof sport === 'string') {
    activityType = sportMap[sport.toLowerCase()] || 'other';
  } else if (typeof sport === 'number') {
    activityType = sportNumMap[sport] || 'other';
  }

  // 提取日期 — FIT SDK convertDateTimesToDates=true 时返回 JS Date
  let date = null;
  const ts = session.startTime || session.timestamp;
  if (ts instanceof Date) {
    date = ts.toISOString().split('T')[0];
  } else if (typeof ts === 'string') {
    date = ts.split('T')[0];
  } else {
    date = new Date().toISOString().split('T')[0];
  }

  // 时长（秒 → 分钟）
  const totalTimerTime = session.totalTimerTime || session.totalElapsedTime || 0;
  const durationMin = Math.round((totalTimerTime / 60) * 10) / 10;

  // 距离（FIT SDK 默认返回米，如设了 lengthUnit 可能是 km）
  let distanceM = session.totalDistance || null;
  if (distanceM !== null) {
    distanceM = Math.round(distanceM);
  }

  // 心率
  const avgHr = session.avgHeartRate || session.avgHr || null;
  const maxHr = session.maxHeartRate || session.maxHr || null;

  // 卡路里
  const calories = session.totalCalories || null;

  return {
    activityType,
    date,
    durationMin: durationMin || null,
    distanceM,
    avgHr: avgHr ? Math.round(avgHr) : null,
    maxHr: maxHr ? Math.round(maxHr) : null,
    calories: calories ? Math.round(calories) : null,
    notes: null,
  };
}

/**
 * 安全文本清理 — 去除潜在 XSS 载荷
 * 只保留文件名安全字符
 * @param {string} text
 * @returns {string}
 */
function sanitizeText(text) {
  if (!text) return '';
  // 只保留字母、数字、下划线、连字符、点、空格
  return text.replace(/[^a-zA-Z0-9_\-.\s]/g, '').substring(0, 100);
}

/**
 * 完整流程：解析 FIT ArrayBuffer → 存入 Supabase
 * 供 upload.html 调用
 * 
 * @param {ArrayBuffer} arrayBuffer - FIT 文件二进制数据
 * @param {string} fileName - 文件名
 * @param {string} userId - 当前用户 ID
 * @param {object} FitSDK - Garmin FIT SDK 模块 { Decoder, Stream }
 * @returns {Promise<{success: boolean, summary: object, error?: string}>}
 */
async function importFitFile(arrayBuffer, fileName, userId, FitSDK) {
  const { Decoder, Stream } = FitSDK;

  try {
    // 1. 文件大小校验（最大 50MB）
    if (arrayBuffer.byteLength > 50 * 1024 * 1024) {
      return { success: false, summary: null, error: 'File too large (max 50MB)' };
    }

    // 2. 创建 Stream
    const uint8Array = new Uint8Array(arrayBuffer);
    const stream = Stream.fromArrayBuffer(uint8Array.buffer);

    // 3. 校验 FIT 格式
    if (!Decoder.isFIT(stream)) {
      return { success: false, summary: null, error: 'Not a valid FIT file' };
    }

    // 4. 创建 Decoder 并解析
    const decoder = new Decoder(stream);
    const { messages, errors } = decoder.read({
      applyScaleAndOffset: true,
      expandSubFields: true,
      expandComponents: true,
      convertTypesToStrings: true,
      convertDateTimesToDates: true,
      mergeHeartRates: true,
    });

    if (errors && errors.length > 0) {
      console.warn('[FIT] Decode warnings:', errors);
    }

    // 5. 提取活动数据
    const activities = extractActivitiesFromFit(messages, fileName);

    if (activities.length === 0) {
      return { success: false, summary: null, error: 'No activity data found in FIT file' };
    }

    // 6. 存入 Supabase（每条 activity 都记录来源文件名）
    const safeFileName = sanitizeText(fileName);
    const savedItems = [];
    for (const item of activities) {
      if (item.type === 'brick') {
        item.parent.sourceFile = safeFileName;
        item.legs.forEach(leg => { leg.sourceFile = safeFileName; });
        const result = await saveBrickActivity(userId, item.parent, item.legs);
        savedItems.push({
          type: 'brick',
          date: item.parent.date,
          durationMin: item.parent.durationMin,
          legsCount: item.legs.length,
        });
      } else {
        item.data.sourceFile = safeFileName;
        const { data } = await saveActivity(userId, item.data);
        savedItems.push({
          type: item.data.activityType,
          date: item.data.date,
          durationMin: item.data.durationMin,
        });
      }
    }

    return {
      success: true,
      summary: {
        fileName: sanitizeText(fileName),
        activitiesCount: savedItems.length,
        items: savedItems,
      },
      error: null,
    };
  } catch (err) {
    console.error('[FIT] Import error:', err);
    return { success: false, summary: null, error: err.message || 'Unknown error' };
  }
}

// =============================================
// Activities CRUD（训练活动记录）
// =============================================

/**
 * 保存一条训练活动（独立训练或 Brick 子段）
 * @param {string} userId
 * @param {object} activityData
 * @param {string} activityData.activityType - swim/bike/run/brick/t1/t2/strength/other
 * @param {string} activityData.date - YYYY-MM-DD
 * @param {number} [activityData.durationMin]
 * @param {number} [activityData.distanceM]
 * @param {number} [activityData.avgHr]
 * @param {number} [activityData.maxHr]
 * @param {number} [activityData.calories]
 * @param {string} [activityData.notes]
 * @param {string} [activityData.parentId] - Brick 父记录 ID（子段必填）
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
async function saveActivity(userId, activityData) {
  const row = {
    user_id: userId,
    parent_id: activityData.parentId || null,
    activity_type: activityData.activityType,
    date: activityData.date || new Date().toISOString().split('T')[0],
    duration_min: activityData.durationMin ? parseFloat(activityData.durationMin) : null,
    distance_m: activityData.distanceM ? parseFloat(activityData.distanceM) : null,
    avg_hr: activityData.avgHr ? parseInt(activityData.avgHr) : null,
    max_hr: activityData.maxHr ? parseInt(activityData.maxHr) : null,
    calories: activityData.calories ? parseInt(activityData.calories) : null,
    notes: activityData.notes || null,
    source_file: activityData.sourceFile || null,
  };

  const { data, error } = await _supabase
    .from('activities')
    .insert(row)
    .select()
    .single();

  if (error) {
    console.error('[auth] saveActivity error:', error.message);
    throw error;
  }
  return { data, error: null };
}

/**
 * 保存一次完整的 Brick 训练（父记录 + 所有子段，含 T1/T2）
 * 事务性：先插入 Brick 父记录，再插入所有子段
 * @param {string} userId
 * @param {object} brickData - 父记录数据（activityType 固定为 'brick'）
 * @param {Array<object>} legs - 子段数组，按顺序（如 [swim, t1, bike, t2, run]）
 * @returns {Promise<{parent: object, legs: Array}>}
 */
async function saveBrickActivity(userId, brickData, legs) {
  // 1. 插入 Brick 父记录
  const { data: parent } = await saveActivity(userId, {
    ...brickData,
    activityType: 'brick',
  });

  // 2. 插入所有子段，绑定 parentId
  const savedLegs = [];
  for (const leg of legs) {
    const { data: savedLeg } = await saveActivity(userId, {
      ...leg,
      parentId: parent.id,
      date: brickData.date, // 子段继承父记录日期
    });
    savedLegs.push(savedLeg);
  }

  return { parent, legs: savedLegs };
}

/**
 * 加载训练活动列表
 * @param {string} userId
 * @param {object} [options]
 * @param {string} [options.type] - 按运动类型筛选 (swim/bike/run/brick/t1/t2/strength/other)
 * @param {string} [options.from] - 起始日期 (YYYY-MM-DD)
 * @param {string} [options.to] - 结束日期 (YYYY-MM-DD)
 * @param {boolean} [options.topLevelOnly] - 只返回顶层记录（不含 Brick 子段）
 * @param {boolean} [options.includeLegs] - 同时返回 Brick 子段（默认 false）
 * @param {number} [options.limit] - 返回条数限制（默认 50）
 * @returns {Promise<Array>}
 */
async function loadActivities(userId, options = {}) {
  const { type, from, to, topLevelOnly = false, includeLegs = false, limit = 50 } = options;

  try {
    let query = _supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    // 按运动类型筛选
    if (type) {
      query = query.eq('activity_type', type);
    }

    // 按日期范围筛选
    if (from) {
      query = query.gte('date', from);
    }
    if (to) {
      query = query.lte('date', to);
    }

    // 只返回顶层记录（排除 Brick 子段）
    if (topLevelOnly) {
      query = query.is('parent_id', null);
    }

    const { data, error } = await query;
    if (error) throw error;

    // 如果需要同时加载 Brick 子段
    if (includeLegs && data) {
      const brickIds = data
        .filter(a => a.activity_type === 'brick')
        .map(a => a.id);

      if (brickIds.length > 0) {
        const { data: legs, error: legsError } = await _supabase
          .from('activities')
          .select('*')
          .in('parent_id', brickIds)
          .order('created_at', { ascending: true });

        if (legsError) throw legsError;

        // 把子段挂到对应的 Brick 父记录上
        const legsMap = {};
        for (const leg of (legs || [])) {
          if (!legsMap[leg.parent_id]) legsMap[leg.parent_id] = [];
          legsMap[leg.parent_id].push(leg);
        }
        for (const activity of data) {
          if (activity.activity_type === 'brick') {
            activity.legs = legsMap[activity.id] || [];
          }
        }
      }
    }

    return data || [];
  } catch (e) {
    console.warn('[auth] loadActivities failed:', e.message);
    return [];
  }
}

/**
 * 加载某个运动类型的所有数据（含独立训练 + Brick 中的对应子段）
 * 用于图表分析：如查询所有 Bike 数据，会同时返回独立 Bike 和 Brick 里的 Bike 段
 * @param {string} userId
 * @param {string} type - swim/bike/run/t1/t2
 * @param {object} [options]
 * @param {string} [options.from] - 起始日期
 * @param {string} [options.to] - 结束日期
 * @param {number} [options.limit] - 返回条数限制（默认 100）
 * @returns {Promise<Array>}
 */
async function loadActivitiesByType(userId, type, options = {}) {
  const { from, to, limit = 100 } = options;

  try {
    let query = _supabase
      .from('activities')
      .select('*')
      .eq('user_id', userId)
      .eq('activity_type', type)
      .order('date', { ascending: false })
      .limit(limit);

    if (from) query = query.gte('date', from);
    if (to) query = query.lte('date', to);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.warn('[auth] loadActivitiesByType failed:', e.message);
    return [];
  }
}

/**
 * 删除一条训练活动
 * 如果是 Brick 父记录，子段会通过数据库 CASCADE 自动删除
 * @param {string} activityId
 * @returns {Promise<void>}
 */
async function deleteActivity(activityId) {
  const { error } = await _supabase
    .from('activities')
    .delete()
    .eq('id', activityId);

  if (error) {
    console.error('[auth] deleteActivity error:', error.message);
    throw error;
  }
}

/**
 * 获取当前用户所有已上传的 FIT 文件名列表（去重）
 * 返回每个文件名及其关联的顶层 activity 数量、最早日期
 * @param {string} userId
 * @returns {Promise<Array<{fileName: string, count: number, firstDate: string, lastDate: string}>>}
 */
async function loadUploadedFiles(userId) {
  try {
    const { data, error } = await _supabase
      .from('activities')
      .select('source_file, date, created_at')
      .eq('user_id', userId)
      .not('source_file', 'is', null)
      .is('parent_id', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // 按 source_file 聚合
    const fileMap = {};
    for (const row of (data || [])) {
      const fn = row.source_file;
      if (!fn) continue;
      if (!fileMap[fn]) {
        fileMap[fn] = { fileName: fn, count: 0, firstDate: row.date, lastDate: row.date, latestCreatedAt: row.created_at };
      }
      fileMap[fn].count++;
      if (row.date < fileMap[fn].firstDate) fileMap[fn].firstDate = row.date;
      if (row.date > fileMap[fn].lastDate) fileMap[fn].lastDate = row.date;
    }

    // 按最近上传时间排序
    return Object.values(fileMap).sort((a, b) =>
      (b.latestCreatedAt || '').localeCompare(a.latestCreatedAt || '')
    );
  } catch (e) {
    console.warn('[auth] loadUploadedFiles failed:', e.message);
    return [];
  }
}

/**
 * 检查某个文件名是否已存在于用户的活动中
 * @param {string} userId
 * @param {string} fileName - 清理后的文件名
 * @returns {Promise<boolean>}
 */
async function checkFileExists(userId, fileName) {
  try {
    const safeName = sanitizeText(fileName);
    const { data, error } = await _supabase
      .from('activities')
      .select('id')
      .eq('user_id', userId)
      .eq('source_file', safeName)
      .is('parent_id', null)
      .limit(1);

    if (error) throw error;
    return (data && data.length > 0);
  } catch (e) {
    console.warn('[auth] checkFileExists failed:', e.message);
    return false;
  }
}

/**
 * 按文件名删除所有关联的活动（含 Brick 子段通过 CASCADE 自动删除）
 * @param {string} userId
 * @param {string} fileName - 清理后的文件名
 * @returns {Promise<number>} 删除的顶层记录数
 */
async function deleteActivitiesByFile(userId, fileName) {
  try {
    const safeName = sanitizeText(fileName);

    // 先查出所有顶层记录 ID
    const { data: topLevel, error: queryError } = await _supabase
      .from('activities')
      .select('id')
      .eq('user_id', userId)
      .eq('source_file', safeName)
      .is('parent_id', null);

    if (queryError) throw queryError;
    if (!topLevel || topLevel.length === 0) return 0;

    // 逐个删除顶层记录（子段通过 CASCADE 自动删除）
    for (const record of topLevel) {
      await deleteActivity(record.id);
    }

    return topLevel.length;
  } catch (e) {
    console.error('[auth] deleteActivitiesByFile error:', e.message);
    throw e;
  }
}

/**
 * 更新一条训练活动
 * @param {string} activityId
 * @param {object} updates - 要更新的字段
 * @returns {Promise<object>}
 */
async function updateActivity(activityId, updates) {
  const row = {};
  if (updates.activityType !== undefined) row.activity_type = updates.activityType;
  if (updates.date !== undefined) row.date = updates.date;
  if (updates.durationMin !== undefined) row.duration_min = updates.durationMin ? parseFloat(updates.durationMin) : null;
  if (updates.distanceM !== undefined) row.distance_m = updates.distanceM ? parseFloat(updates.distanceM) : null;
  if (updates.avgHr !== undefined) row.avg_hr = updates.avgHr ? parseInt(updates.avgHr) : null;
  if (updates.maxHr !== undefined) row.max_hr = updates.maxHr ? parseInt(updates.maxHr) : null;
  if (updates.calories !== undefined) row.calories = updates.calories ? parseInt(updates.calories) : null;
  if (updates.notes !== undefined) row.notes = updates.notes || null;

  const { data, error } = await _supabase
    .from('activities')
    .update(row)
    .eq('id', activityId)
    .select()
    .single();

  if (error) {
    console.error('[auth] updateActivity error:', error.message);
    throw error;
  }
  return data;
}

// =============================================
// 设置历史记录
// =============================================

/**
 * 插入一条设置历史记录
 * @param {string} userId 
 * @param {'race'|'profile'|'equipment'} changeType 
 * @param {object} snapshot 
 */
async function insertHistory(userId, changeType, snapshot) {
  const { error } = await _supabase
    .from('settings_history')
    .insert({
      user_id: userId,
      change_type: changeType,
      snapshot: snapshot,
    });

  if (error) {
    console.error('[auth] insertHistory error:', error.message);
    // 不抛出 — 历史记录写入失败不应阻断主流程
  }
}

/**
 * 查询最近的设置历史记录
 * @param {string} userId 
 * @param {number} limit 
 * @returns {Promise<Array>}
 */
async function loadHistory(userId, limit = 10) {
  try {
    const { data, error } = await _supabase
      .from('settings_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (e) {
    console.warn('[auth] loadHistory failed:', e.message);
    return [];
  }
}

// =============================================
// 首次登录 localStorage 数据迁移
// =============================================

/**
 * 检查是否有 localStorage 旧数据需要迁移到 Supabase
 * 仅在用户没有 Supabase 数据时执行（首次登录）
 * 使用 upsert 确保幂等性
 * @param {string} userId 
 */
async function migrateLocalStorageData(userId) {
  const migrationKey = 'trifit_migrated_' + userId;
  if (localStorage.getItem(migrationKey)) return; // 已迁移过

  try {
    const localRace = JSON.parse(localStorage.getItem('trifit_race') || 'null');
    const localProfile = JSON.parse(localStorage.getItem('trifit_profile') || 'null');
    const localEquipment = JSON.parse(localStorage.getItem('trifit_equipment') || 'null');

    // 只有有数据时才迁移
    const hasData = localRace || localProfile || localEquipment;
    if (!hasData) {
      localStorage.setItem(migrationKey, '1');
      return;
    }

    // 检查 Supabase 是否已有数据
    const { data: existingProfile } = await _supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (existingProfile) {
      // 已有数据，不需要迁移
      localStorage.setItem(migrationKey, '1');
      return;
    }

    // 执行迁移
    if (localProfile) {
      await saveProfile(userId, localProfile);
    }
    if (localRace) {
      await saveRace(userId, localRace);
    }
    if (localEquipment) {
      await saveEquipment(userId, localEquipment);
    }

    localStorage.setItem(migrationKey, '1');
    console.log('[auth] localStorage data migrated to Supabase');
  } catch (e) {
    console.warn('[auth] Migration failed (will retry next login):', e.message);
    // 不标记为已迁移，下次登录会重试
  }
}

// =============================================
// 工具函数
// =============================================

/**
 * 生成历史记录摘要文本
 * 使用 textContent 安全输出 — 防 XSS
 * @param {'race'|'profile'|'equipment'} changeType 
 * @param {object} snapshot 
 * @returns {string}
 */
function historyToSummary(changeType, snapshot) {
  switch (changeType) {
    case 'race':
      return `Updated race: ${snapshot.name || 'Unnamed'}${snapshot.date ? ', date: ' + snapshot.date : ''}`;
    case 'profile':
      return `Updated profile: ${snapshot.name || 'Unnamed'}${snapshot.level ? ', level: ' + snapshot.level : ''}`;
    case 'equipment':
      const items = [];
      if (snapshot.hasTrainer) items.push('trainer');
      if (snapshot.hasTreadmill) items.push('treadmill');
      return `Updated equipment: ${items.length > 0 ? items.join(', ') : 'none'}`;
    default:
      return `Updated ${changeType}`;
  }
}

/**
 * 相对时间格式化
 * @param {string} isoDate 
 * @returns {string}
 */
function timeAgo(isoDate) {
  const now = new Date();
  const date = new Date(isoDate);
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return Math.floor(seconds / 60) + ' min ago';
  if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
  if (seconds < 604800) return Math.floor(seconds / 86400) + ' days ago';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// =============================================
// 监听认证状态变化
// =============================================
_supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    // 可选：清除迁移标记以外的缓存
    // 保留 localStorage 数据作为离线缓存
  }
});
