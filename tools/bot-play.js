const { chromium } = require('playwright');
const FILE = '/home/claude/spookmate_game/index.html';
const N = 80;

(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport:{width:390,height:844} })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { window.__bot = 1; window.__dpr = 0.25; });
  await p.route(/^https?:\/\//, r => r.abort());
  await p.goto('file://' + FILE);
  await p.waitForTimeout(400);

  await p.evaluate(() => {
    const S = __t.S;
    window.__BOT = {
      random: () => Math.random() < .02 ? (Math.random() < .5 ? 'W' : 'P') : null,
      lazy:   () => S.st === 'warn' ? (S.warnKind === 'R' ? 'W' : 'P') : null,
      naive:  () => S.st === 'warn' ? (S.warnKind === 'R' ? 'W' : 'P')
                  : S.ask ? (S.id === 'oiwa' ? 'P' : 'W') : null,
      good:   () => S.st === 'warn' ? (S.warnKind === 'R' ? 'W' : 'P')
                  : S.ask ? S.ask.w
                  : (S.st === 'strike' || (S.mood < 45 && Math.random() < .03)) ? 'P' : null
    };
    window.__run = (id, strat, n) => {
      const rows = [];
      for (let r = 0; r < n; r++) {
        __t.startDay(id);
        const bot = __BOT[strat];
        let g = 0;
        while (!S.over && g++ < 20000) {
          __t.step(1/60);
          if (S.over) break;
          const k = bot();
          if (k === 'W') __t.doWarn(); else if (k === 'P') __t.doPraise();
        }
        rows.push({ d: S.dish, t: +S.t.toFixed(1), hit: S.askHit, miss: S.askMiss });
      }
      return rows;
    };
  });

  const q = (a, f) => { const v = a.slice().sort((x,y)=>x-y); return v[Math.floor((v.length-1)*f)]; };
  const all = {};
  console.log('조합             판수  그릇 중앙값  하위25%  상위25%  최대  평균시간  질문정답률');
  for (const id of ['oiwa','yacha'])
    for (const strat of ['random','lazy','naive','good']) {
      const rows = await p.evaluate(([i,s,n]) => __run(i,s,n), [id, strat, N]);
      all[id+'/'+strat] = rows;
      const d = rows.map(r=>r.d), t = rows.map(r=>r.t);
      const hit = rows.reduce((s,r)=>s+r.hit,0), miss = rows.reduce((s,r)=>s+r.miss,0);
      console.log(
        (id+'/'+strat).padEnd(16), String(rows.length).padStart(4),
        String(q(d,.5)).padStart(10), String(q(d,.25)).padStart(8),
        String(q(d,.75)).padStart(8), String(Math.max(...d)).padStart(5),
        (t.reduce((a,c)=>a+c,0)/t.length).toFixed(0).padStart(7)+'초',
        ((hit+miss) ? Math.round(hit/(hit+miss)*100)+'%' : '—').padStart(10));
    }

  // 등급 기준 후보 검증: 전체 분포에서 각 임계값이 어느 비율에 걸리는지
  const pool = [].concat(...Object.values(all)).map(r=>r.d);
  console.log('\n전체 '+pool.length+'판 그릇 분포');
  for (const f of [.1,.25,.5,.75,.9,.97]) console.log('  상위 '+Math.round((1-f)*100)+'% 지점: '+q(pool,f)+'개');
  console.log('\nERRORS:', errs.length ? errs.slice(0,4) : 'none');
  require('fs').writeFileSync('rows.json', JSON.stringify(all));
  await b.close();
})();
