/**
 * 에이전트 브라우저 창에 로그인 화면을 띄운다 — 답글칸 채우기용.
 *
 * 비밀번호는 사람이 그 창에서 직접 입력한다. 이 스크립트는 창을 열고,
 * (Aside 면) 로그인이 끝나 그 사이트 안으로 들어갈 때까지 탭 주소만 지켜본다.
 * 플랫폼에 요청을 더 보내지 않는다. 로그인 화면을 여러 번 열지 않는다.
 *
 * 실행: npm run login:agent -- baemin | coupang | naver
 */
import { PLATFORMS, type PlatformId } from './platforms';
import { pickBrowser, browserName, appInstalled, openVisible, asideRepl, asideTabUrls, DOWNLOAD } from './lib/agent-browser';

const INSIDE: Record<PlatformId, RegExp> = {
  baemin: /baemin\.com/,
  coupang: /coupangeats\.com/,
  naver: /smartplace\.naver\.com/,
};

async function main() {
  const id = process.argv[2] as PlatformId;
  const p = PLATFORMS[id];
  if (!p) { console.log('사용법: npm run login:agent -- baemin | coupang | naver'); process.exit(1); }

  const b = pickBrowser();
  const name = browserName(b);
  if (!appInstalled(b)) {
    console.log(`⚠️ ${name} 가 설치돼 있지 않습니다. 여기서 받으세요: ${DOWNLOAD[b]}`);
    process.exit(1);
  }

  console.log(`\n🔐 ${p.name} 로그인 — ${name} 창`);
  if (b === 'aside') {
    const urls = await asideTabUrls();
    if (urls === null) {
      console.log('⚠️ Aside 에 연결하지 못했습니다. Aside 를 켜고 창을 하나 연 뒤 다시 실행하세요.');
      process.exit(1);
    }
    if (urls.some(u => INSIDE[id].test(u) && !p.loginMarker.test(u))) {
      console.log('  ✅ 이미 로그인된 탭이 있습니다.');
      return;
    }
  }

  if (!openVisible(b, p.loginUrl)) {
    if (b === 'aside') {
      await asideRepl(`await openTab(${JSON.stringify(p.loginUrl)})`, 30_000);
      console.log('  👉 Aside 사이드바의 "Agent Tabs" 묶음에 로그인 탭을 열었습니다.');
    } else {
      console.log(`  👉 ${name} 창에서 이 주소를 여세요: ${p.loginUrl}`);
    }
  } else {
    console.log(`  👉 ${name} 창에 로그인 화면을 띄웠습니다.`);
  }
  console.log('     아이디·비밀번호는 직접 입력하세요. 새 기기 인증이 뜨면 휴대폰으로 승인하세요.');
  console.log('     "보호조치" · "비정상 접속" 이 뜨면 멈추고, 오늘은 다시 시도하지 마세요.\n');

  if (b !== 'aside') {
    console.log('  로그인이 끝나면 npm run detect-ids 로 가게 번호를 채우세요.');
    return;
  }

  // Aside 는 탭 주소로 로그인 완료를 알 수 있다 (최대 10분)
  const deadline = Date.now() + 10 * 60_000;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 4000));
    const urls = await asideTabUrls();
    if (urls && urls.some(u => INSIDE[id].test(u) && !p.loginMarker.test(u))) {
      console.log(`\n  ✅ 로그인 확인 (${name}). 다음: npm run detect-ids`);
      return;
    }
    process.stdout.write('\r  ⏳ 로그인 기다리는 중…');
  }
  console.log('\n  ⚠️ 10분 안에 로그인이 확인되지 않았습니다.');
  process.exit(1);
}

main();
