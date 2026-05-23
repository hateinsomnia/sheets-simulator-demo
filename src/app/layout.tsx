import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Тренажёр таблиц — для 4–8 классов",
  description:
    "Интерактивный обучающий симулятор Excel/Google Sheets для школьников. 6 заданий: выделение, сортировка, поиск аномалий и закономерностей, фильтр и собственный бюджет на неделю.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={inter.variable}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
