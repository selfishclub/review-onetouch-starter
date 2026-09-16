# 리뷰 원터치 스타터 키트

배달의민족 · 쿠팡이츠 · 네이버 스마트플레이스 리뷰를 **한 화면에 모으고**, **내 말투로 답글 초안을 써두고**,
내가 승인하면 **어드민의 그 리뷰 답글칸까지 채워주는** 도구를 —
사장님이 **Claude Code 와 함께 직접 만드는** 키트입니다.

가게마다 쓰는 플랫폼도, 목적도, 컴퓨터도 다릅니다. 그래서 완성품을 드리지 않고
**뼈대와 안전장치, 그리고 AI 에게 시킬 순서**를 드립니다.

> 등록 버튼은 언제나 사람이 누릅니다. 이 키트의 어떤 코드도 답글을 올리지 않습니다.

---

## 들어 있는 것

| | 무엇 | 어디 |
|---|---|---|
| 뼈대 화면 | 가짜 리뷰 5건이 카드로 뜨는 웹페이지 (0단계 완성본) | `app/` · `sample/reviews.json` |
| 로그인 | 창을 띄우고 **사람이 직접** 로그인, 그 상태를 내 컴퓨터에만 저장 | `scripts/login.ts` |
| 수집 도구 | Playwright 영구 프로필 + **어드민 쓰기 차단(읽기 전용 강제)** | `scripts/lib/browser.ts` |
| 답글칸 채우기 | ego lite 또는 Aside 로 그 리뷰 답글칸에 초안을 넣고 **멈춤** | `scripts/fill.ts` |
| 준비 확인 | 빠진 것을 한 번에 알려줌 (플랫폼 접속 없음) | `scripts/check.ts` |
| 시키는 순서 | 설문 → PRD → 0~5단계 프롬프트 | [`docs/PROMPTS.md`](docs/PROMPTS.md) |
| 도구 고르기 | 수집은 왜 Playwright, 채우기는 왜 에이전트 브라우저인지 | [`docs/TOOLS.md`](docs/TOOLS.md) |
| 함정 모음 | 플랫폼마다 실제로 부딪힌 것 | [`docs/PITFALLS.md`](docs/PITFALLS.md) |
| 기획서 틀 | 설문 뒤에 AI 가 채울 PRD 모양 | [`docs/PRD_TEMPLATE.md`](docs/PRD_TEMPLATE.md) |
| AI 규칙 | Claude Code 가 이 폴더에서 지킬 선 | [`CLAUDE.md`](CLAUDE.md) |

수집기(플랫폼별로 리뷰를 가져오는 코드)는 **일부러 넣지 않았습니다.**
가게마다 쓰는 플랫폼이 다르고, 어드민 화면도 자주 바뀝니다.
`docs/PROMPTS.md` 의 1 · 2단계 프롬프트로 AI 가 내 가게에 맞게 만듭니다.

---

## 시작하기

### 0. 준비물

