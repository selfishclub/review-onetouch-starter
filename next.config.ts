import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // next dev 가 CLAUDE.md 에 영어 안내를 덧붙이지 않게 — 사장님 폴더가 바뀐 상태가 되어 키트 업데이트 때 부딪힌다.
  // Next.js 문서는 CLAUDE.md 「먼저」 3번에서 node_modules/next/dist/docs/ 로 직접 가리킨다.
  agentRules: false,
};

export default nextConfig;
