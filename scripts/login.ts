/**
 * 로그인 — 사람이 창에서 직접 한다. (수집용 Playwright 브라우저)
 *
 * 프로그램이 아이디·비밀번호를 넣으면 플랫폼이 봇으로 본다.
 * 쿠팡은 로그인은 통과시키고 그 뒤 데이터만 막아서, 화면은 멀쩡한데 리뷰가 안 온다.
 * 그래서 이 스크립트는 창만 띄우고, 사람이 로그인하면 그 상태를 영구 프로필에 남긴다.
 *
 * 채우기용 에이전트 브라우저(ego lite · Aside)는 다른 브라우저라, 그 창에서 따로 한 번 로그인한다.
 *
 * 실행: npm run login -- baemin | coupang | naver
 */
import { PLATFORMS, type PlatformId } from './platforms';
import { openPersistent } from './lib/browser';

async function main() {
  const id = process.argv[2] as PlatformId;
  const p = PLATFORMS[id];
  if (!p) {
    console.log('사용법: npm run login -- baemin | coupang | naver');
    process.exit(1);
  }

  console.log(`\n▶ ${p.name} 로그인 창을 엽니다.`);
  console.log('  · 창에서 아이디·비밀번호를 직접 입력하세요. 새 기기 인증이 뜨면 휴대폰으로 승인하세요.');
  console.log('  · "비정상 접속" 같은 문구가 뜨면 창을 닫고 멈추세요. 여러 번 다시 시도하지 마세요.\n');

  const { context, page } = await openPersistent(id, { visible: true });
  await page.goto(p.loginUrl, { waitUntil: 'domcontentloaded' });

  // 로그인 화면을 벗어날 때까지 기다린다 (최대 10분)
  const deadline = Date.now() + 10 * 60_000;
  let ok = false;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 2000));
    if (page.isClosed()) break;
    const url = page.url();
    if (!p.loginMarker.test(url) && url !== 'about:blank') { ok = true; break; }
    process.stdout.write('\r  로그인 기다리는 중…');
  }

  if (ok) {
    await new Promise(r => setTimeout(r, 3000)); // 쿠키가 다 저장될 시간
    console.log(`\n\n  ✅ 로그인 확인 — ${p.name} 세션을 이 컴퓨터에 저장했습니다 (data/sessions/).`);
    console.log('  이 폴더는 비밀번호 없이 들어가는 열쇠입니다. 어디에도 올리지 마세요.');
    console.log('  수집기를 만들면, 화면이 아니라 리뷰 데이터가 실제로 오는지로 한 번 더 확인하세요.');
  } else {
    console.log('\n\n  ⚠️ 로그인을 확인하지 못했습니다. 창을 닫았거나 10분이 지났습니다.');
  }
  await context.close().catch(() => {});
  process.exit(ok ? 0 : 1);
}

main();
