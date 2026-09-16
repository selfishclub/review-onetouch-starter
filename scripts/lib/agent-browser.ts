/**
 * 에이전트 브라우저(ego lite · Aside) 고르기와 공통 동작.
 */
import { spawn, execFileSync } from 'node:child_process';
import * as fs from 'fs';
import { which } from './which';

export type AgentBrowser = 'ego' | 'aside';

/** .env.local 의 FILL_BROWSER, 없으면 맥은 ego lite 가 있으면 ego, 그 외는 aside */
export function pickBrowser(): AgentBrowser {
  const v = process.env.FILL_BROWSER;
  if (v === 'ego' || v === 'aside') return v;
  return process.platform === 'darwin' && which('ego-browser') ? 'ego' : 'aside';
}

export const browserName = (b: AgentBrowser) => (b === 'aside' ? 'Aside' : 'ego lite');

export const DOWNLOAD: Record<AgentBrowser, string> = {
  ego: 'https://lite.ego.app',
  aside: 'https://aside.com/download',
};

/** 앱이 설치돼 있나 (맥은 /Applications, 그 외는 CLI 로 판단) */
export function appInstalled(b: AgentBrowser): boolean {
  if (process.platform === 'darwin') {
    return fs.existsSync(b === 'aside' ? '/Applications/Aside.app' : '/Applications/ego lite.app');
  }
  return !!which(b === 'aside' ? 'aside' : 'ego-browser');
}

/** 주소를 사람이 보는 창으로 연다. 성공하면 true */
export function openVisible(b: AgentBrowser, url: string): boolean {
  try {
    if (process.platform === 'darwin') {
      const args = b === 'aside' ? ['-a', 'Aside', url] : ['-b', 'com.citrolabs.ego.lite', url];
      execFileSync('open', args, { stdio: 'ignore' });
      return true;
    }
  } catch { /* 아래로 */ }
  return false;
}

/** Aside REPL 을 한 번 돌리고 출력 전체를 돌려준다 */
export function asideRepl(code: string, timeoutMs = 60_000): Promise<string> {
  return new Promise(resolve => {
    const bin = which('aside');
    if (!bin) return resolve('ASIDE_CLI_MISSING');
    const child = spawn(bin, ['repl', code]);
    let out = '';
    child.stdout.on('data', d => { out += d.toString(); });
    child.stderr.on('data', d => { out += d.toString(); });
    const t = setTimeout(() => child.kill('SIGKILL'), timeoutMs);
    child.on('close', () => { clearTimeout(t); resolve(out); });
  });
}

/** Aside 창에 열린 탭 주소들 */
export async function asideTabUrls(): Promise<string[] | null> {
  const out = await asideRepl(`const t = await listBrowserTabs(); console.log('TABS:' + JSON.stringify(t.map(x => x.url || '')))`, 30_000);
  const line = out.split('\n').find(l => l.startsWith('TABS:'));
  if (!line) return null;
  try { return JSON.parse(line.slice(5)); } catch { return null; }
}
