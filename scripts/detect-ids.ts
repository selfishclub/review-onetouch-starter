/**
 * 가게 번호 채우기 — 로그인된 어드민 주소에서 읽어 .env.local 에 넣는다.
 *
 * 사람이 번호를 찾아 옮겨 적지 않아도 된다.
 *   · Aside 면 열린 탭 주소를 읽는다.
 *   · 그 외에는 어드민 주소를 붙여 넣는다:  npm run detect-ids -- "https://self.baemin.com/shops/…"
 * 이미 있는 값은 바꾸지 않는다. .env.local 이 없으면 .env.example 로 만든다.
 *
 * 실행: npm run detect-ids [-- 주소 …]
 */
import * as fs from 'fs';
import * as path from 'path';
import { pickBrowser, asideTabUrls } from './lib/agent-browser';

const RULES: { key: string; name: string; re: RegExp }[] = [
  { key: 'BAEMIN_SHOP_ID', name: '배민', re: /self\.baemin\.com\/shops\/(\d+)/ },
  { key: 'COUPANG_STORE_ID', name: '쿠팡이츠', re: /coupangeats\.com\/merchant\/[^\s]*?(?:storeId=|\/home\/|\/stores?\/)(\d+)/ },
  { key: 'NAVER_PLACE_ID', name: '네이버', re: /smartplace\.naver\.com\/bizes\/place\/(\d+)/ },
];

async function main() {
  const root = process.cwd();
  const envPath = path.join(root, '.env.local');
  if (!fs.existsSync(envPath)) {
    fs.copyFileSync(path.join(root, '.env.example'), envPath);
    console.log('📄 .env.local 을 만들었습니다 (.env.example 복사).');
  }

  let urls = process.argv.slice(2).filter(a => /^https?:\/\//.test(a));
  if (urls.length === 0 && pickBrowser() === 'aside') {
    const tabs = await asideTabUrls();
    if (tabs === null) {
      console.log('⚠️ Aside 에 연결하지 못했습니다. Aside 를 켜고 다시 실행하거나, 어드민 주소를 붙여 넣으세요.');
      process.exit(1);
    }
    urls = tabs;
  }
  if (urls.length === 0) {
    console.log('어드민 주소를 붙여 넣어 주세요: npm run detect-ids -- "https://self.baemin.com/shops/…/reviews"');
    process.exit(1);
  }

  let env = fs.readFileSync(envPath, 'utf8');
  const found: string[] = [];
  for (const rule of RULES) {
    const hit = urls.map(u => u.match(rule.re)?.[1]).find(Boolean);
    const cur = env.match(new RegExp(`^${rule.key}=(.*)$`, 'm'))?.[1]?.trim();
    if (!hit) { console.log(`  ·  ${rule.name} — 열린 어드민이 없어 건너뜀${cur ? ` (지금 값 ${cur})` : ''}`); continue; }
    if (cur) { console.log(`  ·  ${rule.name} — 이미 ${cur} (바꾸지 않음)`); continue; }
    env = new RegExp(`^${rule.key}=`, 'm').test(env)
      ? env.replace(new RegExp(`^${rule.key}=.*$`, 'm'), `${rule.key}=${hit}`)
      : `${env.trimEnd()}\n${rule.key}=${hit}\n`;
    found.push(rule.name);
    console.log(`  ✅ ${rule.name} — ${hit}`);
  }
  fs.writeFileSync(envPath, env);
  console.log(found.length ? `\n.env.local 에 저장했습니다. 다음: npm run check` : '\n새로 채운 값이 없습니다.');
}

main();
