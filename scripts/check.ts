/**
 * 준비 확인 — 무엇이 빠졌는지 한 번에 알려준다. 플랫폼에는 접속하지 않는다.
 *
 * 실행: npm run check
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { PLATFORMS } from './platforms';
import { profileDir } from './lib/browser';
import { which } from './lib/which';

const todo: string[] = [];
const ok = (m: string) => console.log(`  ✅ ${m}`);
const warn = (m: string, fix?: string) => { console.log(`  ⚠️  ${m}`); if (fix) todo.push(fix); };

async function main() {
  console.log('\n리뷰 원터치 — 준비 확인 (플랫폼에는 접속하지 않습니다)\n');

  console.log('1. 도구');
  const major = Number(process.versions.node.split('.')[0]);
  if (major >= 20) ok(`Node ${process.versions.node}`);
  else warn(`Node ${process.versions.node} — 20 이상이 필요합니다`, 'Node.js 20 이상 설치 (https://nodejs.org)');

  try {
    const { chromium } = await import('playwright');
    if (fs.existsSync(chromium.executablePath())) ok('Playwright 크로미움');
    else warn('Playwright 크로미움이 없습니다', 'npx playwright install chromium');
  } catch {
    warn('Playwright 가 없습니다', 'npm install');
  }

  console.log('\n2. 설정 (.env.local)');
  if (!fs.existsSync(path.join(process.cwd(), '.env.local'))) {
    warn('.env.local 이 없습니다', 'cp .env.example .env.local  →  가게 번호 채우기');
  } else {
    ok('.env.local 있음');
    const used = Object.values(PLATFORMS).filter(p => p.reviewsUrl);
    if (used.length === 0) warn('가게 번호가 하나도 없습니다', '.env.local 에 쓰는 플랫폼의 가게 번호 넣기');
    for (const p of Object.values(PLATFORMS)) {
      if (p.reviewsUrl) ok(`${p.name} 가게 번호`);
      else console.log(`  ·  ${p.name} — 비어 있음 (안 쓰는 플랫폼이면 괜찮습니다)`);
    }
  }

  console.log('\n3. 수집용 로그인 (Playwright)');
  for (const p of Object.values(PLATFORMS)) {
    if (!p.reviewsUrl) continue;
    if (fs.existsSync(profileDir(p.id))) ok(`${p.name} 세션 있음`);
    else warn(`${p.name} 세션이 없습니다`, `npm run login -- ${p.id}`);
  }

  console.log('\n4. 채우기용 에이전트 브라우저');
  const ego = which('ego-browser');
  const aside = which('aside');
  if (ego) ok('ego lite (ego-browser)');
  if (aside) ok('Aside CLI (aside)');
  if (!ego && !aside) {
    warn('에이전트 브라우저가 없습니다',
      process.platform === 'darwin'
        ? 'ego lite(https://lite.ego.app) 또는 Aside(https://aside.com/download) 설치'
        : 'Aside 설치 (https://aside.com/download) — 윈도우는 Aside 를 씁니다');
  }
  if (process.env.FILL_BROWSER) console.log(`  ·  FILL_BROWSER=${process.env.FILL_BROWSER}`);
  console.log('  ·  그 브라우저 창에서도 쓰는 플랫폼마다 한 번씩 직접 로그인해 두세요.');

  if (process.platform === 'darwin') {
    console.log('\n5. 맥 폴더 위치');
    const home = os.homedir();
    const blocked = ['Desktop', 'Documents', 'Downloads'].map(d => path.join(home, d));
    if (blocked.some(d => process.cwd().startsWith(d + path.sep))) {
      warn('바탕화면 · 문서 · 다운로드 안에 있습니다 — 밤 예약 실행이 파일을 못 읽습니다',
        '프로젝트를 홈 폴더 바로 아래로 옮기기 (예: ~/review-onetouch)');
    } else {
      ok('예약 실행이 읽을 수 있는 위치');
    }
  }

  console.log('\n────────────────────────────────');
  if (todo.length === 0) {
    console.log('✅ 준비 완료. 다음: docs/PROMPTS.md 의 "설문 → PRD" 부터.\n');
  } else {
    console.log('먼저 해결할 것:');
    todo.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));
    console.log('');
  }
}

main();
