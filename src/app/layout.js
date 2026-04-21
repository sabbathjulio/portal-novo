import { Inter, Newsreader } from 'next/font/google';
import { ThemeProvider } from '@/components/ThemeProvider';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const newsreader = Newsreader({ 
  subsets: ['latin'],
  variable: '--font-newsreader',
  display: 'swap',
});

export const metadata = {
  title: 'Bernardes Corp - Portal Jurídico',
  description: 'Sistema de Gestão Jurídica de Alta Performace',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${newsreader.variable}`} suppressHydrationWarning>
      <body className="font-inter bg-stitch-bg dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 transition-colors duration-300">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
