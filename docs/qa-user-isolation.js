const SUPABASE_URL = 'https://nxcfvvaywbruwktsgdic.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im54Y2Z2dmF5d2JydXdrdHNnZGljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3MDY1MzMsImV4cCI6MjA5MTI4MjUzM30.eBoDWWkxGfbZXKNvhLDCaH4RsTFvPNsTY2bV3dufs70';

const now = Date.now();
const pass = 'QaPass1234';

function headers(token, extra = {}) {
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
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { ok: res.ok, status: res.status, data };
}

async function signUp(email, password) {
  return req(`${SUPABASE_URL}/auth/v1/signup`, {
    method: 'POST',
    headers: headers(null),
    body: JSON.stringify({ email, password }),
  });
}

async function signIn(email, password) {
  return req(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: headers(null),
    body: JSON.stringify({ email, password }),
  });
}

async function upsertProfile(token, userId, marker) {
  return req(`${SUPABASE_URL}/rest/v1/profiles`, {
    method: 'POST',
    headers: headers(token, { Prefer: 'resolution=merge-duplicates,return=representation' }),
    body: JSON.stringify([{ id: userId, name: marker, height: 181.1, weight: 71.2, age: 31 }]),
  });
}

async function insertRace(token, userId, marker) {
  return req(`${SUPABASE_URL}/rest/v1/race_settings`, {
    method: 'POST',
    headers: headers(token, { Prefer: 'return=representation' }),
    body: JSON.stringify([{ user_id: userId, name: marker, date: '2026-11-01', type: 'olympic', goal_time: '02:30:00' }]),
  });
}

async function upsertEquipment(token, userId) {
  return req(`${SUPABASE_URL}/rest/v1/equipment_settings`, {
    method: 'POST',
    headers: headers(token, { Prefer: 'resolution=merge-duplicates,return=representation' }),
    body: JSON.stringify([{ user_id: userId, has_trainer: true, has_treadmill: false }]),
  });
}

async function insertActivity(token, userId, marker) {
  return req(`${SUPABASE_URL}/rest/v1/activities`, {
    method: 'POST',
    headers: headers(token, { Prefer: 'return=representation' }),
    body: JSON.stringify([{ user_id: userId, activity_type: 'run', date: '2026-04-10', duration_min: 45, distance_m: 10000, notes: `Weather location test: ${marker}` }]),
  });
}

async function selectByUser(table, token, userId) {
  return req(`${SUPABASE_URL}/rest/v1/${table}?select=*&user_id=eq.${userId}`, {
    method: 'GET',
    headers: headers(token),
  });
}

async function selectProfileById(token, id) {
  return req(`${SUPABASE_URL}/rest/v1/profiles?select=*&id=eq.${id}`, {
    method: 'GET',
    headers: headers(token),
  });
}

async function updateActivityById(token, id, note) {
  return req(`${SUPABASE_URL}/rest/v1/activities?id=eq.${id}`, {
    method: 'PATCH',
    headers: headers(token, { Prefer: 'return=representation' }),
    body: JSON.stringify({ notes: note }),
  });
}

async function deleteActivityById(token, id) {
  return req(`${SUPABASE_URL}/rest/v1/activities?id=eq.${id}`, {
    method: 'DELETE',
    headers: headers(token, { Prefer: 'return=representation' }),
  });
}

function check(name, pass, detail) {
  return { name, pass, detail };
}

