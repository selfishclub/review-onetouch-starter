/**
 * 명령 찾기 — PATH 에 없으면 설치 스크립트가 두는 ~/.local/bin 을 직접 본다.
 * 터미널 밖에서 뜬 프로세스(앱에서 연 npm run 등)는 셸 설정의 PATH 를 못 본다.
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFileSync } from 'node:child_process';

export function which(cmd: string): string | null {
  const win = process.platform === 'win32';
  try {
    const out = win
      ? execFileSync('where', [cmd], { stdio: 'pipe' })
      : execFileSync('/bin/sh', ['-c', `command -v ${cmd}`], { stdio: 'pipe' });
    const found = out.toString().split(/\r?\n/)[0].trim();
    if (found) return found;
  } catch { /* PATH 에 없음 */ }
  const local = path.join(os.homedir(), '.local', 'bin', win ? `${cmd}.exe` : cmd);
  return fs.existsSync(local) ? local : null;
}
