'use client';

import { useEffect, useMemo, useState } from 'react';

const CATS = ['bangladesh', 'international', 'sports', 'entertainment'];
// How many stories the "All" view shows per category (total = 15)
const QUOTA = { bangladesh: 5, international: 4, sports: 3, entertainment: 3 };

const T = {
  bn: {
    brandSub: 'DINER KHOBOR',
    heroKicker: 'দৈনিক সংক্ষিপ্ত সংবাদ',
    heroTitle: 'আজকের গুরুত্বপূর্ণ খবর, ৫ মিনিটেই',
    heroSub: 'বাংলাদেশ ও বিশ্বের প্রধান সংবাদ—সংক্ষেপে, মূল সূত্রের লিংকসহ।',
    search: 'খবর খুঁজুন…',
    all: 'সব খবর',
    cats: { bangladesh: 'বাংলাদেশ', international: 'আন্তর্জাতিক', sports: 'খেলাধুলা', entertainment: 'বিনোদন' },
    read: 'মূল খবর পড়ুন',
    covered: (n) => `${n}টি সূত্রে প্রকাশিত`,
    updated: 'সর্বশেষ হালনাগাদ',
    noResults: 'এই অনুসন্ধানে কোনো খবর পাওয়া যায়নি।',
    emptyTitle: 'এই মুহূর্তে খবর আনা যাচ্ছে না',
    emptyText:
      'কোনো সংবাদসূত্র থেকে ফিড পাওয়া যায়নি। কিছুক্ষণ পরে আবার চেষ্টা করুন, অথবা lib/feeds.js ফাইলে ফিডের লিংক পরীক্ষা করুন।',
    foot1:
      'শিরোনাম ও সংক্ষিপ্ত অংশ মূল প্রকাশকদের। এই সাইট নিজে কোনো সংবাদ লেখে না; পূর্ণ খবরের জন্য মূল লিংকে যান।',
    sourcesOk: (a, b) => `${a}/${b}টি উৎস সক্রিয়`,
    sourcesLabel: 'উৎস',
    tz: 'ঢাকা (GMT+6)',
    note: 'খবরের লেখা মূল ভাষায় দেখানো হয়।',
  },
  en: {
    brandSub: 'DINER KHOBOR',
    heroKicker: 'DAILY NEWS BRIEFING',
    heroTitle: "Today's key stories in 5 minutes",
    heroSub: 'Top news from Bangladesh and the world—short, with links to the original sources.',
    search: 'Search news…',
    all: 'All',
    cats: { bangladesh: 'Bangladesh', international: 'International', sports: 'Sports', entertainment: 'Entertainment' },
    read: 'Read original',
    covered: (n) => `Covered by ${n} sources`,
    updated: 'Last updated',
    noResults: 'No stories match your search.',
    emptyTitle: 'News could not be loaded right now',
    emptyText:
      'No source feeds responded. Please try again shortly, or check the feed links in lib/feeds.js.',
    foot1:
      'Headlines and excerpts belong to the original publishers. This site writes no news of its own; follow the link for the full story.',
    sourcesOk: (a, b) => `${a}/${b} sources active`,
    sourcesLabel: 'Sources',
    tz: 'Dhaka (GMT+6)',
    note: 'Article text is shown in its original language.',
  },
};

