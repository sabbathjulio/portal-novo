import { Inter, Cinzel } from 'next/font/google';
import './globals.css';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const cinzel = Cinzel({ 
  subsets: ['latin'],
  variable: '--font-cinzel',
  display: 'swap',
});

export const metadata = {
  title: 'Bernardes Corp - Portal Jurídico',
  description: 'Sistema de Gestão Jurídica de Alta Performace',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${cinzel.variable}`}>
      <body className="font-inter">
        {children}
      </body>
    </html>
  );
}
