/**
 * 준비 확인 — 무엇이 빠졌는지 한 번에 알려준다. 플랫폼에는 접속하지 않는다.
 *
 * 「세팅」 단계에서 꼭 필요한 것(Node · 부품 · .env.local · 폴더 위치)만 「먼저 해결할 것」으로 센다.
 * 가게 번호 · 로그인 · 에이전트 브라우저는 그걸 쓰는 단계에서 하니, 여기서는 「다음 단계에서」로만 보여 준다.
 * (세팅 직후 늘 「먼저 해결할 것」이 떠서 설치가 실패한 줄 아는 일이 있었다)
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
const later: string[] = [];
const next = (m: string, when: string) => { console.log(`  ·  ${m} — ${when}`); later.push(`${m} (${when})`); };

/** 로그인 흔적 — 프로필 폴더만 있고 쿠키가 없으면 창만 열었다 닫은 것이다 */
function hasLogin(dir: string): boolean {
  const cookie = ['Default/Cookies', 'Default/Network/Cookies'].map(f => path.join(dir, f)).find(f => fs.existsSync(f));
  return !!cookie && fs.statSync(cookie).size > 0;
}

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
    warn('.env.local 이 없습니다', 'cp .env.example .env.local');
  } else {
    ok('.env.local 있음');
    const used = Object.values(PLATFORMS).filter(p => p.reviewsUrl);
    if (used.length === 0) next('가게 번호', '2단계에서 로그인한 뒤 채웁니다');
    for (const p of used) ok(`${p.name} 가게 번호`);
  }

  console.log('\n3. 수집용 로그인 (Playwright)');
  for (const p of Object.values(PLATFORMS)) {
    if (!p.reviewsUrl) continue;
    if (hasLogin(profileDir(p.id))) ok(`${p.name} 로그인 흔적 있음 (실제로 되는지는 수집할 때 확인)`);
    else next(`${p.name} 로그인`, `그 플랫폼을 가져오는 단계에서  npm run login -- ${p.id}`);
  }

  console.log('\n4. 채우기용 에이전트 브라우저');
  const ego = which('ego-browser');
  const aside = which('aside');
  if (ego) ok('ego lite (ego-browser)');
  if (aside) ok('Aside CLI (aside)');
  if (!ego && !aside) {
    next('에이전트 브라우저', process.platform === 'darwin'
      ? '답글칸 채우기 단계에서 ego lite 또는 Aside 설치'
      : '답글칸 채우기 단계에서 Aside 설치 (윈도우는 Aside)');
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
    console.log('✅ 세팅 완료. 다음: README 의 「1단계」 프롬프트를 사장님께 보여주고 바로 실행할지 묻기.');
    if (later.length) {
      console.log('\n다음 단계에서 할 것 (지금 안 해도 됩니다):');
      later.forEach(t => console.log(`  · ${t}`));
    }
    console.log('');
  } else {
    console.log('먼저 해결할 것:');
    todo.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));
    console.log('');
  }
}

main();
