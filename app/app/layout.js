import './globals.css';
import { Noto_Sans_Bengali, Noto_Serif_Bengali } from 'next/font/google';

const sans = Noto_Sans_Bengali({
  subsets: ['bengali', 'latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});

const serif = Noto_Serif_Bengali({
  subsets: ['bengali', 'latin'],
  weight: ['500', '600', '700'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata = {
  title: 'দিনের খবর | Diner Khobor',
  description:
    'বাংলাদেশ ও বিশ্বের গুরুত্বপূর্ণ খবর, ৫–১০ মিনিটে। মূল সংবাদসূত্রের লিংকসহ।',
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn" className={`${sans.variable} ${serif.variable}`}>
      <body>{children}</body>
    </html>
  );
}
