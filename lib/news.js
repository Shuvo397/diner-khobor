import { XMLParser } from 'fast-xml-parser';
import { FEEDS } from './feeds';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  processEntities: true,
});

const MAX_AGE_MS = 36 * 60 * 60 * 1000; // only stories from the last 36 hours
const PER_CATEGORY = 15;
const MAX_PER_SOURCE_BD = 3; // Bangladesh: spread stories across many newspapers
const MAX_PER_SOURCE = 8; // other categories have fewer sources
const SIMILARITY = 0.5; // headline overlap needed to treat two stories as the same event

// ---------- helpers ----------
const text = (v) => {
  if (v == null) return '';
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  if (Array.isArray(v)) return text(v[0]);
  if (typeof v === 'object') return text(v['#text']);
  return '';
};

const asArray = (v) => (v == null ? [] : Array.isArray(v) ? v : [v]);

const decode = (s) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');

const clean = (html) =>
  decode(String(html).replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();

const getLink = (item) => {
  const l = item.link;
  if (typeof l === 'string') return l.trim();
  if (Array.isArray(l)) {
    const alt = l.find((x) => x?.['@_rel'] === 'alternate') || l[0];
    return (alt?.['@_href'] || text(alt)).trim();
  }
  if (l && typeof l === 'object') return (l['@_href'] || text(l)).trim();
  return text(item.guid).trim();
};

// Find an image URL that the feed itself provides. Never invents one.
const getImage = (item) => {
  const urls = [];
  const sources = [
    ...asArray(item['media:content']),
    ...asArray(item['media:group']?.['media:content']),
    ...asArray(item['media:thumbnail']),
    ...asArray(item['enclosure']),
  ];
  for (const el of sources) {
    const url = el?.['@_url'];
    const type = el?.['@_type'] || '';
    const medium = el?.['@_medium'] || '';
    const isImage = !type && !medium ? true : type.startsWith('image') || medium === 'image';
    if (url && isImage) urls.push(url);
  }
  const html = [item['content:encoded'], item.description, item.content, item.summary]
    .map(text)
    .join(' ');
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (m) urls.push(decode(m[1]));

  const found = urls.map((u) => u.trim()).find((u) => /^https?:\/\//i.test(u));
  return found ? found.replace(/^http:\/\//i, 'https://') : '';
};

// Trim a feed description to a short summary WITHOUT adding anything new
const makeSummary = (raw, title) => {
  let s = clean(raw || '');
  s = s.replace(/The post .* appeared first on .*$/i, '').trim();
  if (!s) return '';
  const norm = (x) => x.toLowerCase().replace(/\s+/g, ' ');
  if (norm(s) === norm(title) || norm(s).startsWith(norm(title))) return '';
  if (s.length > 260) {
    const cut = s.slice(0, 260);
    const m = Math.max(
      cut.lastIndexOf('।'),
      cut.lastIndexOf('. '),
      cut.lastIndexOf('! '),
      cut.lastIndexOf('? ')
    );
    s = m > 120 ? cut.slice(0, m + 1) : cut.slice(0, cut.lastIndexOf(' ')) + '…';
  }
  return s;
};

const tokens = (title) =>
  new Set(
    title
      .toLowerCase()
      .split(/[^\p{L}\p{M}\p{N}]+/u)
      .filter((w) => w.length > 2)
  );

const jaccard = (a, b) => {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const w of a) if (b.has(w)) inter++;
  return inter / (a.size + b.size - inter);
};

// ---------- fetching ----------
async function fetchFeed(feed) {
  const res = await fetch(feed.url, {
    headers: {
      'User-Agent': 'DinerKhoborBot/1.0 (news briefing; links to original sources)',
      Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
    },
    signal: AbortSignal.timeout(8000),
    next: { revalidate: 900 },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const obj = parser.parse(await res.text());
  let items = obj?.rss?.channel?.item ?? obj?.feed?.entry ?? obj?.['rdf:RDF']?.item ?? [];
  if (!Array.isArray(items)) items = [items];

  return items
    .map((i) => {
      const title = clean(text(i.title));
      const date =
        text(i.pubDate) || text(i.published) || text(i.updated) || text(i['dc:date']);
      return {
        title,
        link: getLink(i),
        summary: makeSummary(
          text(i.description) || text(i.summary) || text(i['content:encoded']) || text(i.content),
          title
        ),
        image: getImage(i),
        source: feed.name,
        category: feed.category,
        published: new Date(date).getTime(),
      };
    })
    .filter((s) => s.title && s.link.startsWith('http') && Number.isFinite(s.published));
}

// ---------- ranking and de-duplication ----------
function rankCategory(items, now) {
  const sorted = [...items].sort((a, b) => b.published - a.published);
  const clusters = [];

  for (const item of sorted) {
    const tk = tokens(item.title);
    const home = clusters.find((c) => jaccard(c.tk, tk) >= SIMILARITY);
    if (home) home.items.push(item);
    else clusters.push({ tk, items: [item] });
  }

  const stories = clusters.map((c) => {
    // Representative = the version that has the longest summary
    const rep = [...c.items].sort((a, b) => b.summary.length - a.summary.length)[0];
    const sources = [...new Set(c.items.map((i) => i.source))];
    const hours = (now - rep.published) / 3.6e6;
    // Bangla headlines are shown first
    const isBangla = /[\u0980-\u09FF]/.test(rep.title);
    const score =
      (sources.length - 1) * 3 + Math.max(0, 36 - hours) / 6 + (isBangla ? 100 : 0);
    // The image always comes from the same source as the headline shown
    return { ...rep, sources, score };
  });

  stories.sort((a, b) => b.score - a.score);

  const limit = items[0]?.category === 'bangladesh' ? MAX_PER_SOURCE_BD : MAX_PER_SOURCE;
  const perSource = {};
  const picked = [];
  for (const s of stories) {
    perSource[s.source] = (perSource[s.source] || 0) + 1;
    if (perSource[s.source] > limit) continue;
    picked.push(s);
    if (picked.length >= PER_CATEGORY) break;
  }
  return picked;
}

// ---------- main ----------
export async function getNews() {
  const now = Date.now();
  const results = await Promise.allSettled(FEEDS.map(fetchFeed));

  const failed = [];
  const byCategory = {};
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      const fresh = r.value.filter((s) => now - s.published <= MAX_AGE_MS && s.published <= now + 3.6e6);
      (byCategory[FEEDS[i].category] ||= []).push(...fresh);
    } else {
      failed.push(FEEDS[i].name);
    }
  });

  const stories = [];
  for (const [cat, items] of Object.entries(byCategory)) {
    rankCategory(items, now).forEach((s, idx) => {
      stories.push({ id: `${cat}-${idx}`, ...s });
    });
  }

  return {
    stories,
    status: { total: FEEDS.length, ok: FEEDS.length - failed.length, failed },
    sources: [...new Set(FEEDS.map((f) => f.name))],
    generatedAt: now,
  };
}
