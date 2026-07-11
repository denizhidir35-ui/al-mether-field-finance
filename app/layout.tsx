import "./globals.css";

export const metadata = {
  title: "AL Mether Platform",
  description: "CEO Flow Finance Platform"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}