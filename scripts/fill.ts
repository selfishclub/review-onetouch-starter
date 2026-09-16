/**
 * 답글칸 채우기 — 에이전트 브라우저로 어드민의 그 리뷰 답글칸에 초안을 넣고 멈춘다.
 *
 * 등록 버튼은 누르지 않는다. 사람이 읽고 직접 누른다.
 *
 * 브라우저 (.env.local 의 FILL_BROWSER)
 *   ego    ego lite — 맥 전용
 *   aside  Aside    — 맥 · 윈도우
 * 둘 다 평소 쓰는 로그인을 그대로 쓴다. 그 브라우저 창에서 한 번 로그인해 두면 된다.
 * Playwright 로 채우지 않는 이유는 docs/TOOLS.md.
 *
 * 실행
 *   npm run fill -- --selftest                                       브라우저가 붙는지만 (플랫폼 접속 없음)
 *   npm run fill -- --platform naver  --find "닉네임" --text "초안"
 *   npm run fill -- --platform baemin --find "리뷰번호" --text-file draft.txt
 *
 * --find 는 그 리뷰 카드에만 있는 글자다. 배민은 리뷰번호, 네이버는 닉네임이 확실하다.
 * 쿠팡은 이름을 가려서(김*윤) 동명이인이 생긴다 — docs/PITFALLS.md.
 * 한 번에 한 건만 돌린다. 여러 건을 연달아 돌리면 플랫폼이 막는다.
 */
import { spawn } from 'node:child_process';
import * as fs from 'fs';
import { PLATFORMS, type PlatformId } from './platforms';
import { which } from './lib/which';

type Result = { ok: boolean; reason?: string; card?: string; len?: number };

const fromEnv = process.env.FILL_BROWSER;
const BROWSER: 'ego' | 'aside' =
  fromEnv === 'ego' || fromEnv === 'aside'
    ? fromEnv
    : process.platform === 'darwin' && which('ego-browser') ? 'ego' : 'aside';
const BROWSER_NAME = BROWSER === 'aside' ? 'Aside' : 'ego lite';

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

// ── 페이지 안에서 도는 코드 ──────────────────────────────────
// 문자열로 둔다. 함수로 넘기면 tsx 가 끼워 넣는 도우미 때문에 페이지에서 깨진다.
// 설정 P 를 인자로 받는다.

/** 안내 팝업은 닫기만 누른다 — 확인·동의 버튼은 누르지 않는다 */
const CLOSE_POPUPS = String.raw`(() => {
  const closers = ['하루 동안 보지 않기', '오늘 하루 보지 않기', '다시 보지 않기'];
  document.querySelectorAll('button').forEach(b => {
    const t = (b.innerText || '').trim();
    if (closers.some(c => t.includes(c))) b.click();
  });
  document.querySelectorAll('[aria-label="닫기"],[aria-label="close"],[title="닫기"]').forEach(b => b.click());
})()`;

/**
 * 그 리뷰 카드에 표시를 달아둔다. 화면 전체에서 버튼을 찾으면 맨 위 리뷰에 쓰게 된다.
 * 단서가 든 가장 작은 조각에서 시작해, 답글 버튼이 들어올 때까지만 부모로 올라간다.
 */
const MARK_CARD = String.raw`(P => {
  const hasOpener = el => [...el.querySelectorAll('button,a')]
    .some(b => P.openLabels.some(l => (b.innerText || '').includes(l)));
  const seeds = [...document.querySelectorAll('li,div,article,section,tr')]
    .filter(e => (e.innerText || '').includes(P.needle) && (e.innerText || '').length < 2000);
  let el = seeds[seeds.length - 1];
  if (!el) return null;
  for (let up = 0; up < 8 && !hasOpener(el); up++) {
    if (!el.parentElement || (el.parentElement.innerText || '').length > 2600) break;
    el = el.parentElement;
  }
  if (!hasOpener(el)) return null;
  document.querySelectorAll('[data-onetouch]').forEach(x => x.removeAttribute('data-onetouch'));
  el.setAttribute('data-onetouch', '1');
  el.scrollIntoView({ block: 'center' });
  return (el.innerText || '').replace(/\s+/g, ' ').slice(0, 120);
})`;

