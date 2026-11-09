import { getNews } from '../lib/news';
import NewsApp from '../components/NewsApp';

// Refresh the page data every 15 minutes (free on Vercel Hobby)
export const revalidate = 900;

export default async function Page() {
  const data = await getNews();
  return <NewsApp {...data} />;
}
