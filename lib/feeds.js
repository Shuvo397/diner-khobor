// Each feed: a name (shown on cards), an RSS/Atom URL, and a category.
// Categories: 'bangladesh' | 'international' | 'sports' | 'entertainment'
// If a feed stops working, the site simply skips it.

export const FEEDS = [
  // Bangladesh
  { name: 'প্রথম আলো', url: 'https://www.prothomalo.com/feed', category: 'bangladesh' },
  { name: 'The Daily Star', url: 'https://www.thedailystar.net/frontpage/rss.xml', category: 'bangladesh' },
  { name: 'Dhaka Tribune', url: 'https://www.dhakatribune.com/feed/bangladesh', category: 'bangladesh' },
  { name: 'জাগো নিউজ ২৪', url: 'https://www.jagonews24.com/rss/rss.xml', category: 'bangladesh' },
  { name: 'বাংলা ট্রিবিউন', url: 'https://www.banglatribune.com/feed', category: 'bangladesh' },
  { name: 'আজকের পত্রিকা', url: 'https://www.ajkerpatrika.com/feed/', category: 'bangladesh' },
  { name: 'রাইজিংবিডি', url: 'https://www.risingbd.com/rss/rss.xml', category: 'bangladesh' },
  { name: 'ডেইলি বাংলাদেশ', url: 'https://www.daily-bangladesh.com/rss/rss.xml', category: 'bangladesh' },
  { name: 'বিডি২৪লাইভ', url: 'https://www.bd24live.com/bangla/feed/', category: 'bangladesh' },
  { name: 'আমাদের সময়', url: 'https://www.amadershomoy.com/feed', category: 'bangladesh' },
  { name: 'দ্য ঢাকা পোস্ট', url: 'https://thedhakapost.com/rss.xml', category: 'bangladesh' },

  // International
  { name: 'বিবিসি বাংলা', url: 'https://feeds.bbci.co.uk/bengali/rss.xml', category: 'international' },
  { name: 'BBC News', url: 'https://feeds.bbci.co.uk/news/world/rss.xml', category: 'international' },
  { name: 'Al Jazeera', url: 'https://www.aljazeera.com/xml/rss/all.xml', category: 'international' },

  // Sports
  { name: 'BBC Sport', url: 'https://feeds.bbci.co.uk/sport/rss.xml', category: 'sports' },
  { name: 'ESPNcricinfo', url: 'https://www.espncricinfo.com/rss/content/story/feeds/0.xml', category: 'sports' },

  // Entertainment
  { name: 'BBC Entertainment', url: 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml', category: 'entertainment' },
  { name: 'Variety', url: 'https://variety.com/feed/', category: 'entertainment' },
  { name: 'Dhaka Tribune বিনোদন', url: 'https://www.dhakatribune.com/feed/entertainment', category: 'entertainment' },
];
