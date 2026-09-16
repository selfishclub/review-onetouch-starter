'use client';

import { useState } from 'react';

export interface Review {
  id: string;
  platform: 'baemin' | 'coupang' | 'naver';
  /** 네이버 방문 리뷰는 별점이 없을 수 있다 */
  rating: number | null;
  /** YYYY-MM-DD */
  date: string;
  author: string;
  menu: string | null;
  content: string;
  draft: string;
}

const PLATFORM = {
  baemin: { name: '배민', cls: 'bg-teal-50 text-teal-800 border-teal-200' },
  coupang: { name: '쿠팡이츠', cls: 'bg-sky-50 text-sky-800 border-sky-200' },
  naver: { name: '네이버', cls: 'bg-green-50 text-green-800 border-green-200' },
} as const;

/** 리뷰 한 건 — 초안은 처음부터 펼쳐져 있고, 승인은 표시만 바뀐다 (0단계) */
export default function ReviewCard({ review }: { review: Review }) {
  const [draft, setDraft] = useState(review.draft);
  const [approved, setApproved] = useState(false);
  const p = PLATFORM[review.platform];

  return (
    <article className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <header className="flex flex-wrap items-center gap-2 text-sm">
        <span className={`rounded-md border px-2 py-0.5 text-xs font-semibold ${p.cls}`}>{p.name}</span>
        <span className="font-medium">{review.author}</span>
        {review.rating != null && (
          <span aria-label={`별점 ${review.rating}점`} className="text-amber-500">
            {'★'.repeat(review.rating)}
            <span className="text-neutral-300">{'★'.repeat(5 - review.rating)}</span>
          </span>
        )}
        <span className="ml-auto text-xs tabular-nums text-neutral-500">{review.date}</span>
      </header>

      {review.menu && <p className="mt-2 text-xs text-neutral-500">주문 · {review.menu}</p>}
      <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed">{review.content}</p>

      <label htmlFor={`draft-${review.id}`} className="mt-4 block text-xs font-semibold text-neutral-600">
        답글 초안
      </label>
      <textarea
        id={`draft-${review.id}`}
        value={draft}
        onChange={e => { setDraft(e.target.value); setApproved(false); }}
        rows={4}
        className="mt-1 w-full resize-y rounded-xl border border-neutral-300 bg-neutral-50 p-3 text-[15px] leading-relaxed focus:border-neutral-900 focus:outline-none"
      />

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-xs tabular-nums text-neutral-500">{draft.length}자</span>
        <button
          type="button"
          onClick={() => setApproved(a => !a)}
          aria-pressed={approved}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
            approved ? 'bg-emerald-600 text-white' : 'bg-neutral-900 text-white hover:bg-neutral-700'
          }`}
        >
          {approved ? '승인됨 ✓' : '승인'}
        </button>
      </div>
    </article>
  );
}
