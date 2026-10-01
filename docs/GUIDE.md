# 키트 안내 — 들어 있는 것 · 명령 · 지킬 선

AI 에게 시키는 순서(첫 프롬프트 · 단계 프롬프트)는 [README](../README.md) 에 있습니다. 이 문서는 참고용입니다.

---

## 들어 있는 것

| | 무엇 | 어디 |
|---|---|---|
| 뼈대 화면 | 가짜 리뷰 5건이 카드로 뜨는 웹페이지 (0단계 완성본) | `app/` · `sample/reviews.json` |
| 로그인 | 창을 띄우고 **사람이 직접** 로그인 — 수집용 · 채우기용 | `scripts/login.ts` · `scripts/login-agent.ts` |
| 가게 번호 | 로그인된 어드민 주소에서 읽어 `.env.local` 에 채움 | `scripts/detect-ids.ts` |
| 수집 도구 | Playwright 영구 프로필 + **어드민 쓰기 차단(읽기 전용 강제)** | `scripts/lib/browser.ts` |
| 답글칸 채우기 | ego lite 또는 Aside 로 그 리뷰 답글칸에 초안을 넣고 **멈춤** | `scripts/fill.ts` |
| 준비 확인 | 빠진 것을 한 번에 알려줌 (플랫폼 접속 없음) | `scripts/check.ts` |
| 시키는 순서 | 첫 프롬프트(기획 → 준비 → PRD) → 1~5단계 프롬프트 | [README](../README.md) |
| 도구 고르기 | 수집은 왜 Playwright, 채우기는 왜 에이전트 브라우저인지 | [`docs/TOOLS.md`](TOOLS.md) |
| 함정 모음 | 플랫폼마다 실제로 부딪힌 것 | [`docs/PITFALLS.md`](PITFALLS.md) |
| 기획서 틀 | 기획 질문 뒤에 AI 가 채울 PRD 모양 | [`docs/PRD_TEMPLATE.md`](PRD_TEMPLATE.md) |
| AI 규칙 | Claude Code 가 이 폴더에서 지킬 선 | [`CLAUDE.md`](../CLAUDE.md) |

수집기(플랫폼별로 리뷰를 가져오는 코드)는 **일부러 넣지 않았습니다.**
가게마다 쓰는 플랫폼이 다르고, 어드민 화면도 자주 바뀝니다.
README 의 1 · 2단계 프롬프트로 AI 가 내 가게에 맞게 만듭니다.

---

## 참고 — AI 가 쓰는 명령 (사장님은 몰라도 됩니다)

AI 는 키트를 받은 뒤 이 명령들로 준비합니다. 사장님이 직접 칠 일은 없습니다.

| 명령 | 하는 일 |
|---|---|
| `git clone https://github.com/selfishclub/review-onetouch-starter.git ~/review-onetouch-starter` | 키트 받기 (홈 폴더) |
| `npm install` | 필요한 부품 설치 |
| `npm run check` | 준비 점검 (플랫폼 접속 없음) |
| `npm run dev` | 뼈대 화면 — http://localhost:3000 |
| `npm run login -- 플랫폼` | 수집용 로그인 창 (Playwright) |
| `npm run login:agent -- 플랫폼` | 채우기용 로그인 창 (ego lite · Aside) |
| `npm run detect-ids` | 로그인된 어드민 주소에서 가게 번호 채우기 |
| `npm run fill -- --selftest` | 에이전트 브라우저가 붙는지 확인 |
| `npm run fill -- --platform 플랫폼 --find 단서 --text 초안` | 답글칸 한 건 채우기 — 등록은 안 누름 |

**로그인은 두 벌입니다.** 수집용(Playwright)과 채우기용(에이전트 브라우저)은 다른 브라우저라 로그인이 공유되지 않습니다.
**로그인과 플랫폼 접속은 한 번에 하나씩** 하세요. 여러 곳을 동시에 열거나, 실패했다고 같은 걸 연달아 다시 시도하면 플랫폼이 계정을 잠급니다.

---

## 넘지 않는 선

| 선 | 이유 |
|---|---|
| **등록 버튼은 사람이 누른다** | 올라가면 손님에게 바로 보이고, 플랫폼에 따라 고치거나 지울 수 없습니다 |
| **로그인은 사람이 창에서** | 코드가 아이디·비밀번호를 넣으면 봇으로 막힙니다 |
| **수집은 읽기 전용** | 조회가 아닌 요청은 네트워크에서 막습니다 (`enforceReadOnly`) |
| **제한 문구가 뜨면 멈춘다** | "비정상 동작" 을 무시하고 다시 시도하면 계정이 잠깁니다 |
| **한 번에 하나씩, 간격을 두고** | 여러 곳을 동시에 열거나 연달아 다시 시도하면 막힙니다 |
| **내 가게, 내 계정으로만** | 사장님 본인 계정으로 본인 가게 리뷰를 읽는 데만 씁니다. 자동 수집이 허용되는지는 플랫폼 약관마다 달라 **확인 필요**입니다. 남의 가게나 대량 수집에는 쓰지 않습니다 |
| **비밀은 올리지 않는다** | `.env.local` · `data/` (로그인 세션) · `docs/PRD.md` 는 `.gitignore` 에 있습니다 |

이 키트를 **공개 저장소로 복사해 쓴다면**, 올리기 전에 `git status` 로 위 파일이 빠져 있는지 꼭 보세요.

---

## 도구는 이렇게 나눕니다

| | 수집 (밤) | 답글칸 채우기 (아침) |
|---|---|---|
| 맥 | Playwright | ego lite 또는 Aside |
| 윈도우 | Playwright | Aside |

- **수집 = Playwright.** 사람 없이 창 없이 돌고, 어드민에 쓰기 요청을 막을 수 있는 건 Playwright 뿐입니다.
  네이버만은 Aside 로 수집해도 됩니다 — 로그인이 덜 막힙니다 ([`docs/TOOLS.md`](TOOLS.md)).
- **채우기 = 에이전트 브라우저.** 평소 쓰는 로그인을 그대로 쓰고, 사람이 보는 앞에서 한 건씩 채웁니다.

직접 설치해 비교한 결과는 [`docs/TOOLS.md`](TOOLS.md) 에 있습니다.

---

## 폴더

```
app/                 뼈대 화면 (Next.js)
sample/reviews.json  가짜 리뷰 5건
scripts/
  platforms.ts       플랫폼 주소 · 버튼 글자 (화면이 바뀌면 여기만 고친다)
  login.ts           수집용 로그인 창 — 사람이 직접 → 세션 저장
  login-agent.ts     채우기용 로그인 창 (ego lite · Aside)
  detect-ids.ts      어드민 주소 → 가게 번호
  fill.ts            답글칸 채우기 (ego lite · Aside)
  check.ts           준비 확인
  lib/browser.ts     Playwright 영구 프로필 · 읽기 전용 강제
docs/
  GUIDE.md           들어 있는 것 · 명령 · 지킬 선
  TOOLS.md           도구 고르기
  PITFALLS.md        함정 모음
  PRD_TEMPLATE.md    기획서 틀
data/                (내 컴퓨터에만) 세션 · 수집 결과 · 로그
```

---

## 이 키트가 낡는 곳

플랫폼 화면(버튼 이름, 두 단계로 열리는 입력칸 등)은 **2026년 9월 기준**입니다.
어드민이 바뀌면 `scripts/platforms.ts` 의 글자를 고치거나, AI 에게 "화면이 바뀐 것 같다, 다시 알아내라" 고 하세요.
넘지 않는 선은 바뀌지 않습니다.
