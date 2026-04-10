const SUPABASE_URL = 'https://nxcfvvaywbruwktsgdic.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54Y2Z2dmF5d2JydXdrdHNnZGljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MDY1MzMsImV4cCI6MjA5MTI4MjUzM30.eBoDWWkxGfbZXKNvhLDCaH4RsTFvPNsTY2bV3dufs70';

const args = Object.fromEntries(process.argv.slice(2).map(s => {
  const [k, ...rest] = s.split('=');
  return [k.replace(/^--/, ''), rest.join('=')];
}));

const aEmail = args.aEmail;
const aPass = args.aPass;
const bEmail = args.bEmail;
const bPass = args.bPass;

if (!aEmail || !aPass || !bEmail || !bPass) {
  console.error('Usage: node docs/qa-user-isolation-runner.js --aEmail=... --aPass=... --bEmail=... --bPass=...');
  process.exit(2);
}

function h(token, extra = {}) {
  return {
    apikey: SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function req(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { ok: res.ok, status: res.status, data };
}

async function signIn(email, password) {
  return req(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: h(null),
    body: JSON.stringify({ email, password }),
  });
}

async function insertRace(token, userId, marker) {
  return req(`${SUPABASE_URL}/rest/v1/race_settings`, {
    method: 'POST',
    headers: h(token, { Prefer: 'return=representation' }),
    body: JSON.stringify([{ user_id: userId, name: marker, date: '2026-11-01', type: 'olympic', goal_time: '02:29:59' }]),
  });
}

async function insertActivity(token, userId, marker) {
  return req(`${SUPABASE_URL}/rest/v1/activities`, {
    method: 'POST',
    headers: h(token, { Prefer: 'return=representation' }),
    body: JSON.stringify([{ user_id: userId, activity_type: 'run', date: '2026-04-10', duration_min: 46, distance_m: 10100, notes: `QA location=${marker}` }]),
  });
}

async function readProfile(token, userId) {
  return req(`${SUPABASE_URL}/rest/v1/profiles?select=id,height,weight,age,name&id=eq.${userId}`, {
    method: 'GET',
    headers: h(token),
  });
}

async function readRaceByUser(token, userId) {
  return req(`${SUPABASE_URL}/rest/v1/race_settings?select=id,user_id,name,date&type=eq.olympic&user_id=eq.${userId}`, {
    method: 'GET',
    headers: h(token),
  });
}

async function readActivityByUser(token, userId, marker) {
  const enc = encodeURIComponent(`QA location=${marker}`);
  return req(`${SUPABASE_URL}/rest/v1/activities?select=id,user_id,notes,activity_type&user_id=eq.${userId}&notes=eq.${enc}`, {
    method: 'GET',
    headers: h(token),
  });
}

async function patchActivity(token, id, notes) {
  return req(`${SUPABASE_URL}/rest/v1/activities?id=eq.${id}`, {
    method: 'PATCH',
    headers: h(token, { Prefer: 'return=representation' }),
    body: JSON.stringify({ notes }),
  });
}

async function deleteById(table, token, id) {
  return req(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'DELETE',
    headers: h(token, { Prefer: 'return=representation' }),
  });
}

function row(name, pass, detail = '') {
  return { name, pass, detail };
}

