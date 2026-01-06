import './globals.css';

export const metadata = {
  title: 'Seoul Sound Map',
  description: '서울 자치구 위험도 사운드 인터랙티브 지도'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-ink text-white">
        {children}
      </body>
    </html>
  );
}