- [Claude Code](https://claude.com/claude-code) (구독)
- [Node.js](https://nodejs.org) 20 이상
- 쓰는 플랫폼의 사장님 계정
- 답글칸 채우기용 브라우저 하나 — **맥:** [ego lite](https://lite.ego.app) 또는 [Aside](https://aside.com/download) · **윈도우:** [Aside](https://aside.com/download)

### 1. 내려받기

맥이면 **바탕화면 · 문서 · 다운로드 폴더 밖**에 두세요. 그 안에 두면 밤 예약 실행이 파일을 못 읽습니다.

```bash
cd ~
git clone https://github.com/selfishclub/review-onetouch-starter.git
cd review-onetouch-starter
npm install
npx playwright install chromium
cp .env.example .env.local
```

`.env.local` 을 열어 **쓰는 플랫폼의 가게 번호**만 채웁니다. 주소에서 복사하는 법이 파일 안에 적혀 있습니다.

```bash
npm run check
```

"먼저 해결할 것" 이 비어 있을 때까지 고칩니다.

### 2. 뼈대 보기

```bash
npm run dev
```

브라우저에서 http://localhost:3000 — 가짜 리뷰 5건, 펼쳐진 초안 칸, 승인 버튼이 보이면 됩니다.

### 3. 설문 → 기획서(PRD)

이 폴더에서 Claude Code 를 열고, [`docs/PROMPTS.md`](docs/PROMPTS.md) 의 **첫 프롬프트**를 그대로 붙여넣습니다.
AI 가 한 번에 하나씩 물어보고, 끝나면 `docs/PRD.md` 를 씁니다.
(`docs/PRD.md` 에는 가게 정보가 들어가니 GitHub 에 올라가지 않게 막아뒀습니다.)

### 4. 한 단계씩

같은 문서의 **공통 규칙 + 1단계 프롬프트**부터. 앞 단계가 끝나야 다음으로 갑니다.
0~3단계까지 하고 며칠 초안을 읽어본 뒤 4 · 5단계로 가세요.

### 5. 로그인은 두 번

| 무엇을 위해 | 어디서 | 어떻게 |
|---|---|---|
| 수집 (밤에 혼자) | Playwright 창 | `npm run login -- baemin` · `coupang` · `naver` |
| 답글칸 채우기 | ego lite / Aside 창 | 그 브라우저에서 평소처럼 로그인 |

둘은 서로 다른 브라우저라 로그인이 공유되지 않습니다.
**짧은 시간에 로그인을 여러 번 하면 플랫폼이 계정을 잠급니다.** 하루에 한 곳씩 하세요.

### 6. 채우기 시험

```bash
npm run fill -- --selftest
```

브라우저가 붙는지만 봅니다(플랫폼 접속 없음). 통과하면 최근 리뷰 **한 건만**:

```bash
npm run fill -- --platform naver --find "리뷰 단 사람 닉네임" --text "답글 초안"
```

그 브라우저 창에 초안이 채워지고 멈춥니다. 읽어보고, 올릴 거면 **등록은 직접** 누릅니다.

---

## 넘지 않는 선

| 선 | 이유 |
|---|---|
| **등록 버튼은 사람이 누른다** | 올라가면 손님에게 바로 보이고, 플랫폼에 따라 고치거나 지울 수 없습니다 |
| **로그인은 사람이 창에서** | 코드가 아이디·비밀번호를 넣으면 봇으로 막힙니다 |
| **수집은 읽기 전용** | 조회가 아닌 요청은 네트워크에서 막습니다 (`enforceReadOnly`) |
| **제한 문구가 뜨면 멈춘다** | "비정상 동작" 을 무시하고 다시 시도하면 계정이 잠깁니다 |
| **한 건씩, 간격을 두고** | 연달아 돌리면 막힙니다 |
| **비밀은 올리지 않는다** | `.env.local` · `data/` (로그인 세션) · `docs/PRD.md` 는 `.gitignore` 에 있습니다 |

이 키트를 **공개 저장소로 복사해 쓴다면**, 올리기 전에 `git status` 로 위 파일이 빠져 있는지 꼭 보세요.

---

## 도구는 이렇게 나눕니다

| | 수집 (밤) | 답글칸 채우기 (아침) |
|---|---|---|
| 맥 | Playwright | ego lite 또는 Aside |
| 윈도우 | Playwright | Aside |

- **수집 = Playwright.** 사람 없이 창 없이 돌고, 어드민에 쓰기 요청을 막을 수 있는 건 Playwright 뿐입니다.
- **채우기 = 에이전트 브라우저.** 평소 쓰는 로그인을 그대로 쓰고, 사람이 보는 앞에서 한 건씩 채웁니다.

직접 설치해 비교한 결과는 [`docs/TOOLS.md`](docs/TOOLS.md) 에 있습니다.

---

## 폴더

```
app/                 뼈대 화면 (Next.js)
sample/reviews.json  가짜 리뷰 5건
scripts/
  platforms.ts       플랫폼 주소 · 버튼 글자 (화면이 바뀌면 여기만 고친다)
  login.ts           사람이 직접 로그인 → 세션 저장
  fill.ts            답글칸 채우기 (ego lite · Aside)
  check.ts           준비 확인
  lib/browser.ts     Playwright 영구 프로필 · 읽기 전용 강제
docs/
  PROMPTS.md         AI 에게 시키는 순서
  TOOLS.md           도구 고르기
  PITFALLS.md        함정 모음
  PRD_TEMPLATE.md    기획서 틀
data/                (내 컴퓨터에만) 세션 · 수집 결과 · 로그
```

## 이 키트가 낡는 곳

플랫폼 화면(버튼 이름, 두 단계로 열리는 입력칸 등)은 **2026년 9월 기준**입니다.
어드민이 바뀌면 `scripts/platforms.ts` 의 글자를 고치거나, AI 에게 "화면이 바뀐 것 같다, 다시 알아내라" 고 하세요.
넘지 않는 선은 바뀌지 않습니다.