(async () => {
  const tag = `ISO_${Date.now()}`;
  const markerA = `A_${tag}`;
  const markerB = `B_${tag}`;

  console.log('=== TriFit 用户隔离 QA（现有账号）===');

  const inA = await signIn(aEmail, aPass);
  const inB = await signIn(bEmail, bPass);

  if (!inA.ok || !inB.ok) {
    console.error('登录失败');
    console.error('A:', inA.status, JSON.stringify(inA.data));
    console.error('B:', inB.status, JSON.stringify(inB.data));
    process.exit(2);
  }

  const tokenA = inA.data.access_token;
  const tokenB = inB.data.access_token;
  const userA = inA.data.user.id;
  const userB = inB.data.user.id;

  const insRaceA = await insertRace(tokenA, userA, markerA);
  const insRaceB = await insertRace(tokenB, userB, markerB);
  const insActA = await insertActivity(tokenA, userA, markerA);
  const insActB = await insertActivity(tokenB, userB, markerB);

  const raceAId = insRaceA.data?.[0]?.id;
  const raceBId = insRaceB.data?.[0]?.id;
  const actAId = insActA.data?.[0]?.id;
  const actBId = insActB.data?.[0]?.id;

  const checks = [];

  const A_own_profile = await readProfile(tokenA, userA);
  const A_read_B_profile = await readProfile(tokenA, userB);
  const B_own_profile = await readProfile(tokenB, userB);
  const B_read_A_profile = await readProfile(tokenB, userA);

  checks.push(row('A可读取自己profile(含身高体重字段)', A_own_profile.ok && Array.isArray(A_own_profile.data) && A_own_profile.data.length <= 1));
  checks.push(row('A不可读取B的profile', A_read_B_profile.ok && Array.isArray(A_read_B_profile.data) && A_read_B_profile.data.length === 0, JSON.stringify(A_read_B_profile.data)));
  checks.push(row('B可读取自己profile(含身高体重字段)', B_own_profile.ok && Array.isArray(B_own_profile.data) && B_own_profile.data.length <= 1));
  checks.push(row('B不可读取A的profile', B_read_A_profile.ok && Array.isArray(B_read_A_profile.data) && B_read_A_profile.data.length === 0, JSON.stringify(B_read_A_profile.data)));

  const A_read_B_race = await readRaceByUser(tokenA, userB);
  const B_read_A_race = await readRaceByUser(tokenB, userA);
  checks.push(row('A不可读取B的比赛日/比赛设置', A_read_B_race.ok && Array.isArray(A_read_B_race.data) && A_read_B_race.data.length === 0, JSON.stringify(A_read_B_race.data)));
  checks.push(row('B不可读取A的比赛日/比赛设置', B_read_A_race.ok && Array.isArray(B_read_A_race.data) && B_read_A_race.data.length === 0, JSON.stringify(B_read_A_race.data)));

  const A_read_B_act = await readActivityByUser(tokenA, userB, markerB);
  const B_read_A_act = await readActivityByUser(tokenB, userA, markerA);
  checks.push(row('A不可读取B的活动/位置相关内容', A_read_B_act.ok && Array.isArray(A_read_B_act.data) && A_read_B_act.data.length === 0, JSON.stringify(A_read_B_act.data)));
  checks.push(row('B不可读取A的活动/位置相关内容', B_read_A_act.ok && Array.isArray(B_read_A_act.data) && B_read_A_act.data.length === 0, JSON.stringify(B_read_A_act.data)));

  const A_patch_B = actBId ? await patchActivity(tokenA, actBId, 'A tried modify B') : { ok: false, data: 'no actBId' };
  const B_patch_A = actAId ? await patchActivity(tokenB, actAId, 'B tried modify A') : { ok: false, data: 'no actAId' };
  const A_del_B = actBId ? await deleteById('activities', tokenA, actBId) : { ok: false, data: 'no actBId' };
  const B_del_A = actAId ? await deleteById('activities', tokenB, actAId) : { ok: false, data: 'no actAId' };

  checks.push(row('A不可更新B活动', A_patch_B.ok && Array.isArray(A_patch_B.data) && A_patch_B.data.length === 0, JSON.stringify(A_patch_B.data)));
  checks.push(row('B不可更新A活动', B_patch_A.ok && Array.isArray(B_patch_A.data) && B_patch_A.data.length === 0, JSON.stringify(B_patch_A.data)));
  checks.push(row('A不可删除B活动', A_del_B.ok && Array.isArray(A_del_B.data) && A_del_B.data.length === 0, JSON.stringify(A_del_B.data)));
  checks.push(row('B不可删除A活动', B_del_A.ok && Array.isArray(B_del_A.data) && B_del_A.data.length === 0, JSON.stringify(B_del_A.data)));

  // cleanup own test records only
  if (actAId) await deleteById('activities', tokenA, actAId);
  if (actBId) await deleteById('activities', tokenB, actBId);
  if (raceAId) await deleteById('race_settings', tokenA, raceAId);
  if (raceBId) await deleteById('race_settings', tokenB, raceBId);

  const failed = checks.filter(c => !c.pass);

  console.log('\n=== QA结果 ===');
  for (const c of checks) {
    console.log(`${c.pass ? 'PASS' : 'FAIL'} - ${c.name}`);
  }

  console.log('\n=== 结论 ===');
  if (failed.length === 0) {
    console.log('✅ 全部通过：未发现跨用户读/写/改/删越权');
    process.exit(0);
  }

  console.log(`❌ 失败 ${failed.length} 项`);
  failed.forEach(f => console.log('-', f.name, f.detail));
  process.exit(1);
})();