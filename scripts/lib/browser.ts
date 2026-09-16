/**
 * Playwright 브라우저 — 수집용.
 *
 * 로그인은 사람이 창에서 한 번(npm run login), 그 상태를 영구 프로필 폴더에 남겨
 * 다음부터는 그 프로필로 들어간다. 프로필은 data/sessions/ 아래에 있고 GitHub 에 올라가지 않는다.
 *
 * 수집기를 만들 때는 반드시 enforceReadOnly 를 켠다.
 */
import * as fs from 'fs';
import * as path from 'path';
import { chromium, type BrowserContext, type Page } from 'playwright';
import type { PlatformId } from '../platforms';

export const SESSION_DIR = path.join(process.cwd(), 'data', 'sessions');

export function profileDir(id: PlatformId): string {
  return path.join(SESSION_DIR, `${id}-profile`);
}

/**
 * 영구 프로필로 브라우저를 연다.
 *
 * visible   창을 화면에 띄운다 (로그인 · 시연)
 * offscreen 창은 띄우되 화면 밖에 둔다 — 창 없는 모드(headless)를 봇으로 보는 곳(쿠팡·네이버)용
 * 둘 다 없으면 창 없이 돈다.
 */
export async function openPersistent(
  id: PlatformId,
  opts: { visible?: boolean; offscreen?: boolean } = {},
): Promise<{ context: BrowserContext; page: Page }> {
  fs.mkdirSync(SESSION_DIR, { recursive: true });
  const args = ['--disable-blink-features=AutomationControlled'];
  if (opts.offscreen && !opts.visible) args.push('--window-position=-2400,-2400');
  const context = await chromium.launchPersistentContext(profileDir(id), {
    headless: !(opts.visible || opts.offscreen),
    viewport: { width: 1280, height: 900 },
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    args,
  });
  const page = context.pages()[0] ?? (await context.newPage());
  return { context, page };
}

/**
 * 읽기 전용 강제 — 조회(GET) 말고 모든 요청을 막는다.
 *
 * 수집 중에 무엇이 눌려도 어드민에 전달되지 않는다. 막은 요청 목록을 돌려준다.
 * - 로그인·인증 흐름은 막으면 안 되니 allow 로 통과시킨다.
 * - GraphQL 처럼 조회도 POST 로 하는 곳은, 본문이 query 이고 mutation 이 아닐 때만 통과시킨다.
 */
export async function enforceReadOnly(
  page: Page,
  allow: RegExp[] = [/login/i, /auth/i, /token/i, /session/i, /captcha/i],
): Promise<Set<string>> {
  const blocked = new Set<string>();
  await page.route('**/*', async route => {
    const req = route.request();
    const method = req.method();
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return route.continue();

    const url = req.url();
    if (allow.some(re => re.test(url))) return route.continue();

    const body = req.postData() || '';
    const graphqlRead = /graphql/i.test(url) && /"query"\s*:/.test(body) && !/\bmutation\b/.test(body);
    if (graphqlRead) return route.continue();

    blocked.add(`${method} ${url.split('?')[0]}`);
    // 앱이 멈추지 않도록 성공한 척 빈 응답을 돌려준다
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });
  return blocked;
}

/** 사람처럼 쉬기 — 동작 사이 1.5~3초. 사람은 1초에 한 번씩 스크롤하지 않는다 */
export const humanPause = () => new Promise(r => setTimeout(r, 1500 + Math.random() * 1500));