(async () => {
  const emailA = `qa_a_${now}@example.com`;
  const emailB = `qa_b_${now}@example.com`;

  console.log('=== TriFit 多用户隔离 QA 开始 ===');
  console.log('A:', emailA);
  console.log('B:', emailB);

  await signUp(emailA, pass);
  await signUp(emailB, pass);

  const inA = await signIn(emailA, pass);
  const inB = await signIn(emailB, pass);

  if (!inA.ok || !inB.ok || !inA.data?.access_token || !inB.data?.access_token) {
    console.error('\n[BLOCKED] 无法自动登录两个测试用户。');
    console.error('A signIn:', inA.status, JSON.stringify(inA.data));
    console.error('B signIn:', inB.status, JSON.stringify(inB.data));
    console.error('可能原因：Supabase 启用了邮箱确认，需先完成邮件验证。');
    process.exit(2);
  }

  const tokenA = inA.data.access_token;
  const tokenB = inB.data.access_token;
  const userA = inA.data.user.id;
  const userB = inB.data.user.id;

  const markerA = `A_ONLY_${now}`;
  const markerB = `B_ONLY_${now}`;

  const pA = await upsertProfile(tokenA, userA, markerA);
  const rA = await insertRace(tokenA, userA, markerA);
  const eA = await upsertEquipment(tokenA, userA);
  const aA = await insertActivity(tokenA, userA, markerA);

  const pB = await upsertProfile(tokenB, userB, markerB);
  const rB = await insertRace(tokenB, userB, markerB);
  const eB = await upsertEquipment(tokenB, userB);
  const aB = await insertActivity(tokenB, userB, markerB);

  const activityAId = aA.data?.[0]?.id;
  const activityBId = aB.data?.[0]?.id;

  const reads = {
    A_read_A_profile: await selectProfileById(tokenA, userA),
    A_read_B_profile: await selectProfileById(tokenA, userB),
    B_read_B_profile: await selectProfileById(tokenB, userB),
    B_read_A_profile: await selectProfileById(tokenB, userA),
    A_read_B_race: await selectByUser('race_settings', tokenA, userB),
    B_read_A_race: await selectByUser('race_settings', tokenB, userA),
    A_read_B_activity: await selectByUser('activities', tokenA, userB),
    B_read_A_activity: await selectByUser('activities', tokenB, userA),
  };

  const mutate = {
    A_update_B_activity: activityBId ? await updateActivityById(tokenA, activityBId, 'A tried to modify B') : { ok: false, data: 'no id' },
    B_update_A_activity: activityAId ? await updateActivityById(tokenB, activityAId, 'B tried to modify A') : { ok: false, data: 'no id' },
    A_delete_B_activity: activityBId ? await deleteActivityById(tokenA, activityBId) : { ok: false, data: 'no id' },
    B_delete_A_activity: activityAId ? await deleteActivityById(tokenB, activityAId) : { ok: false, data: 'no id' },
  };

  const results = [];
  results.push(check('A可读取自己profile', reads.A_read_A_profile.ok && Array.isArray(reads.A_read_A_profile.data) && reads.A_read_A_profile.data.length === 1, reads.A_read_A_profile.data));
  results.push(check('A不可读取B的profile', reads.A_read_B_profile.ok && Array.isArray(reads.A_read_B_profile.data) && reads.A_read_B_profile.data.length === 0, reads.A_read_B_profile.data));
  results.push(check('B可读取自己profile', reads.B_read_B_profile.ok && Array.isArray(reads.B_read_B_profile.data) && reads.B_read_B_profile.data.length === 1, reads.B_read_B_profile.data));
  results.push(check('B不可读取A的profile', reads.B_read_A_profile.ok && Array.isArray(reads.B_read_A_profile.data) && reads.B_read_A_profile.data.length === 0, reads.B_read_A_profile.data));
  results.push(check('A不可读取B的比赛设置', reads.A_read_B_race.ok && Array.isArray(reads.A_read_B_race.data) && reads.A_read_B_race.data.length === 0, reads.A_read_B_race.data));
  results.push(check('B不可读取A的比赛设置', reads.B_read_A_race.ok && Array.isArray(reads.B_read_A_race.data) && reads.B_read_A_race.data.length === 0, reads.B_read_A_race.data));
  results.push(check('A不可读取B的活动', reads.A_read_B_activity.ok && Array.isArray(reads.A_read_B_activity.data) && reads.A_read_B_activity.data.length === 0, reads.A_read_B_activity.data));
  results.push(check('B不可读取A的活动', reads.B_read_A_activity.ok && Array.isArray(reads.B_read_A_activity.data) && reads.B_read_A_activity.data.length === 0, reads.B_read_A_activity.data));
  results.push(check('A不可更新B活动', mutate.A_update_B_activity.ok && Array.isArray(mutate.A_update_B_activity.data) && mutate.A_update_B_activity.data.length === 0, mutate.A_update_B_activity.data));
  results.push(check('B不可更新A活动', mutate.B_update_A_activity.ok && Array.isArray(mutate.B_update_A_activity.data) && mutate.B_update_A_activity.data.length === 0, mutate.B_update_A_activity.data));
  results.push(check('A不可删除B活动', mutate.A_delete_B_activity.ok && Array.isArray(mutate.A_delete_B_activity.data) && mutate.A_delete_B_activity.data.length === 0, mutate.A_delete_B_activity.data));
  results.push(check('B不可删除A活动', mutate.B_delete_A_activity.ok && Array.isArray(mutate.B_delete_A_activity.data) && mutate.B_delete_A_activity.data.length === 0, mutate.B_delete_A_activity.data));

  const allPass = results.every(r => r.pass);

  console.log('\n=== 写入结果 ===');
  console.log(JSON.stringify({
    profileA: pA.status,
    raceA: rA.status,
    equipmentA: eA.status,
    activityA: aA.status,
    profileB: pB.status,
    raceB: rB.status,
    equipmentB: eB.status,
    activityB: aB.status,
  }, null, 2));

  console.log('\n=== 隔离校验结果 ===');
  for (const r of results) {
    console.log(`${r.pass ? 'PASS' : 'FAIL'} - ${r.name}`);
  }

  console.log('\n=== 总结 ===');
  console.log(allPass ? '✅ 所有隔离用例通过' : '❌ 存在隔离失败用例');

  if (!allPass) {
    console.log('\n失败详情:');
    for (const r of results.filter(x => !x.pass)) {
      console.log('-', r.name, JSON.stringify(r.detail));
    }
    process.exit(1);
  }
})();