/**
 * 플랫폼 설정 — 주소와 버튼 글자.
 *
 * 가게 번호는 코드에 적지 않고 .env.local 에서 읽는다.
 * 어드민 화면이 바뀌면 이 파일의 글자만 고치면 된다.
 */
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

export type PlatformId = 'baemin' | 'coupang' | 'naver';

export interface Platform {
  id: PlatformId;
  name: string;
  /** 사람이 직접 로그인하는 화면 */
  loginUrl: string;
  /** 주소에 이 글자가 있으면 아직 로그인 화면이다 */
  loginMarker: RegExp;
  /** 리뷰 목록 주소. 가게 번호가 비어 있으면 null */
  reviewsUrl: string | null;
  /** 답글칸을 여는 버튼 글자 — 앞에서부터 시도한다 */
  openLabels: string[];
  /**
   * 절대 누르지 않을 버튼 글자 — 올리기(등록) 버튼일 수 있다.
   * 배민·쿠팡은 여는 버튼 이름에도 「등록」이 들어가서(예: 사장님 댓글 등록하기)
   * 글자가 정확히 「등록」인 버튼만 막는다. 네이버는 「등록」이 들어가면 전부 막는다.
   */
  neverClick: RegExp;
  /** 스크립트 클릭을 무시하는 곳은 좌표로 진짜 클릭한다 */
  realClick: boolean;
}

const env = (k: string) => (process.env[k] || '').trim();

export const PLATFORMS: Record<PlatformId, Platform> = {
  baemin: {
    id: 'baemin',
    name: '배달의민족',
    loginUrl: 'https://biz-member.baemin.com/login',
    loginMarker: /\/login/i,
    reviewsUrl: env('BAEMIN_SHOP_ID') ? `https://self.baemin.com/shops/${env('BAEMIN_SHOP_ID')}/reviews` : null,
    openLabels: ['사장님 댓글 등록하기', '사장님 댓글', '댓글쓰기'],
    neverClick: /^(등록|저장|완료|수정 완료)$/,
    realClick: false,
  },
  coupang: {
    id: 'coupang',
    name: '쿠팡이츠',
    loginUrl: 'https://store.coupangeats.com/merchant/login',
    loginMarker: /\/merchant\/login/i,
    reviewsUrl: env('COUPANG_STORE_ID')
      ? `https://store.coupangeats.com/merchant/management/reviews?storeId=${env('COUPANG_STORE_ID')}`
      : null,
    openLabels: ['사장님 댓글 등록하기', '사장님 댓글', '댓글 작성', '댓글쓰기'],
    neverClick: /^(등록|저장|완료|작성 완료)$/,
    realClick: true,
  },
  naver: {
    id: 'naver',
    name: '네이버 스마트플레이스',
    loginUrl: 'https://nid.naver.com/nidlogin.login?mode=form&url=https%3A%2F%2Fnew.smartplace.naver.com%2F',
    loginMarker: /nid\.naver\.com/i,
    reviewsUrl: env('NAVER_PLACE_ID') ? `https://new.smartplace.naver.com/bizes/place/${env('NAVER_PLACE_ID')}/reviews` : null,
    // 네이버는 자체 AI 초안이 붙은 리뷰가 있다 — 펼친 뒤 「이 답글 수정」을 눌러야 입력칸이 열린다
    openLabels: ['AI가 답글 초안을 작성했어요', '이 답글 수정', '답글 쓰기'],
    neverClick: /등록|게시|저장|완료/,
    realClick: false,
  },
};
