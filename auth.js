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