/** 입력칸은 그 카드 안(쿠팡은 바로 아래 줄)에서만 찾는다 — 화면에 하나뿐인 입력칸을 답글칸으로 여기지 않는다 */
const HAS_BOX = String.raw`(() => {
  const el = document.querySelector('[data-onetouch]');
  if (!el) return false;
  if (el.querySelector('textarea, [contenteditable="true"]')) return true;
  const next = el.nextElementSibling;
  return !!(next && next.querySelector('textarea, [contenteditable="true"]'));
})()`;

/** 여는 버튼을 하나 누른다. 올리기 버튼일 수 있는 글자는 절대 누르지 않는다 */
const OPEN_STEP = String.raw`(P => {
  const el = document.querySelector('[data-onetouch]');
  if (!el) return 'no-card';
  const deny = new RegExp(P.neverClick);
  const tried = el.getAttribute('data-tried') || '';
  for (const label of P.openLabels) {
    if (tried.includes('|' + label)) continue;
    const b = [...el.querySelectorAll('button,a')].find(x => {
      const t = (x.innerText || '').trim();
      return t.includes(label) && !deny.test(t);
    });
    if (!b) continue;
    el.setAttribute('data-tried', tried + '|' + label);
    b.scrollIntoView({ block: 'center' });
    if (P.realClick) {
      const r = b.getBoundingClientRect();
      return 'point:' + Math.round(r.x + r.width / 2) + ',' + Math.round(r.y + r.height / 2);
    }
    b.click();
    return 'clicked:' + label;
  }
  return 'no-button';
})`;

/** React 입력칸은 value 만 바꾸면 안 먹는다 — 네이티브 setter + input 이벤트 */
const FILL_BOX = String.raw`(P => {
  const el = document.querySelector('[data-onetouch]');
  let box = el && el.querySelector('textarea, [contenteditable="true"]');
  if (!box && el && el.nextElementSibling) box = el.nextElementSibling.querySelector('textarea, [contenteditable="true"]');
  if (!box) return { ok: false, reason: '답글 입력칸이 열리지 않았습니다.' };
  if (box.tagName === 'TEXTAREA') {
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    box.focus();
    setter.call(box, P.text);
    box.dispatchEvent(new Event('input', { bubbles: true }));
    box.dispatchEvent(new Event('change', { bubbles: true }));
  } else {
    box.focus();
    box.innerText = P.text;
    box.dispatchEvent(new InputEvent('input', { bubbles: true }));
  }
  box.scrollIntoView({ block: 'center' });
  const now = (box.value != null ? box.value : box.innerText) || '';
  return { ok: now.length > 0, len: now.length };
})`;

/** 채운 뒤에도 그 카드에 단서가 그대로 있는지 — 엉뚱한 손님에게 남기느니 실패가 낫다 */
const LANDED = String.raw`(P => {
  const el = document.querySelector('[data-onetouch]');
  return !!el && (el.innerText || '').includes(P.needle);
})`;

interface Config {
  url: string;
  name: string;
  browserName: string;
  loginMarker: string;
  needle: string;
  text: string;
  openLabels: string[];
  neverClick: string;
  realClick: boolean;
  maxScrolls: number;
}

