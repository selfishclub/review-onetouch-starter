'use client';

import { useMemo, useState } from 'react';
import reviews from '@/sample/reviews.json';
import ReviewCard, { type Review } from './ReviewCard';

type Tab = 'queue' | 'insight' | 'settings';
type Filter = 'all' | Review['platform'];

const TABS: { id: Tab; label: string }[] = [
  { id: 'queue', label: '리뷰 답글달기' },
  { id: 'insight', label: '인사이트' },
  { id: 'settings', label: '설정' },
];

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'baemin', label: '배민' },
  { id: 'coupang', label: '쿠팡이츠' },
  { id: 'naver', label: '네이버' },
];

/**
 * 0단계 뼈대 — 가짜 리뷰 5건을 카드로 보여준다.
 * 데이터는 sample/reviews.json 한 파일. 2단계에서 DB 를 읽도록 바꾼다.
 */
export default function Home() {
  const [tab, setTab] = useState<Tab>('queue');
  const [filter, setFilter] = useState<Filter>('all');
  const list = useMemo(
    () => (reviews as Review[]).filter(r => filter === 'all' || r.platform === filter),
    [filter],
  );

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16">
      <header className="pb-4 pt-8">
        <p className="text-xs font-medium tracking-widest text-neutral-500">리뷰 원터치 · 0단계 뼈대</p>
        <h1 className="mt-1 text-2xl font-bold">오늘 답할 리뷰</h1>
        <p className="mt-1 text-sm text-neutral-600">지금은 가짜 리뷰입니다. 1단계부터 내 가게 리뷰로 바뀝니다.</p>
      </header>

      <nav aria-label="탭" className="sticky top-0 z-10 -mx-4 flex gap-1 border-b border-neutral-200 bg-[var(--bg)] px-4">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? 'page' : undefined}
            className={`-mb-px border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
              tab === t.id ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'queue' ? (
        <section className="mt-4 space-y-4">
          <div role="group" aria-label="플랫폼" className="flex flex-wrap gap-2">
            {FILTERS.map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                aria-pressed={filter === f.id}
                className={`rounded-full border px-3 py-1 text-sm ${
                  filter === f.id ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-300 bg-white text-neutral-700'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          {list.map(r => <ReviewCard key={r.id} review={r} />)}
          {list.length === 0 && <p className="py-10 text-center text-sm text-neutral-500">이 플랫폼 리뷰가 없습니다.</p>}
        </section>
      ) : (
        <section className="mt-10 rounded-xl border border-dashed border-neutral-300 p-8 text-center text-sm text-neutral-500">
          {tab === 'insight' ? '인사이트는 2단계에서 DB 가 생기면 채웁니다.' : '설정은 필요할 때 만듭니다.'}
        </section>
      )}
    </main>
  );
}