export default function NewsApp({ stories, status, sources, generatedAt }) {
  const [lang, setLang] = useState('bn');
  const [cat, setCat] = useState('all');
  const [q, setQ] = useState('');
  const [now, setNow] = useState(null);

  const t = T[lang];
  const locale = lang === 'bn' ? 'bn-BD' : 'en-GB';
  const num = (n) => n.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US');
  const fmt = (opts, d) =>
    new Intl.DateTimeFormat(locale, { timeZone: 'Asia/Dhaka', ...opts }).format(d);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const counts = useMemo(() => {
    const c = {};
    stories.forEach((s) => (c[s.category] = (c[s.category] || 0) + 1));
    return c;
  }, [stories]);

  const list = useMemo(() => {
    const qn = q.trim().toLowerCase();
    let out = stories.filter(
      (s) =>
        (cat === 'all' || s.category === cat) &&
        (!qn || `${s.title} ${s.summary} ${s.source}`.toLowerCase().includes(qn))
    );
    if (cat === 'all' && !qn) {
      const used = {};
      out = out.filter((s) => {
        used[s.category] = (used[s.category] || 0) + 1;
        return used[s.category] <= QUOTA[s.category];
      });
      // Show the most important stories first
      out.sort((a, b) => b.score - a.score);
    }
    return out;
  }, [stories, cat, q]);

  const pill = (active) =>
    `whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
      active
        ? 'bg-navy text-white shadow-sm'
        : 'bg-navy-50 text-navy hover:bg-brand-light hover:text-brand-dark'
    }`;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-navy/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand font-serif text-2xl font-bold text-white">
              খ
            </div>
            <div className="leading-tight">
              <div className="font-serif text-2xl font-bold text-navy">দিনের খবর</div>
              <div className="text-[11px] font-semibold tracking-[0.25em] text-brand">
                {t.brandSub}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-sm font-semibold text-navy">
                {now ? fmt({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }, now) : '\u00A0'}
              </div>
              <div className="text-xs text-navy/60">
                {now ? fmt({ hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }, now) : '--:--'}
                {' · '}
                {t.tz}
              </div>
            </div>
            <div className="flex rounded-full border border-navy/15 p-1 text-sm font-semibold">
              <button
                onClick={() => setLang('bn')}
                className={`rounded-full px-3 py-1 ${lang === 'bn' ? 'bg-navy text-white' : 'text-navy'}`}
              >
                বাংলা
              </button>
              <button
                onClick={() => setLang('en')}
                className={`rounded-full px-3 py-1 ${lang === 'en' ? 'bg-navy text-white' : 'text-navy'}`}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-navy">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:py-14">
          <div className="mb-3 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            {t.heroKicker}
          </div>
          <h1 className="max-w-3xl font-serif text-3xl font-bold leading-snug text-white sm:text-5xl sm:leading-tight">
            {t.heroTitle}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-white/75 sm:text-lg">{t.heroSub}</p>
          <p className="mt-5 text-sm text-white/50">
            {t.updated}: {fmt({ day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }, generatedAt)}
            {' · '}
            {t.note}
          </p>
        </div>
        <div className="h-1 bg-brand" />
      </section>

      {/* Search and filters */}
      <div className="sticky top-0 z-20 border-b border-navy/10 bg-white/95 backdrop-blur">
        <div className="mx-auto max-w-6xl space-y-3 px-4 py-3">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.search}
            className="w-full rounded-xl border border-navy/15 bg-white px-4 py-3 text-base text-navy outline-none placeholder:text-navy/40 focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button onClick={() => setCat('all')} className={pill(cat === 'all')}>
              {t.all}
            </button>
            {CATS.map((c) => (
              <button key={c} onClick={() => setCat(c)} className={pill(cat === c)}>
                {t.cats[c]}
                <span className="ml-1.5 opacity-60">{num(counts[c] || 0)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* News */}
      <main className="mx-auto max-w-6xl px-4 py-8">
        {stories.length === 0 ? (
          <div className="rounded-2xl border border-navy/10 bg-navy-50 p-8 text-center">
            <h2 className="font-serif text-xl font-bold">{t.emptyTitle}</h2>
            <p className="mx-auto mt-2 max-w-xl text-navy/70">{t.emptyText}</p>
          </div>
        ) : list.length === 0 ? (
          <p className="py-16 text-center text-navy/60">{t.noResults}</p>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {list.map((s, i) => {
              const featured = i === 0 && !q.trim();
              return (
                <article
                  key={s.id}
                  className={`flex flex-col rounded-2xl border border-navy/10 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-lg ${
                    featured ? 'md:col-span-2' : ''
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="rounded-full bg-brand-light px-3 py-1 text-xs font-semibold text-brand-dark">
                      {t.cats[s.category]}
                    </span>
                    {s.sources.length > 1 && (
                      <span className="text-xs font-medium text-brand-dark">
                        ● {t.covered(num(s.sources.length))}
                      </span>
                    )}
                  </div>

                  {/* খবরের শিরোনাম, বিবরণ ও ছবি একসাথে সাজানো */}
                  <div className={`flex gap-4 ${featured ? 'sm:flex-row flex-col-reverse' : 'flex-col-reverse'}`}>
                    <div className="flex-1">
                      <h2
                        className={`font-serif font-bold leading-snug text-navy ${
                          featured ? 'text-2xl sm:text-3xl' : 'text-lg'
                        }`}
                      >
                        {s.title}
                      </h2>

                      {s.summary && (
                        <p className="mt-3 line-clamp-4 text-[15px] text-navy/75">{s.summary}</p>
                      )}
                    </div>

                    {/* ৩ নম্বর পয়েন্ট: RSS ফিড থেকে আসা ছবি এখানে শো করবে */}
                    {s.image && (
                      <img
                        src={s.image}
                        alt={s.title}
                        className={`object-cover rounded-xl border border-navy/10 flex-shrink-0 ${
                          featured ? 'w-full sm:w-72 h-48' : 'w-full sm:w-28 h-28'
                        }`}
                        loading="lazy"
                      />
                    )}
                  </div>

                  <div className="mt-auto pt-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-navy/10 pt-3 text-sm">
                      <div className="text-navy/60">
                        <span className="font-semibold text-navy">{s.source}</span>
                        {' · '}
                        {fmt({ day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }, s.published)}
                      </div>
                      <a
                        href={s.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-brand hover:text-brand-dark"
                      >
                        {t.read} →
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-navy/10 bg-navy-50">
        <div className="mx-auto max-w-6xl space-y-2 px-4 py-8 text-sm text-navy/65">
          <p>{t.foot1}</p>
          <p>
            <span className="font-semibold text-navy">{t.sourcesLabel}:</span> {sources.join(', ')}
          </p>
          <p>
            {t.sourcesOk(num(status.ok), num(status.total))}
            {status.failed.length > 0 && ` · ✕ ${status.failed.join(', ')}`}
          </p>
        </div>
      </footer>
    </div>
  );
}