/** 두 브라우저에서 똑같이 도는 본문. 쓰는 이름: openOrReuseTab · js · click · wait · pageInfo · cliLog */
function body(cfg: Config): string {
  const J = JSON.stringify;
  return `
const P = ${J(cfg)};
const CLOSE_POPUPS = ${J(CLOSE_POPUPS)}, MARK_CARD = ${J(MARK_CARD)}, HAS_BOX = ${J(HAS_BOX)};
const OPEN_STEP = ${J(OPEN_STEP)}, FILL_BOX = ${J(FILL_BOX)}, LANDED = ${J(LANDED)};
const call = src => js('(' + src + ')(' + JSON.stringify(P) + ')');

await openOrReuseTab(P.url, { wait: true, timeout: 40 })
await wait(4)

if (new RegExp(P.loginMarker, 'i').test((await pageInfo()).url)) {
  cliLog('RESULT:' + JSON.stringify({ ok: false, reason: '로그인이 필요합니다. ' + P.browserName + ' 창에서 ' + P.name + '에 로그인해 주세요.' }))
} else {
  await js(CLOSE_POPUPS).catch(() => {})
  await wait(1.5)

  // 목록을 내리며 찾는다 — 상한을 두고, 사람처럼 쉬어 가며
  let found = false, timedOut = false
  for (let i = 0; i < P.maxScrolls; i++) {
    if (typeof __budgetEnd !== 'undefined' && Date.now() > __budgetEnd) { timedOut = true; break }
    found = await js('document.body.innerText.includes(' + JSON.stringify(P.needle) + ')')
    if (found) break
    await js('window.scrollBy(0, Math.round(window.innerHeight * 0.9))')
    await wait(1.5 + Math.random() * 1.5)
  }

  if (!found) {
    cliLog('RESULT:' + JSON.stringify({ ok: false, reason: timedOut
      ? '제한 시간 안에 이 리뷰를 찾지 못했습니다. 최근 리뷰로 다시 해보세요.'
      : '목록 앞쪽에서 이 리뷰를 찾지 못했습니다. 오래된 리뷰는 직접 찾아 주세요.' }))
  } else {
    const card = await call(MARK_CARD)
    if (!card) {
      cliLog('RESULT:' + JSON.stringify({ ok: false, reason: '이 리뷰의 답글 버튼을 찾지 못했습니다.' }))
    } else {
      const steps = []
      for (let round = 0; round < 3; round++) {
        if (await js(HAS_BOX)) break
        const step = await call(OPEN_STEP)
        steps.push(step)
        if (typeof step === 'string' && step.startsWith('point:')) {
          const [x, y] = step.slice(6).split(',').map(Number)
          await click([x, y])
        }
        if (step === 'no-button' || step === 'no-card') break
        await wait(2.5)
      }
      cliLog('열기 단계: ' + JSON.stringify(steps))

      const filled = await call(FILL_BOX)
      const landed = await call(LANDED)
      cliLog('RESULT:' + JSON.stringify(
        !filled.ok ? { ok: false, reason: filled.reason || '채우지 못했습니다.' }
        : !landed ? { ok: false, reason: '다른 리뷰에 들어갈 뻔해 중단했습니다.' }
        : { ok: true, card, len: filled.len }))
    }
  }
}
`;
}

/** ego lite — 도우미가 이미 있다. 채울 때마다 새 작업 공간을 쓴다(사장님이 넘겨받은 공간은 명령이 멈춘다) */
const EGO_PRELUDE = `await useOrCreateTaskSpace('리뷰 답글 채우기 ' + Date.now())\n`;

/**
 * Aside — REPL 위에 같은 이름을 만든다.
 * · 전역 page 와 겹치지 않게 __page · Aside 의 sleep 은 밀리초
 * · 같은 사이트 탭이 있으면 다시 쓴다 (창이 탭으로 가득 차지 않게)
 * · Aside 는 한 번에 2분까지만 돌아서 95초에 스스로 멈춘다
 */
const ASIDE_PRELUDE = String.raw`
const __budgetEnd = Date.now() + 95000;
let __page = null;
const openOrReuseTab = async (url) => {
  const want = new URL(url);
  const hit = (await listBrowserTabs()).find(t => { try { return new URL(t.url).host === want.host; } catch (e) { return false; } });
  if (hit) { __page = await attachBrowserTab(hit.targetId); await __page.goto(url); }
  else { __page = await openTab(url); }
  return __page;
};
const wait = (sec) => sleep(Math.round(sec * 1000));
const js = (code) => __page.evaluate(code);
const click = async (pt) => { const [x, y] = Array.isArray(pt) ? pt : [pt.x, pt.y]; await __page.mouse.click(x, y); };
const pageInfo = async () => ({ url: __page.url() });
const cliLog = (...a) => console.log(...a);
`;

function run(script: string): Promise<Result> {
  return new Promise(resolve => {
    const bin = which(BROWSER === 'aside' ? 'aside' : 'ego-browser');
    if (!bin) {
      return resolve({
        ok: false,
        reason: BROWSER === 'aside'
          ? 'Aside CLI 가 없습니다. Aside 앱을 설치한 뒤, 맥은 터미널에서  curl -fsSL https://releases.aside.com/install.sh | bash'
          : 'ego lite 가 없습니다. https://lite.ego.app 에서 설치하고 온보딩을 마쳐 주세요.',
      });
    }
    const child = BROWSER === 'aside'
      ? spawn(bin, ['repl', ASIDE_PRELUDE + script])
      : spawn(bin, ['nodejs']);
    if (BROWSER === 'ego') child.stdin?.end(EGO_PRELUDE + script);

    let out = '';
    child.stdout?.on('data', b => { out += b.toString(); process.stdout.write(b); });
    child.stderr?.on('data', b => { out += b.toString(); process.stderr.write(b); });
    const killer = setTimeout(() => child.kill('SIGKILL'), 5 * 60_000);

    child.on('close', () => {
      clearTimeout(killer);
      const line = out.match(/RESULT:(\{.*\})/)?.[1];
      if (line) {
        try { return resolve(JSON.parse(line)); } catch { /* 아래로 */ }
      }
      const reason =
        /user is controlling|taken control|no longer assigned/i.test(out)
          ? `${BROWSER_NAME} 창을 사람이 조작 중이라 멈췄습니다. 작업을 끝낸 뒤 다시 실행하세요.`
        : /isn't running|no normal browser window/i.test(out)
          ? `${BROWSER_NAME} 가 꺼져 있거나 창이 없습니다. 앱을 켜고 창을 하나 연 뒤 다시 실행하세요.`
        : /timeout|timed out/i.test(out)
          ? '시간이 너무 걸려 멈췄습니다.'
          : `${BROWSER_NAME} 가 응답하지 않았습니다. 앱이 켜져 있는지 확인하세요.`;
      resolve({ ok: false, reason });
    });
  });
}

async function main() {
  if (process.argv.includes('--selftest')) {
    console.log(`▸ ${BROWSER_NAME} 연결 확인 (example.com 만 엽니다)`);
    const res = await run(`
await openOrReuseTab('https://example.com', { wait: true })
await wait(1)
const title = await js('document.title')
cliLog('RESULT:' + JSON.stringify({ ok: true, card: title + ' @ ' + (await pageInfo()).url }))
`);
    console.log(res.ok ? `\n  ✅ ${BROWSER_NAME} 연결됨 — ${res.card}` : `\n  ⚠️ ${res.reason}`);
    process.exit(res.ok ? 0 : 1);
  }

  const id = arg('platform') as PlatformId;
  const p = PLATFORMS[id];
  const needle = arg('find');
  const file = arg('text-file');
  const text = file ? fs.readFileSync(file, 'utf8').trim() : arg('text');
  if (!p || !needle || !text) {
    console.log('사용법: npm run fill -- --platform baemin|coupang|naver --find "단서" --text "초안"');
    console.log('        npm run fill -- --selftest');
    process.exit(1);
  }
  if (!p.reviewsUrl) {
    console.log(`⚠️ .env.local 에 ${p.name} 가게 번호가 없습니다. .env.example 을 보고 채워 주세요.`);
    process.exit(1);
  }

  console.log(`▸ ${p.name} · 단서 "${needle}" · 브라우저 ${BROWSER_NAME}`);
  const res = await run(body({
    url: p.reviewsUrl,
    name: p.name,
    browserName: BROWSER_NAME,
    loginMarker: p.loginMarker.source,
    needle,
    text,
    openLabels: p.openLabels,
    neverClick: p.neverClick.source,
    realClick: p.realClick,
    maxScrolls: 20,
  }));

  if (res.ok) {
    console.log(`\n  ✅ 채웠습니다 (${res.len}자) — 들어간 카드: "${res.card}"`);
    console.log(`  👉 ${BROWSER_NAME} 창에서 읽어보고, 올릴 거면 등록 버튼은 직접 누르세요.`);
  } else {
    console.log(`\n  ⚠️ ${res.reason}`);
  }
  process.exit(res.ok ? 0 : 1);
}

main();
